import 'server-only';
import prisma from '@/lib/db/prisma';

export async function getLoyaltyAccount(tenantId: string, customerId: string) {
  return prisma.customerLoyaltyAccount.findUnique({
    where: { tenantId_customerId: { tenantId, customerId } }
  });
}

export async function getOrCreateLoyaltyAccount(tenantId: string, customerId: string) {
  const existing = await getLoyaltyAccount(tenantId, customerId);
  if (existing) return existing;

  return prisma.customerLoyaltyAccount.create({
    data: {
      tenantId,
      customerId,
      pointsBalance: 0,
      lifetimeEarned: 0,
      lifetimeRedeemed: 0
    }
  });
}

export async function getLoyaltyTransactions(tenantId: string, customerId: string, page = 1, limit = 10) {
  const [transactions, total] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.loyaltyTransaction.count({ where: { tenantId, customerId } })
  ]);
  return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function earnLoyaltyPoints(
  tenantId: string, 
  customerId: string, 
  points: number, 
  invoiceId: string, 
  description?: string
) {
  if (points <= 0) return null;

  return prisma.$transaction(async (tx) => {
    // 1. Ensure account exists
    let account = await tx.customerLoyaltyAccount.findUnique({
      where: { tenantId_customerId: { tenantId, customerId } }
    });
    
    if (!account) {
      account = await tx.customerLoyaltyAccount.create({
        data: { tenantId, customerId, pointsBalance: 0, lifetimeEarned: 0, lifetimeRedeemed: 0 }
      });
    }

    // 2. Prevent duplicate earning for the same invoice (idempotency check)
    if (invoiceId) {
      const existingTx = await tx.loyaltyTransaction.findFirst({
        where: { tenantId, customerId, invoiceId, type: 'EARN' }
      });
      if (existingTx) return account;
    }

    const newBalance = account.pointsBalance + points;
    const newLifetimeEarned = account.lifetimeEarned + points;

    // 3. Update account
    const updated = await tx.customerLoyaltyAccount.update({
      where: { id: account.id },
      data: { pointsBalance: newBalance, lifetimeEarned: newLifetimeEarned }
    });

    // 4. Create transaction
    await tx.loyaltyTransaction.create({
      data: {
        tenantId,
        customerId,
        type: 'EARN',
        points,
        balanceAfter: newBalance,
        invoiceId,
        description: description || 'Points earned from invoice'
      }
    });

    return updated;
  });
}

export async function redeemLoyaltyPoints(
  tenantId: string, 
  customerId: string, 
  points: number, 
  invoiceId?: string, 
  description?: string
) {
  if (points <= 0) throw new Error('Points must be greater than zero');

  return prisma.$transaction(async (tx) => {
    const account = await tx.customerLoyaltyAccount.findUnique({
      where: { tenantId_customerId: { tenantId, customerId } }
    });

    if (!account || account.pointsBalance < points) {
      throw new Error('Insufficient points balance');
    }

    const newBalance = account.pointsBalance - points;
    const newLifetimeRedeemed = account.lifetimeRedeemed + points;

    const updated = await tx.customerLoyaltyAccount.update({
      where: { id: account.id },
      data: { pointsBalance: newBalance, lifetimeRedeemed: newLifetimeRedeemed }
    });

    await tx.loyaltyTransaction.create({
      data: {
        tenantId,
        customerId,
        type: 'REDEEM',
        points: -Math.abs(points), // Store as negative for clarity, or just use absolute if prefer. Keeping standard as absolute or negative based on type? Schema says "points Int". Let's store absolute and infer from type. Wait, if it's REDEEM, maybe store as negative for easy SUM? Let's keep it absolute and use the type to determine add/subtract. 
        balanceAfter: newBalance,
        invoiceId,
        description: description || 'Points redeemed'
      }
    });

    return updated;
  });
}

export async function adjustLoyaltyPoints(
  tenantId: string, 
  customerId: string, 
  points: number, 
  reason: string, 
  userId?: string
) {
  if (points === 0) return null;

  return prisma.$transaction(async (tx) => {
    let account = await tx.customerLoyaltyAccount.findUnique({
      where: { tenantId_customerId: { tenantId, customerId } }
    });
    
    if (!account) {
      account = await tx.customerLoyaltyAccount.create({
        data: { tenantId, customerId, pointsBalance: 0, lifetimeEarned: 0, lifetimeRedeemed: 0 }
      });
    }

    const newBalance = account.pointsBalance + points;
    if (newBalance < 0) {
      throw new Error('Adjustment would result in negative balance');
    }

    const updated = await tx.customerLoyaltyAccount.update({
      where: { id: account.id },
      data: { 
        pointsBalance: newBalance,
        lifetimeEarned: points > 0 ? account.lifetimeEarned + points : account.lifetimeEarned,
        lifetimeRedeemed: points < 0 ? account.lifetimeRedeemed + Math.abs(points) : account.lifetimeRedeemed,
      }
    });

    const txRecord = await tx.loyaltyTransaction.create({
      data: {
        tenantId,
        customerId,
        type: 'ADJUSTMENT',
        points,
        balanceAfter: newBalance,
        description: reason,
        createdBy: userId
      }
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'LOYALTY_ADJUSTED',
        entityType: 'LoyaltyTransaction',
        entityId: txRecord.id,
        description: `Adjusted points by ${points} for customer ${customerId}. Reason: ${reason}`
      }
    });

    return updated;
  });
}

export async function reverseLoyaltyTransactionsForInvoice(tenantId: string, invoiceId: string, userId?: string) {
  // If an invoice is cancelled, reverse its EARN and REDEEM transactions
  return prisma.$transaction(async (tx) => {
    const transactions = await tx.loyaltyTransaction.findMany({
      where: { tenantId, invoiceId }
    });

    for (const originalTx of transactions) {
      if (originalTx.type === 'EARN' || originalTx.type === 'REDEEM') {
        const reverseType = 'REVERSAL';
        // If earned, subtract points. If redeemed, add points.
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
              description: `Reversal for cancelled invoice ${invoiceId}`,
              createdBy: userId
            }
          });
        }
      }
    }
  });
}
