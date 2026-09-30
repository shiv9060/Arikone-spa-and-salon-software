'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createTenantAction } from '../actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function TenantCreateForm({ plans }: { plans: any[] }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await createTenantAction(formData);
      
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push('/admin/tenants');
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
          <Label htmlFor="name">Business Name *</Label>
          <Input id="name" name="name" required placeholder="e.g. Looks Salon" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="slug">Tenant Slug *</Label>
          <Input id="slug" name="slug" required placeholder="e.g. looks-salon" />
          <p className="text-xs text-gray-500">Must be unique, lowercase, URL safe.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessType">Business Type</Label>
          <Select name="businessType" defaultValue="salon">
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="salon">Salon</SelectItem>
              <SelectItem value="spa">Spa</SelectItem>
              <SelectItem value="clinic">Clinic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="planId">Subscription Plan</Label>
          <Select name="planId">
            <SelectTrigger>
              <SelectValue placeholder="Select a plan (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {plans.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name} - {p.price.toString()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-medium mb-4">Owner & Contact</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name *</Label>
            <Input id="ownerName" name="ownerName" required placeholder="John Doe" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ownerEmail">Owner Email *</Label>
            <Input id="ownerEmail" name="ownerEmail" type="email" required placeholder="john@example.com" />
            <p className="text-xs text-gray-500">Will receive invitation to set password.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" placeholder="+91 9876543210" />
          </div>
        </div>
      </div>

      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-medium mb-4">Regional Settings</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" defaultValue="India" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" name="currency" defaultValue="INR" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" name="timezone" defaultValue="Asia/Kolkata" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline" type="button" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading}>
          {loading ? 'Creating...' : 'Create Tenant'}
        </Button>
      </div>
    </form>
  );
}
