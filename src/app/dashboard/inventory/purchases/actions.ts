'use server';

import { getSession } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/auth-utils';
import prisma from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/services/audit.service';
import { receivePurchase, cancelPurchase } from '@/services/inventory.service';
import { z } from 'zod';
import { PurchaseStatus, InvoicePaymentStatus } from '@prisma/client';

const purchaseItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(0.01),
  unitCost: z.number().min(0),
  tax: z.number().min(0).default(0),
});

const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  purchaseNumber: z.string().min(1, 'Purchase Number is required'),
  purchaseDate: z.string().transform((str) => new Date(str)),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
});

export async function createPurchase(data: any) {
  const session = await requirePermission('INVENTORY_PURCHASE');

  const parsed = purchaseSchema.parse(data);

  // Check unique purchase number
  const existing = await prisma.inventoryPurchase.findUnique({
    where: {
      tenantId_purchaseNumber: {
        tenantId: session.tenantId,
        purchaseNumber: parsed.purchaseNumber
      }
    }
  });

  if (existing) {
    throw new Error('A purchase with this number already exists');
  }

  // Calculate totals
  let subtotal = 0;
  let totalTax = 0;

  const itemsData = parsed.items.map(item => {
    const itemSubtotal = item.quantity * item.unitCost;
    const itemTax = itemSubtotal * (item.tax / 100);
    const itemTotal = itemSubtotal + itemTax;
    
    subtotal += itemSubtotal;
    totalTax += itemTax;

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      tax: item.tax,
      total: itemTotal,
      tenantId: session.tenantId,
    };
  });

  const total = subtotal + totalTax;

  const purchase = await prisma.inventoryPurchase.create({
    data: {
      tenantId: session.tenantId,
      supplierId: parsed.supplierId,
      purchaseNumber: parsed.purchaseNumber,
      purchaseDate: parsed.purchaseDate,
      subtotal,
      tax: totalTax,
      total,
      notes: parsed.notes,
      status: PurchaseStatus.DRAFT,
      createdBy: session.userId,
      items: {
        createMany: { data: itemsData }
      }
    }
  });

  await logAudit(session.tenantId, session.userId, 'INVENTORY_PURCHASE_CREATE', 'InventoryPurchase', purchase.id, `Created purchase ${purchase.purchaseNumber}`);
  revalidatePath('/dashboard/inventory/purchases');
  return purchase;
}

export async function actionReceivePurchase(purchaseId: string) {
  const session = await requirePermission('INVENTORY_PURCHASE');

  await receivePurchase(session.tenantId, purchaseId, session.userId);
  revalidatePath('/dashboard/inventory/purchases');
  revalidatePath('/dashboard/inventory/products');
  return { success: true };
}

export async function actionCancelPurchase(purchaseId: string) {
  const session = await requirePermission('INVENTORY_PURCHASE');

  await cancelPurchase(session.tenantId, purchaseId, session.userId);
  revalidatePath('/dashboard/inventory/purchases');
  revalidatePath('/dashboard/inventory/products');
  return { success: true };
}
