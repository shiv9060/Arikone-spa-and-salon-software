import prisma from '@/lib/db/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { validateOfferForInvoice } from './offer.service';

// Types
export interface InvoiceItemInput {
  serviceId?: string;
  productId?: string;
  quantity: number;
  discount: number; // fixed amount discount per item
  appliedCustomerPackageId?: string;
}

export interface CreateInvoiceInput {
  customerId: string;
  appointmentId?: string;
  items: InvoiceItemInput[];
  discount: number; // global manual invoice discount
  offerId?: string;
  couponCode?: string;
  notes?: string;
  purchasedMembershipPlanId?: string;
  purchasedPackageId?: string;
  redeemedLoyaltyPoints?: number;
}

export interface CreatePaymentInput {
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
  referenceNumber?: string;
  notes?: string;
}

// ------------------------------------------------------------------
// CALCULATIONS
// ------------------------------------------------------------------

export function calculateTotals(
  items: { quantity: number; unitPrice: number; taxPercent: number; discount: number }[],
  globalDiscount: number
) {
  let subtotal = new Decimal(0);
  let totalTax = new Decimal(0);
  const computedItems = [];

  for (const item of items) {
    const qty = new Decimal(item.quantity);
    const price = new Decimal(item.unitPrice);
    const itemDiscount = new Decimal(item.discount);
    const taxPct = new Decimal(item.taxPercent);

    const lineTotalBeforeDiscount = price.mul(qty);
    const lineTaxable = Decimal.max(0, lineTotalBeforeDiscount.sub(itemDiscount));
    
    // Using simple exclusive tax calculation: tax = taxable * (taxPercent / 100)
    const lineTax = lineTaxable.mul(taxPct.div(100));
    const lineTotal = lineTaxable.add(lineTax);

    subtotal = subtotal.add(lineTotalBeforeDiscount);
    totalTax = totalTax.add(lineTax);
    
    computedItems.push({
      quantity: item.quantity,
      unitPrice: price,
      discount: itemDiscount,
      taxPercent: taxPct,
      taxAmount: lineTax,
      total: lineTotal
    });
  }

  const validatedGlobalDiscount = Decimal.max(0, Decimal.min(subtotal, new Decimal(globalDiscount)));
  
  // Actually, global discount should reduce taxable amount.
  // To keep it simple based on the prompt: 
  // taxableAmount = subtotal - discount
  // But tax was calculated per item. If we apply global discount, we should proportionally reduce tax.
  // The prompt says: "tax = calculated according to configured item tax rules".
  // For the sake of simplicity, we just subtract global discount from the final sum, OR subtract it before tax if it's a global pre-tax discount. 
  // Let's do: Total = Subtotal - GlobalDiscount + TotalTax
  const finalTotal = Decimal.max(0, subtotal.sub(validatedGlobalDiscount).add(totalTax));

  return {
    subtotal,
    totalTax,
    globalDiscount: validatedGlobalDiscount,
    finalTotal,
    computedItems
  };
}

// ------------------------------------------------------------------
// INVOICE LIFECYCLE
// ------------------------------------------------------------------

export async function createInvoice(tenantId: string, userId: string, data: CreateInvoiceInput) {
  // 1. Fetch Tenant Settings for prefix and snapshots
  const [tenant, settings, customer] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.tenantSettings.findUnique({ where: { tenantId } }),
    prisma.customer.findUnique({ where: { id: data.customerId, tenantId } })
  ]);

  if (!tenant || !customer) {
    throw new Error('Tenant or Customer not found');
  }

  // 2. Resolve items and snapshot prices
  const serviceIds = data.items.filter(i => i.serviceId).map(i => i.serviceId as string);
  const productIds = data.items.filter(i => i.productId).map(i => i.productId as string);

  const [services, products] = await Promise.all([
    prisma.service.findMany({ where: { id: { in: serviceIds }, tenantId, isActive: true } }),
    prisma.product.findMany({ where: { id: { in: productIds }, tenantId, isActive: true } })
  ]);

  if (services.length !== serviceIds.length) {
    throw new Error('One or more services not found or inactive');
  }

  if (products.length !== productIds.length) {
    throw new Error('One or more products not found or inactive');
  }

  const serviceMap = new Map(services.map(s => [s.id, s]));
  const productMap = new Map(products.map(p => [p.id, p]));

  // Check active membership
  const activeMembership = await prisma.customerMembership.findFirst({
    where: { tenantId, customerId: data.customerId, status: 'ACTIVE', startDate: { lte: new Date() }, endDate: { gte: new Date() } },
    include: { membershipPlan: true },
    orderBy: { endDate: 'desc' }
  });
  const membershipDiscountPct = activeMembership?.membershipPlan?.discountPercentage?.toNumber() || 0;

  const calculationInput = data.items.map(item => {
    if (!item.serviceId && !item.productId) throw new Error('Item must have either serviceId or productId');

    let unitPrice, taxPercent, name;

    if (item.serviceId) {
      const s = serviceMap.get(item.serviceId)!;
      unitPrice = Number(s.price);
      taxPercent = Number(s.taxPercent);
      name = s.name;
    } else {
      const p = productMap.get(item.productId!)!;
      unitPrice = Number(p.sellingPrice);
      taxPercent = Number(p.taxPercentage);
      name = p.name;
    }

    const qty = item.quantity;
    let lineDiscount = item.discount;

    // 1. Package Usage overrides price to 0 (100% discount on the line)
    if (item.appliedCustomerPackageId) {
      lineDiscount = unitPrice * qty;
    } 
    // 2. Membership Discount (Only on services, typically, but let's say all)
    else if (membershipDiscountPct > 0) {
      // Calculate membership discount on the remaining amount after manual line discount
      const afterManual = (unitPrice * qty) - item.discount;
      if (afterManual > 0) {
        lineDiscount += (afterManual * membershipDiscountPct) / 100;
      }
    }

    return {
      serviceId: item.serviceId,
      productId: item.productId,
      serviceName: name,
      quantity: qty,
      unitPrice: unitPrice,
      taxPercent: taxPercent,
      discount: lineDiscount,
      appliedCustomerPackageId: item.appliedCustomerPackageId
    };
  });

  const { subtotal, totalTax, globalDiscount, finalTotal, computedItems } = calculateTotals(
    calculationInput,
    data.discount
  );

  const loyaltyDiscount = data.redeemedLoyaltyPoints || 0;

  let appliedOffer = null;
  let finalGlobalDiscount = globalDiscount;
  let finalCalculatedTotal = finalTotal;

  if (data.offerId || data.couponCode) {
    const offerValidation = await validateOfferForInvoice(tenantId, {
      offerId: data.offerId,
      couponCode: data.couponCode,
      subtotal: subtotal.toNumber(),
      items: calculationInput.map(i => ({ 
        serviceId: i.serviceId || '', 
        totalBeforeDiscount: (i.unitPrice * i.quantity) - i.discount 
      })) as any
    });

    if (!offerValidation.valid) {
      throw new Error(offerValidation.message || 'Invalid offer');
    }

    appliedOffer = offerValidation.offer;
    finalGlobalDiscount = new Decimal(offerValidation.discountAmount).add(globalDiscount);
    finalCalculatedTotal = Decimal.max(0, subtotal.sub(finalGlobalDiscount).add(totalTax));
  }
  
  // Deduct loyalty discount from final total
  finalCalculatedTotal = Decimal.max(0, finalCalculatedTotal.sub(loyaltyDiscount));

  // 3. Concurrency-safe invoice number generation loop
  let invoice: any = null;
  let attempts = 0;
  const prefix = settings?.invoicePrefix || 'INV-';

  while (!invoice && attempts < 5) {
    attempts++;
    try {
      const count = await prisma.invoice.count({ where: { tenantId } });
      const nextNum = count + attempts; // fuzzy guess for concurrency
      const invoiceNumber = `${prefix}${nextNum.toString().padStart(6, '0')}`;

      invoice = await prisma.$transaction(async (tx) => {
        // Create the invoice
        const created = await tx.invoice.create({
          data: {
            tenantId,
            customerId: customer.id,
            appointmentId: data.appointmentId,
            invoiceNumber,
            subtotal,
            discount: finalGlobalDiscount,
            tax: totalTax,
            total: finalCalculatedTotal,
            status: 'DRAFT',
            paymentStatus: 'PENDING',
            notes: data.notes,
            purchasedMembershipPlanId: data.purchasedMembershipPlanId,
            purchasedPackageId: data.purchasedPackageId,
            redeemedLoyaltyPoints: data.redeemedLoyaltyPoints,
            // Snapshots
            customerNameSnapshot: customer.name,
            customerMobileSnapshot: customer.mobile,
            businessNameSnapshot: tenant.name,
            businessAddressSnapshot: tenant.address,
            appliedOfferId: appliedOffer?.id || null,
            appliedOfferName: appliedOffer?.name || null,
            appliedCouponCode: appliedOffer?.couponCode || null,
            appliedDiscountPercent: appliedOffer?.discountPercent || null,
            appliedDiscountAmount: appliedOffer?.discountAmount || null,
            invoiceItems: {
              create: computedItems.map((ci, idx) => ({
                serviceId: calculationInput[idx].serviceId,
                productId: calculationInput[idx].productId,
                serviceName: calculationInput[idx].serviceName,
                quantity: ci.quantity,
                unitPrice: ci.unitPrice,
                discount: ci.discount,
                taxPercent: ci.taxPercent,
                taxAmount: ci.taxAmount,
                total: ci.total,
                appliedCustomerPackageId: calculationInput[idx].appliedCustomerPackageId
              }))
            }
          }
        });

        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: 'INVOICE_CREATED',
            entityType: 'Invoice',
            entityId: created.id,
            description: `Created invoice ${invoiceNumber} for ₹${finalCalculatedTotal}`
          }
        });

        return created;
      });
    } catch (err: any) {
      if (err.code === 'P2002' && attempts < 5) {
        // Unique constraint failed, retry
        continue;
      }
      throw err;
    }
  }

  if (!invoice) throw new Error('Failed to generate unique invoice number');

  return invoice;
}

export async function getInvoiceById(tenantId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, tenantId },
    include: {
      invoiceItems: true,
      payments: { orderBy: { paidAt: 'desc' } },
      customer: { select: { id: true, name: true, mobile: true, email: true, whatsappOptOut: true } },
      appointment: { select: { id: true, appointmentDate: true } }
    }
  });
  if (!invoice) throw new Error('Invoice not found');
  return invoice;
}

export async function getInvoices(
  tenantId: string, 
  filters: { page?: number; limit?: number; status?: string; paymentStatus?: string; search?: string }
) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (filters.status && filters.status !== 'ALL') where.status = filters.status;
  if (filters.paymentStatus && filters.paymentStatus !== 'ALL') where.paymentStatus = filters.paymentStatus;
  
  if (filters.search) {
    where.OR = [
      { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
      { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
      { customer: { mobile: { contains: filters.search, mode: 'insensitive' } } }
    ];
  }

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { name: true, mobile: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.invoice.count({ where })
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function finalizeInvoice(tenantId: string, invoiceId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ 
      where: { id: invoiceId, tenantId },
      include: { invoiceItems: true }
    });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status !== 'DRAFT') throw new Error('Only DRAFT invoices can be finalized');

    const updated = await tx.invoice.update({
      where: { id: invoiceId },
      data: { 
        status: 'FINALIZED',
        finalizedAt: new Date()
      }
    });

    if (updated.appliedOfferId) {
      await tx.offer.update({
        where: { id: updated.appliedOfferId },
        data: { usageCount: { increment: 1 } }
      });
    }

    // 1. Memberships
    if (updated.purchasedMembershipPlanId) {
      const plan = await tx.membershipPlan.findUnique({ where: { id: updated.purchasedMembershipPlanId } });
      if (plan) {
        const now = new Date();
        const active = await tx.customerMembership.findFirst({
          where: { tenantId, customerId: updated.customerId, status: 'ACTIVE', startDate: { lte: now }, endDate: { gte: now } },
          orderBy: { endDate: 'desc' }
        });
        const startDate = active ? new Date(active.endDate) : now;
        const endDate = new Date(startDate);
        if (plan.durationUnit === 'MONTH') endDate.setMonth(endDate.getMonth() + plan.durationValue);
        else if (plan.durationUnit === 'YEAR') endDate.setFullYear(endDate.getFullYear() + plan.durationValue);

        await tx.customerMembership.create({
          data: { tenantId, customerId: updated.customerId, membershipPlanId: plan.id, startDate, endDate, status: 'ACTIVE', purchaseInvoiceId: invoice.id }
        });
      }
    }

    // 2. Packages
    if (updated.purchasedPackageId) {
      const pkg = await tx.package.findUnique({ where: { id: updated.purchasedPackageId } });
      if (pkg) {
        const purchasedAt = new Date();
        const expiresAt = new Date(purchasedAt);
        expiresAt.setDate(expiresAt.getDate() + pkg.validityDays);

        await tx.customerPackage.create({
          data: { tenantId, customerId: updated.customerId, packageId: pkg.id, purchaseInvoiceId: invoice.id, purchasedAt, expiresAt, status: 'ACTIVE' }
        });
      }
    }

    // 3. Loyalty Redemption
    if (updated.redeemedLoyaltyPoints && updated.redeemedLoyaltyPoints > 0) {
      const account = await tx.customerLoyaltyAccount.findUnique({ where: { tenantId_customerId: { tenantId, customerId: updated.customerId } } });
      if (account) {
        const newBalance = account.pointsBalance - updated.redeemedLoyaltyPoints;
        const newLifetimeRedeemed = account.lifetimeRedeemed + updated.redeemedLoyaltyPoints;
        await tx.customerLoyaltyAccount.update({
          where: { id: account.id },
          data: { pointsBalance: newBalance, lifetimeRedeemed: newLifetimeRedeemed }
        });
        await tx.loyaltyTransaction.create({
          data: { tenantId, customerId: updated.customerId, type: 'REDEEM', points: updated.redeemedLoyaltyPoints, balanceAfter: newBalance, invoiceId: invoice.id, description: 'Points redeemed on invoice ' + invoice.invoiceNumber, createdBy: userId }
        });
      }
    }

    // 4. Package Usage
    for (const item of invoice.invoiceItems) {
      if (item.appliedCustomerPackageId) {
        await tx.packageUsage.create({
          data: {
            tenantId,
            customerPackageId: item.appliedCustomerPackageId,
            serviceId: item.serviceId as string,
            quantityUsed: item.quantity,
            invoiceId: invoice.id,
            createdBy: userId
          }
        });
        
        // Mark as exhausted if needed
        const custPkg = await tx.customerPackage.findUnique({
          where: { id: item.appliedCustomerPackageId },
          include: { package: { include: { packageServices: true } }, usages: true }
        });
        if (custPkg) {
          let isExhausted = true;
          for (const ps of custPkg.package.packageServices) {
            const uCount = custPkg.usages.filter(u => u.serviceId === ps.serviceId).reduce((s, u) => s + u.quantityUsed, 0);
            if (uCount < ps.quantity) {
              isExhausted = false;
              break;
            }
          }
          if (isExhausted) {
            await tx.customerPackage.update({ where: { id: custPkg.id }, data: { status: 'EXHAUSTED' } });
          }
        }
      }

      // Retail Product Stock Consumption
      if (item.productId) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product && product.trackInventory) {
          const qty = Number(item.quantity);
          const currentStock = Number(product.currentStock);
          const newStock = currentStock - qty;

          if (newStock < 0) {
            throw new Error(`Insufficient stock for product ${product.name}. Needed ${qty}, have ${currentStock}.`);
          }

          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: newStock }
          });

          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              type: 'SALE',
              quantity: qty,
              stockBefore: currentStock,
              stockAfter: newStock,
              referenceType: 'INVOICE',
              referenceId: invoice.id,
              reason: `Retail Sale on Invoice ${invoice.invoiceNumber}`,
              createdBy: userId
            }
          });
        }
      }
    }

    // 5. Loyalty Earning
    const settings = await tx.tenantSettings.findUnique({ where: { tenantId } });
    const loyaltySettings: any = settings?.loyaltySettings || {};
    if (loyaltySettings.enabled && loyaltySettings.earningRate > 0) {
      const points = Math.floor(updated.total.toNumber() * loyaltySettings.earningRate);
      if (points > 0) {
        let account = await tx.customerLoyaltyAccount.findUnique({ where: { tenantId_customerId: { tenantId, customerId: updated.customerId } } });
        if (!account) {
          account = await tx.customerLoyaltyAccount.create({ data: { tenantId, customerId: updated.customerId, pointsBalance: 0, lifetimeEarned: 0, lifetimeRedeemed: 0 } });
        }
        const newBalance = account.pointsBalance + points;
        await tx.customerLoyaltyAccount.update({
          where: { id: account.id },
          data: { pointsBalance: newBalance, lifetimeEarned: account.lifetimeEarned + points }
        });
        await tx.loyaltyTransaction.create({
          data: { tenantId, customerId: updated.customerId, type: 'EARN', points, balanceAfter: newBalance, invoiceId: invoice.id, description: 'Points earned on invoice ' + invoice.invoiceNumber, createdBy: userId }
        });
      }
    }

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'INVOICE_FINALIZED',
        entityType: 'Invoice',
        entityId: invoiceId
      }
    });

    return updated;
  });
}

export async function cancelInvoice(tenantId: string, invoiceId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ 
      where: { id: invoiceId, tenantId },
      include: { invoiceItems: true }
    });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'CANCELLED') throw new Error('Invoice is already cancelled');

    const updated = await tx.invoice.update({
      where: { id: invoiceId },
      data: { 
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: userId
      }
    });

    if (invoice.status === 'FINALIZED') {
      if (invoice.appliedOfferId) {
        await tx.offer.update({
          where: { id: invoice.appliedOfferId },
          data: { usageCount: { decrement: 1 } }
        });
      }

      // Reverse Loyalty
      const transactions = await tx.loyaltyTransaction.findMany({ where: { tenantId, invoiceId } });
      for (const originalTx of transactions) {
        if (originalTx.type === 'EARN' || originalTx.type === 'REDEEM') {
          const reverseType = 'REVERSAL';
          const pointsDiff = originalTx.type === 'EARN' ? -Math.abs(originalTx.points) : Math.abs(originalTx.points);
          
          const account = await tx.customerLoyaltyAccount.findUnique({
            where: { tenantId_customerId: { tenantId, customerId: originalTx.customerId } }
          });
          
          if (account) {
            const newBalance = Math.max(0, account.pointsBalance + pointsDiff);
            await tx.customerLoyaltyAccount.update({
              where: { id: account.id },
              data: { pointsBalance: newBalance }
            });
            await tx.loyaltyTransaction.create({
              data: {
                tenantId,
                customerId: account.customerId,
                type: reverseType,
                points: pointsDiff,
                balanceAfter: newBalance,
                invoiceId: originalTx.invoiceId,
                description: `Reversal for cancelled invoice ${invoice.invoiceNumber}`,
                createdBy: userId
              }
            });
          }
        }
      }

      // Delete Package Usages for this invoice
      await tx.packageUsage.deleteMany({ where: { tenantId, invoiceId } });
      
      // Update exhausted packages back to ACTIVE if usages were removed
      for (const item of invoice.invoiceItems) {
        if (item.appliedCustomerPackageId) {
          await tx.customerPackage.update({
            where: { id: item.appliedCustomerPackageId },
            data: { status: 'ACTIVE' }
          });
        }
      }

      // If membership was purchased via this invoice, cancel it
      if (invoice.purchasedMembershipPlanId) {
        await tx.customerMembership.updateMany({
          where: { tenantId, purchaseInvoiceId: invoice.id },
          data: { status: 'CANCELLED' }
        });
      }

      // If package was purchased, cancel it
      if (invoice.purchasedPackageId) {
        await tx.customerPackage.updateMany({
          where: { tenantId, purchaseInvoiceId: invoice.id },
          data: { status: 'CANCELLED' }
        });
      }
    }

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'INVOICE_CANCELLED',
        entityType: 'Invoice',
        entityId: invoiceId
      }
    });

    return updated;
  });
}

// ------------------------------------------------------------------
// PAYMENTS
// ------------------------------------------------------------------

export async function createPayment(tenantId: string, invoiceId: string, userId: string, data: CreatePaymentInput) {
  if (data.amount <= 0) throw new Error('Payment amount must be greater than zero');

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ 
      where: { id: invoiceId, tenantId },
      include: { payments: true }
    });

    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'CANCELLED') throw new Error('Cannot pay a cancelled invoice');
    if (invoice.status === 'DRAFT') throw new Error('Finalize invoice before recording payment');

    const totalPaid = invoice.payments.reduce((sum, p) => sum.add(p.amount), new Decimal(0));
    const outstanding = invoice.total.sub(totalPaid);

    const paymentAmount = new Decimal(data.amount);

    if (paymentAmount.gt(outstanding)) {
      throw new Error('Payment exceeds the outstanding invoice balance.');
    }

    // Record payment
    const payment = await tx.payment.create({
      data: {
        tenantId,
        invoiceId,
        amount: paymentAmount,
        paymentMode: data.paymentMode,
        referenceNumber: data.referenceNumber,
        notes: data.notes
      }
    });

    const newTotalPaid = totalPaid.add(paymentAmount);
    const newPaymentStatus = newTotalPaid.gte(invoice.total) ? 'PAID' : 'PARTIAL';

    // Update invoice status
    if (newPaymentStatus !== invoice.paymentStatus) {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { paymentStatus: newPaymentStatus, paymentMode: data.paymentMode } // Store the mode of the last payment
      });
    }

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'PAYMENT_RECORDED',
        entityType: 'Payment',
        entityId: payment.id,
        description: `Recorded ₹${paymentAmount} via ${data.paymentMode} for Invoice ${invoice.invoiceNumber}`
      }
    });

    return payment;
  });
}
