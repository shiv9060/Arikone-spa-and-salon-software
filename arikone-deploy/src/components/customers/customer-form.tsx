'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCustomerAction, updateCustomerAction } from '@/app/dashboard/customers/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export function CustomerForm({ customer, mode = 'create' }: { customer?: any /* eslint-disable-line @typescript-eslint/no-explicit-any */; mode?: 'create' | 'edit' }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const result = mode === 'create' 
        ? await createCustomerAction(formData)
        : await updateCustomerAction(customer.id, formData);

      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: `Customer ${mode === 'create' ? 'created' : 'updated'} successfully` });
        if (mode === 'create') {
          router.push(`/dashboard/customers/${result.customerId}`);
        } else {
          router.push(`/dashboard/customers/${customer.id}`);
        }
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const defaultDob = customer?.dateOfBirth ? format(new Date(customer.dateOfBirth), 'yyyy-MM-dd') : '';

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'New Customer' : 'Edit Customer'}</CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Add a new customer to your database.' 
            : 'Update existing customer information.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
              <Input id="name" name="name" defaultValue={customer?.name} required placeholder="Rahul Kumar" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number <span className="text-red-500">*</span></Label>
              <Input id="mobile" name="mobile" defaultValue={customer?.mobile} required placeholder="+91 9876543210" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" defaultValue={customer?.email || ''} placeholder="rahul@example.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={defaultDob} max={format(new Date(), 'yyyy-MM-dd')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select name="gender" defaultValue={customer?.gender || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                  <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" defaultValue={customer?.address || ''} placeholder="Full address" rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={customer?.notes || ''} placeholder="Preferences, allergies, or special instructions..." rows={3} />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox" 
              id="whatsappOptOut" 
              name="whatsappOptOut" 
              value="true"
              defaultChecked={customer?.whatsappOptOut}
              className="h-4 w-4 text-indigo-600 rounded border-gray-300"
            />
            <Label htmlFor="whatsappOptOut" className="font-normal cursor-pointer">
              Opt-out of automated WhatsApp messages
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
