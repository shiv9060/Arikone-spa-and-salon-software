'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { createServiceAction, updateServiceAction } from '@/app/dashboard/services/actions';
import { Plus } from 'lucide-react';

export function ServiceDialog({ service, categories, mode = 'create' }: { service?: any  ; categories: any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */; mode?: 'create' | 'edit' }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      let result;
      if (mode === 'create') {
        result = await createServiceAction(formData);
      } else {
        result = await updateServiceAction(service.id, formData);
      }

      if (result?.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      } else {
        toast({ title: 'Success', description: `Service ${mode === 'create' ? 'created' : 'updated'} successfully` });
        setOpen(false);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* @ts-expect-error Radix UI asChild typing issue */}
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button>
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Service
          </Button>
        ) : (
          <Button variant="outline" size="sm">Edit</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New Service' : 'Edit Service'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Add a new service to your catalog.' : 'Update service details.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input id="name" name="name" defaultValue={service?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <select 
                id="categoryId" 
                name="categoryId" 
                defaultValue={service?.categoryId || ''}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">-- No Category --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id} disabled={!c.isActive}>{c.name} {!c.isActive && '(Inactive)'}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={service?.price?.toString() || ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (Minutes) *</Label>
              <Input id="durationMinutes" name="durationMinutes" type="number" step="5" min="1" defaultValue={service?.durationMinutes?.toString() || '30'} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxPercent">Tax %</Label>
              <Input id="taxPercent" name="taxPercent" type="number" step="0.01" min="0" max="100" defaultValue={service?.taxPercent?.toString() || '0'} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <select 
                id="isActive" 
                name="isActive" 
                defaultValue={service?.isActive === false ? 'false' : 'true'}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={service?.description || ''} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
