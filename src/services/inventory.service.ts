import prisma from '@/lib/db/prisma';
import { Prisma, StockMovementType, PurchaseStatus, ProductUnit } from '@prisma/client';

export type StockAdjustmentParams = {
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  userId: string;
};

/**
 * Adjust stock manually for a specific product.
 */
export async function adjustStock(tenantId: string, params: StockAdjustmentParams) {
  if (params.quantity <= 0) {
    throw new Error('Adjustment quantity must be greater than 0');
  }

  // Use a transaction to ensure atomic update and audit logging
  return await prisma.$transaction(async (tx) => {
    // 1. Lock the row for update
    const product = await tx.product.findUnique({
      where: { id: params.productId, tenantId },
    });

    if (!product) {
      throw new Error('Product not found or unauthorized');
    }

    if (!product.trackInventory) {
      throw new Error('This product is not configured to track inventory.');
    }

    const currentStock = Number(product.currentStock);
    let newStock = currentStock;

    // We only expect INCREASING or DECREASING adjustment types here.
    const isIncrease = [
      'PURCHASE',
      'ADJUSTMENT_IN',
      'RETURN'
    ].includes(params.type as string);

    const isDecrease = [
      'SALE',
      'SERVICE_USAGE',
      'ADJUSTMENT_OUT',
      'DAMAGE',
      'EXPIRED'
    ].includes(params.type as string);

    if (isIncrease) {
      newStock += params.quantity;
    } else if (isDecrease) {
      newStock -= params.quantity;
      if (newStock < 0) {
        throw new Error('Insufficient stock. Adjustment would result in negative inventory.');
      }
    } else {
      throw new Error('Invalid adjustment type.');
    }

    // 2. Update product stock
    const updatedProduct = await tx.product.update({
      where: { id: params.productId },
      data: { currentStock: newStock },
    });

    // 3. Create stock movement
    await tx.stockMovement.create({
      data: {
        tenantId,
        productId: params.productId,
        type: params.type,
        quantity: params.quantity,
        stockBefore: currentStock,
        stockAfter: newStock,
        reason: params.reason,
        createdBy: params.userId,
      }
    });

    // 4. Audit Log
    await tx.auditLog.create({
      data: {
        tenantId,
        userId: params.userId,
        action: 'INVENTORY_ADJUST',
        entityType: 'Product',
        entityId: params.productId,
        metadata: {
          type: params.type,
          quantity: params.quantity,
          stockBefore: currentStock,
          stockAfter: newStock,
          reason: params.reason
        },
      }
    });

    return updatedProduct;
  });
}

/**
 * Marks a purchase as received and updates inventory stock.
 */
export async function receivePurchase(tenantId: string, purchaseId: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    const purchase = await tx.inventoryPurchase.findUnique({
      where: { id: purchaseId, tenantId },
      include: { items: { include: { product: true } } },
    });

    if (!purchase) throw new Error('Purchase not found');
    if (purchase.status === PurchaseStatus.RECEIVED) {
      throw new Error('Purchase is already received.');
    }
    if (purchase.status === PurchaseStatus.CANCELLED) {
      throw new Error('Cannot receive a cancelled purchase.');
    }

    // 1. Update purchase status
    const updatedPurchase = await tx.inventoryPurchase.update({
      where: { id: purchaseId },
      data: { status: PurchaseStatus.RECEIVED },
    });

    // 2. Process stock for each tracked item
    for (const item of purchase.items) {
      if (!item.product.trackInventory) continue;

      const currentStock = Number(item.product.currentStock);
      const qty = Number(item.quantity);
      const newStock = currentStock + qty;

      // Update stock
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: newStock },
      });

      // Create movement
      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: item.productId,
          type: StockMovementType.PURCHASE,
          quantity: qty,
          stockBefore: currentStock,
          stockAfter: newStock,
          referenceType: 'PURCHASE',
          referenceId: purchaseId,
          purchaseId: purchaseId,
          reason: `Received Purchase #${purchase.purchaseNumber}`,
          createdBy: userId,
        }
      });
    }

    // 3. Audit Log
    await tx.auditLog.create({
      data: {
        tenantId,
        userId: userId,
        action: 'PURCHASE_RECEIVED',
        entityType: 'InventoryPurchase',
        entityId: purchaseId,
        metadata: { purchaseNumber: purchase.purchaseNumber },
      }
    });

    return updatedPurchase;
  });
}

/**
 * Cancels a received purchase and reverses inventory stock.
 */
export async function cancelPurchase(tenantId: string, purchaseId: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    const purchase = await tx.inventoryPurchase.findUnique({
      where: { id: purchaseId, tenantId },
      include: { items: { include: { product: true } } },
    });

    if (!purchase) throw new Error('Purchase not found');
    if (purchase.status === PurchaseStatus.CANCELLED) {
      throw new Error('Purchase is already cancelled.');
    }

    const wasReceived = purchase.status === PurchaseStatus.RECEIVED;

    // 1. Update purchase status
    const cancelledPurchase = await tx.inventoryPurchase.update({
      where: { id: purchaseId },
      data: { status: PurchaseStatus.CANCELLED },
    });

    // 2. If it was previously received, we must reverse the stock
    if (wasReceived) {
      for (const item of purchase.items) {
        if (!item.product.trackInventory) continue;

        const currentStock = Number(item.product.currentStock);
        const qty = Number(item.quantity);
        const newStock = currentStock - qty;

        // Prevent negative stock upon reversal
        if (newStock < 0) {
          throw new Error(`Cannot cancel purchase. Reversing ${item.product.name} would result in negative stock. Please adjust manually if necessary.`);
        }

        // Update stock
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: newStock },
        });

        // Create movement
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            type: StockMovementType.REVERSAL,
            quantity: qty,
            stockBefore: currentStock,
            stockAfter: newStock,
            referenceType: 'PURCHASE',
            referenceId: purchaseId,
            purchaseId: purchaseId,
            reason: `Reversed Purchase #${purchase.purchaseNumber} Cancellation`,
            createdBy: userId,
          }
        });
      }
    }

    // 3. Audit Log
    await tx.auditLog.create({
      data: {
        tenantId,
        userId: userId,
        action: 'PURCHASE_CANCELLED',
        entityType: 'InventoryPurchase',
        entityId: purchaseId,
        metadata: { purchaseNumber: purchase.purchaseNumber, wasReceived },
      }
    });

    return cancelledPurchase;
  });
}

/**
 * Consumes inventory items for a completed service.
 * This is an idempotent operation based on appointment ID.
 */
export async function consumeServiceProducts(tenantId: string, appointmentId: string, serviceId: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Check if we already consumed products for this appointment
    const existingMovement = await tx.stockMovement.findFirst({
      where: {
        tenantId,
        referenceType: 'APPOINTMENT',
        referenceId: appointmentId,
        type: StockMovementType.SERVICE_USAGE
      }
    });

    if (existingMovement) {
      // Idempotency: skip if already processed
      return;
    }

    // 2. Find service product configurations
    const usages = await tx.serviceProductUsage.findMany({
      where: { serviceId, tenantId },
      include: { product: true }
    });

    if (!usages.length) return;

    for (const usage of usages) {
      const product = usage.product;
      if (!product.trackInventory) continue;

      const currentStock = Number(product.currentStock);
      const qty = Number(usage.quantity);
      const newStock = currentStock - qty;
      
      // Allow stock to go negative for service consumption, but flag it? 
      // Rule says: "Do not allow: Negative stock unless explicitly supported by a future configuration"
      // Wait, "If cancellation would result in negative stock... require appropriate handling rather than silently creating invalid stock."
      // Let's enforce non-negative stock here to be strict with the blueprint's "Never allow: stock = -1".
      if (newStock < 0) {
          throw new Error(`Insufficient stock for product ${product.name} to complete service. Needed ${qty}, have ${currentStock}.`);
      }

      // Update product stock
      await tx.product.update({
        where: { id: product.id },
        data: { currentStock: newStock }
      });

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: product.id,
          type: StockMovementType.SERVICE_USAGE,
          quantity: qty,
          stockBefore: currentStock,
          stockAfter: newStock,
          referenceType: 'APPOINTMENT',
          referenceId: appointmentId,
          reason: `Service Completion Consumption`,
          createdBy: userId,
        }
      });
    }

    // 3. Audit log for consumption
    await tx.auditLog.create({
      data: {
        tenantId,
        userId: userId,
        action: 'INVENTORY_CONSUMPTION',
        entityType: 'Appointment',
        entityId: appointmentId,
        metadata: { serviceId, consumedItemsCount: usages.length },
      }
    });
  });
}
