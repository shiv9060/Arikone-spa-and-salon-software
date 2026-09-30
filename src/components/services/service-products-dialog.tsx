'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { updateServiceProductUsagesAction } from '@/app/dashboard/services/actions';
import { toast } from 'sonner';
import { Trash2, Plus, FlaskConical } from 'lucide-react';

export function ServiceProductsDialog({
  service,
  products,
}: {
  service: any /* eslint-disable-line @typescript-eslint/no-explicit-any */;
  products: any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<{ productId: string; quantity: string; unit: string }[]>(
    service.productUsages?.map((u: any) => ({
      productId: u.productId,
      quantity: String(u.quantity),
      unit: u.unit
    })) || []
  );

  const addRow = () => setItems([...items, { productId: '', quantity: '1', unit: 'ML' }]);
  
  const removeRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Auto-fill unit if product selected
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        newItems[index].unit = prod.unit;
      }
    }
    setItems(newItems);
  };

  const handleSave = async () => {
    if (items.some(i => !i.productId || Number(i.quantity) <= 0)) {
      return toast.error('Please select a product and valid quantity for all rows.');
    }

    setLoading(true);
    try {
      const payload = items.map(i => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        unit: i.unit,
      }));
      const res = await updateServiceProductUsagesAction(service.id, payload);
      if (res.error) throw new Error(res.error);
      
      toast.success('Service products updated successfully');
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if(val) {
        setItems(service.productUsages?.map((u: any) => ({
          productId: u.productId,
          quantity: String(u.quantity),
          unit: u.unit
        })) || []);
      }
      setOpen(val);
    }}>
      {/* @ts-expect-error asChild type issue */}
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title="Manage Consumables">
          <FlaskConical className="w-4 h-4" />
          <span className="ml-2 hidden lg:inline">Products</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure Products for {service.name}</DialogTitle>
        </DialogHeader>
        
        <div className="text-sm text-muted-foreground mb-4">
          Define which inventory products are consumed each time this service is completed.
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select value={item.productId} onValueChange={(val) => updateItem(index, 'productId', val as string)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select Product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input 
                type="number" 
                step="0.01" 
                min="0.01"
                className="w-24"
                value={item.quantity} 
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                placeholder="Qty"
              />
              
              <div className="w-16 text-sm text-muted-foreground bg-muted p-2 rounded text-center">
                {item.unit}
              </div>

              <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(index)} className="text-red-500 shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addRow} className="w-full border-dashed">
            <Plus className="w-4 h-4 mr-2" /> Add Product Usage
          </Button>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
