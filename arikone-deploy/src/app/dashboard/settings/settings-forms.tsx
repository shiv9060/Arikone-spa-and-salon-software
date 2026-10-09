'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  updateBusinessProfileAction, 
  updateAddressAction, 
  updateInvoiceAction, 
  updateRegionalAction,
  updateFeedbackSettingsAction
} from './actions';

export function SettingsForms({ tenant }: { tenant: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, action: any /* eslint-disable-line @typescript-eslint/no-explicit-any */, formName: string) => {
    e.preventDefault();
    setLoading(formName);
    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await action(formData);
      if (result?.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      } else {
        toast({ title: 'Success', description: 'Settings updated successfully' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={(e) => handleSubmit(e, updateBusinessProfileAction, 'profile')}>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>Update your basic salon or spa information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name</Label>
                <Input id="name" name="name" defaultValue={tenant.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <select 
                  id="businessType" 
                  name="businessType" 
                  defaultValue={tenant.businessType || 'SALON'}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="SALON">Salon</option>
                  <option value="SPA">Spa</option>
                  <option value="BEAUTY_CLINIC">Beauty Clinic</option>
                  <option value="WELLNESS">Wellness</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Business Email</Label>
                <Input id="email" name="email" type="email" defaultValue={tenant.email || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Business Phone</Label>
                <Input id="phone" name="phone" type="tel" defaultValue={tenant.phone || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxNumber">Tax Registration Number (e.g. GSTIN)</Label>
                <Input id="taxNumber" name="taxNumber" defaultValue={tenant.taxNumber || ''} />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading === 'profile'}>
              {loading === 'profile' ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <form onSubmit={(e) => handleSubmit(e, updateAddressAction, 'address')}>
          <CardHeader>
            <CardTitle>Location & Address</CardTitle>
            <CardDescription>Your physical business address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Textarea id="address" name="address" defaultValue={tenant.address || ''} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" defaultValue={tenant.city || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" defaultValue={tenant.state || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" name="postalCode" defaultValue={tenant.postalCode || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" defaultValue={tenant.country || 'India'} required />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading === 'address'}>
              {loading === 'address' ? 'Saving...' : 'Save Address'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <form onSubmit={(e) => handleSubmit(e, updateInvoiceAction, 'invoice')}>
          <CardHeader>
            <CardTitle>Invoice Settings</CardTitle>
            <CardDescription>Configure how your bills and invoices appear.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Invoice Display Name</Label>
                <Input id="displayName" name="displayName" defaultValue={tenant.settings?.displayName || tenant.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input id="invoicePrefix" name="invoicePrefix" defaultValue={tenant.settings?.invoicePrefix || 'INV-'} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultTax">Default Tax %</Label>
                <Input id="defaultTax" name="defaultTax" type="number" step="0.01" min="0" max="100" defaultValue={tenant.settings?.defaultTax?.toString() || '0'} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceFooter">Invoice Footer / Terms</Label>
              <Textarea id="invoiceFooter" name="invoiceFooter" defaultValue={tenant.settings?.invoiceFooter || ''} placeholder="Thank you for visiting!" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading === 'invoice'}>
              {loading === 'invoice' ? 'Saving...' : 'Save Invoice Settings'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <form onSubmit={(e) => handleSubmit(e, updateRegionalAction, 'regional')}>
          <CardHeader>
            <CardTitle>Regional Settings</CardTitle>
            <CardDescription>Configure currency and timezone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency Code</Label>
                <Input id="currency" name="currency" defaultValue={tenant.currency || 'INR'} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" name="timezone" defaultValue={tenant.timezone || 'Asia/Kolkata'} required />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading === 'regional'}>
              {loading === 'regional' ? 'Saving...' : 'Save Regional Settings'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <form onSubmit={(e) => handleSubmit(e, updateFeedbackSettingsAction, 'feedback')}>
          <CardHeader>
            <CardTitle>Customer Feedback</CardTitle>
            <CardDescription>Configure automated customer feedback requests.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <input 
                type="checkbox" 
                id="enabled" 
                name="enabled" 
                defaultChecked={tenant.settings?.feedbackSettings?.enabled} 
                className="rounded border-gray-300"
              />
              <Label htmlFor="enabled">Enable automated feedback requests</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delayMinutes">Send Delay (Minutes)</Label>
                <Input id="delayMinutes" name="delayMinutes" type="number" min="0" defaultValue={tenant.settings?.feedbackSettings?.delayMinutes || '0'} />
                <p className="text-xs text-gray-500">0 for immediate.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDays">Link Expiry (Days)</Label>
                <Input id="expiryDays" name="expiryDays" type="number" min="1" max="365" defaultValue={tenant.settings?.feedbackSettings?.expiryDays || '7'} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequencyProtectionDays">Frequency Protection (Days)</Label>
                <Input id="frequencyProtectionDays" name="frequencyProtectionDays" type="number" min="0" defaultValue={tenant.settings?.feedbackSettings?.frequencyProtectionDays || '30'} />
                <p className="text-xs text-gray-500">Wait this many days before asking the same customer again.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumRating">Minimum Rating for Public Review</Label>
                <select 
                  id="minimumRating" 
                  name="minimumRating" 
                  defaultValue={tenant.settings?.feedbackSettings?.minimumRating || '4'}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="1">1 Star & Up</option>
                  <option value="2">2 Stars & Up</option>
                  <option value="3">3 Stars & Up</option>
                  <option value="4">4 Stars & Up</option>
                  <option value="5">5 Stars Only</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reviewLink">Public Review Link (Google, Yelp, etc.)</Label>
              <Input id="reviewLink" name="reviewLink" type="url" placeholder="https://g.page/r/..." defaultValue={tenant.settings?.feedbackSettings?.reviewLink || ''} />
              <p className="text-xs text-gray-500">Optional. Customers who leave a good rating will be asked to review here.</p>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="allowComments" 
                name="allowComments" 
                defaultChecked={tenant.settings?.feedbackSettings?.allowComments ?? true} 
                className="rounded border-gray-300"
              />
              <Label htmlFor="allowComments">Allow customers to leave a written comment</Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading === 'feedback'}>
              {loading === 'feedback' ? 'Saving...' : 'Save Feedback Settings'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
