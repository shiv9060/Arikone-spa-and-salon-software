'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPurchase } from '@/app/dashboard/inventory/purchases/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Supplier, Product } from '@prisma/client';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

type PurchaseItemInput = {
  productId: string;
  quantity: string;
  unitCost: string;
  tax: string;
};

export function PurchaseForm({ suppliers, products }: { suppliers: Supplier[], products: Product[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [supplierId, setSupplierId] = useState('');
  const [purchaseNumber, setPurchaseNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  const [items, setItems] = useState<PurchaseItemInput[]>([
    { productId: '', quantity: '1', unitCost: '0', tax: '0' }
  ]);

  const addRow = () => setItems([...items, { productId: '', quantity: '1', unitCost: '0', tax: '0' }]);
  
  const removeRow = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };
  
  const updateItem = (index: number, field: keyof PurchaseItemInput, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Auto-fill cost if product selected
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        newItems[index].unitCost = String(Number(prod.costPrice));
        newItems[index].tax = String(Number(prod.taxPercentage));
      }
    }
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitCost)), 0);
  };

  const calculateTax = () => {
    return items.reduce((sum, item) => {
      const base = Number(item.quantity) * Number(item.unitCost);
      return sum + (base * (Number(item.tax) / 100));
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !purchaseNumber || !purchaseDate) return toast.error('Fill in all required fields');
    if (items.some(i => !i.productId)) return toast.error('Select a product for all rows');
    
    setLoading(true);
    try {
      const payload = {
        supplierId,
        purchaseNumber,
        purchaseDate,
        notes,
        items: items.map(i => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
          tax: Number(i.tax),
        }))
      };
      
      await createPurchase(payload);
      toast.success('Purchase order created successfully');
      router.push('/dashboard/inventory/purchases');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>Supplier *</Label>
          <Select value={supplierId} onValueChange={(v) => setSupplierId(v as string)} required>
            <SelectTrigger>
              <SelectValue placeholder="Select Supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Purchase Reference # *</Label>
          <Input 
            required 
            value={purchaseNumber} 
            onChange={(e) => setPurchaseNumber(e.target.value)} 
            placeholder="e.g., PO-2024-001" 
          />
        </div>

        <div className="space-y-2">
          <Label>Date *</Label>
          <Input 
            type="date" 
            required 
            value={purchaseDate} 
            onChange={(e) => setPurchaseDate(e.target.value)} 
          />
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left font-medium">Product</th>
              <th className="p-3 text-left font-medium w-24">Qty</th>
              <th className="p-3 text-left font-medium w-32">Unit Cost (₹)</th>
              <th className="p-3 text-left font-medium w-24">Tax %</th>
              <th className="p-3 text-right font-medium w-32">Total (₹)</th>
              <th className="p-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, index) => {
              const base = Number(item.quantity) * Number(item.unitCost);
              const tax = base * (Number(item.tax) / 100);
              const total = base + tax;
              
              return (
                <tr key={index}>
                  <td className="p-3">
                    <Select value={item.productId} onValueChange={(val) => updateItem(index, 'productId', val as string)} required>
                      <SelectTrigger className="border-0 bg-transparent focus:ring-0 px-0 h-auto">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Input 
                      type="number" step="0.01" min="0.01" required
                      className="border-0 bg-transparent focus-visible:ring-0 px-0 h-auto"
                      value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </td>
                  <td className="p-3">
                    <Input 
                      type="number" step="0.01" min="0" required
                      className="border-0 bg-transparent focus-visible:ring-0 px-0 h-auto"
                      value={item.unitCost} onChange={(e) => updateItem(index, 'unitCost', e.target.value)}
                    />
                  </td>
                  <td className="p-3">
                    <Input 
                      type="number" step="0.01" min="0"
                      className="border-0 bg-transparent focus-visible:ring-0 px-0 h-auto"
                      value={item.tax} onChange={(e) => updateItem(index, 'tax', e.target.value)}
                    />
                  </td>
                  <td className="p-3 text-right font-medium">
                    {total.toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(index)} disabled={items.length === 1} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="p-3 bg-muted/50 border-t">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-2 flex-1">
          <Label>Notes</Label>
          <Textarea 
            placeholder="Add any internal notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>
        
        <div className="w-full md:w-64 space-y-3 bg-muted/30 p-4 rounded-lg">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>₹{calculateSubtotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax:</span>
            <span>₹{calculateTax().toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-3">
            <span>Total:</span>
            <span>₹{(calculateSubtotal() + calculateTax()).toFixed(2)}</span>
          </div>
          
          <Button type="submit" disabled={loading} className="w-full mt-4">
            {loading ? 'Creating...' : 'Create Purchase Order'}
          </Button>
        </div>
      </div>
    </form>
  );
}
