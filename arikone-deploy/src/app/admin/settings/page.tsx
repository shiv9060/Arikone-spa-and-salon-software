import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getPlatformSettings } from '@/services/platform/settings.service';
import { savePlatformSettingsAction } from './actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function PlatformSettingsPage() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const settings = await getPlatformSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-gray-500">Configure global Arikone SaaS parameters.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4 flex flex-wrap gap-2 h-auto p-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <form action={savePlatformSettingsAction} className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
          <TabsContent value="general" className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">General Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform Name</Label>
                <Input name="platformName" defaultValue={settings.platformName} />
              </div>
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input name="supportEmail" defaultValue={settings.supportEmail || ''} type="email" />
              </div>
              <div className="space-y-2">
                <Label>Support Phone</Label>
                <Input name="supportPhone" defaultValue={settings.supportPhone || ''} />
              </div>
              <div className="space-y-2">
                <Label>Default Currency</Label>
                <Input name="defaultCurrency" defaultValue={settings.defaultCurrency} />
              </div>
              <div className="space-y-2">
                <Label>Default Country</Label>
                <Input name="defaultCountry" defaultValue={settings.defaultCountry} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">SMTP Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SMTP Host</Label>
                <Input name="smtpHost" defaultValue={settings.smtpHost || ''} />
              </div>
              <div className="space-y-2">
                <Label>SMTP Port</Label>
                <Input name="smtpPort" defaultValue={settings.smtpPort?.toString() || ''} type="number" />
              </div>
              <div className="space-y-2">
                <Label>SMTP Username</Label>
                <Input name="smtpUser" defaultValue={settings.smtpUser || ''} />
              </div>
              <div className="space-y-2">
                <Label>SMTP Password</Label>
                <Input name="smtpPasswordHash" defaultValue={settings.smtpPasswordHash ? '********' : ''} type="password" />
              </div>
              <div className="space-y-2">
                <Label>From Name</Label>
                <Input name="smtpFromName" defaultValue={settings.smtpFromName || ''} />
              </div>
              <div className="space-y-2">
                <Label>From Email</Label>
                <Input name="smtpFromEmail" defaultValue={settings.smtpFromEmail || ''} type="email" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">WhatsApp Infrastructure</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <select name="whatsappProvider" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={settings.whatsappProvider || 'META'}>
                  <option value="META">Meta Cloud API</option>
                  <option value="TWILIO">Twilio</option>
                  <option value="MOCK">Mock (Dev)</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" name="whatsappEnabled" value="true" defaultChecked={settings.whatsappEnabled} className="h-4 w-4" />
                <Label>Global WhatsApp Enabled</Label>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="maintenance" className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">System Maintenance</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input type="checkbox" name="maintenanceEnabled" value="true" defaultChecked={settings.maintenanceEnabled} className="h-4 w-4" />
                <Label className="text-red-600 font-bold">Enable Maintenance Mode</Label>
              </div>
              <div className="space-y-2">
                <Label>Maintenance Message (Shown to users)</Label>
                <Input name="maintenanceMessage" defaultValue={settings.maintenanceMessage || 'We are currently upgrading Arikone to serve you better.'} />
              </div>
            </div>
          </TabsContent>

          <div className="pt-4 border-t flex justify-end">
            <Button type="submit">Save Platform Settings</Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}
