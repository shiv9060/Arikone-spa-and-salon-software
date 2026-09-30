'use server';

import { getSession } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/auth-utils';
import prisma from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/services/audit.service';
import { adjustStock } from '@/services/inventory.service';
import { z } from 'zod';
import { ProductUnit, StockMovementType } from '@prisma/client';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  unit: z.nativeEnum(ProductUnit),
  costPrice: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().min(0).default(0),
  taxPercentage: z.coerce.number().min(0).default(0),
  minimumStockLevel: z.coerce.number().min(0).default(0),
  reorderLevel: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
  trackInventory: z.boolean().default(true),
});

export async function createProduct(formData: FormData) {
  const session = await requirePermission('INVENTORY_CREATE');

  const data = productSchema.parse({
    name: formData.get('name'),
    categoryId: formData.get('categoryId'),
    sku: formData.get('sku'),
    barcode: formData.get('barcode'),
    description: formData.get('description'),
    unit: formData.get('unit'),
    costPrice: formData.get('costPrice'),
    sellingPrice: formData.get('sellingPrice'),
    taxPercentage: formData.get('taxPercentage'),
    minimumStockLevel: formData.get('minimumStockLevel'),
    reorderLevel: formData.get('reorderLevel'),
    isActive: formData.get('isActive') === 'true',
    trackInventory: formData.get('trackInventory') === 'true',
  });

  if (data.sku) {
    const existingSku = await prisma.product.findUnique({
      where: {
        tenantId_sku: {
          tenantId: session.tenantId,
          sku: data.sku,
        }
      }
    });
    if (existingSku) throw new Error('Product with this SKU already exists');
  }

  const product = await prisma.product.create({
    data: {
      tenantId: session.tenantId,
      ...data,
      openingStock: 0,
      currentStock: 0,
    }
  });

  await logAudit(session.tenantId, session.userId, 'INVENTORY_PRODUCT_CREATE', 'Product', product.id, `Created product ${product.name}`);
  revalidatePath('/dashboard/inventory/products');
  return { success: true };
}

export async function updateProduct(id: string, formData: FormData) {
  const session = await requirePermission('INVENTORY_UPDATE');

  const data = productSchema.parse({
    name: formData.get('name'),
    categoryId: formData.get('categoryId'),
    sku: formData.get('sku'),
    barcode: formData.get('barcode'),
    description: formData.get('description'),
    unit: formData.get('unit'),
    costPrice: formData.get('costPrice'),
    sellingPrice: formData.get('sellingPrice'),
    taxPercentage: formData.get('taxPercentage'),
    minimumStockLevel: formData.get('minimumStockLevel'),
    reorderLevel: formData.get('reorderLevel'),
    isActive: formData.get('isActive') === 'true',
    trackInventory: formData.get('trackInventory') === 'true',
  });

  if (data.sku) {
    const existingSku = await prisma.product.findUnique({
      where: {
        tenantId_sku: {
          tenantId: session.tenantId,
          sku: data.sku,
        }
      }
    });
    if (existingSku && existingSku.id !== id) throw new Error('Another product with this SKU already exists');
  }

  const product = await prisma.product.update({
    where: { id, tenantId: session.tenantId },
    data: {
      ...data,
    }
  });

  await logAudit(session.tenantId, session.userId, 'INVENTORY_PRODUCT_UPDATE', 'Product', product.id, `Updated product ${product.name}`);
  revalidatePath('/dashboard/inventory/products');
  return { success: true };
}

export async function manualStockAdjustment(productId: string, formData: FormData) {
  const session = await requirePermission('INVENTORY_ADJUST');

  const quantity = Number(formData.get('quantity'));
  const type = formData.get('type') as StockMovementType;
  const reason = formData.get('reason') as string;

  await adjustStock(session.tenantId, {
    productId,
    type,
    quantity,
    reason,
    userId: session.userId,
  });

  revalidatePath('/dashboard/inventory/products');
  return { success: true };
}
