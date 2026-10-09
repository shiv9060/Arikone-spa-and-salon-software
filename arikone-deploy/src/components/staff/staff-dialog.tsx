'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { createStaffAction, updateStaffAction } from '@/app/dashboard/staff/actions';
import { Plus } from 'lucide-react';

export function StaffDialog({ staff, mode = 'create' }: { staff?: any /* eslint-disable-line @typescript-eslint/no-explicit-any */; mode?: 'create' | 'edit' }) {
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
        result = await createStaffAction(formData);
      } else {
        result = await updateStaffAction(staff.id, formData);
      }

      if (result?.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      } else {
        toast({ title: 'Success', description: `Staff ${mode === 'create' ? 'created' : 'updated'} successfully` });
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
            Add Staff
          </Button>
        ) : (
          <Button variant="outline" size="sm">Edit</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New Staff' : 'Edit Staff'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Add a new member to your team.' : 'Update staff details.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" defaultValue={staff?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input id="mobile" name="mobile" defaultValue={staff?.mobile || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={staff?.email || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" name="designation" defaultValue={staff?.designation || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="joiningDate">Joining Date</Label>
              <Input id="joiningDate" name="joiningDate" type="date" defaultValue={staff?.joiningDate ? new Date(staff.joiningDate).toISOString().split('T')[0] : ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select 
                id="status" 
                name="status" 
                defaultValue={staff?.status || 'ACTIVE'}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionType">Commission Type</Label>
              <select 
                id="commissionType" 
                name="commissionType" 
                defaultValue={staff?.commissionType || ''}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">None</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionValue">Commission Value</Label>
              <Input id="commissionValue" name="commissionValue" type="number" step="0.01" min="0" defaultValue={staff?.commissionValue?.toString() || ''} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={staff?.notes || ''} />
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
