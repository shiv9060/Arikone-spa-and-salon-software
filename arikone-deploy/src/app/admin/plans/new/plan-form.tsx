'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPlanAction } from '../actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export function PlanForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await createPlanAction(formData);
      
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push('/admin/plans');
        router.refresh();
      }
    } catch (err: any) {
      if (err.message === 'NEXT_REDIRECT') throw err;
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Plan Name *</Label>
          <Input id="name" name="name" required placeholder="e.g. Professional" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input id="slug" name="slug" required placeholder="e.g. professional" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <Input id="price" name="price" type="number" step="0.01" required placeholder="99.00" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="billingInterval">Billing Interval</Label>
          <Select name="billingInterval" defaultValue="MONTHLY">
            <SelectTrigger>
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" placeholder="Brief description of the plan..." />
      </div>

      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-medium mb-4">Features</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {['CRM', 'APPOINTMENTS', 'BILLING', 'INVENTORY', 'WHATSAPP', 'FEEDBACK', 'REPORTS'].map(feat => (
            <div key={feat} className="flex items-center space-x-2">
              <Switch id={`feat_${feat}`} name={`feat_${feat}`} defaultChecked />
              <Label htmlFor={`feat_${feat}`} className="font-normal">{feat}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-medium mb-4">Limits</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="limit_users">Max Users</Label>
            <Input id="limit_users" name="limit_users" type="number" defaultValue="5" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit_customers">Max Customers</Label>
            <Input id="limit_customers" name="limit_customers" type="number" defaultValue="1000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit_staff">Max Staff</Label>
            <Input id="limit_staff" name="limit_staff" type="number" defaultValue="10" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline" type="button" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading}>
          {loading ? 'Creating...' : 'Create Plan'}
        </Button>
      </div>
    </form>
  );
}
