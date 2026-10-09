import { requirePermission } from '@/lib/auth/auth-utils';
import { getTenantWithSettings } from '@/services/settings.service';
import { SettingsForms } from './settings-forms';

export default async function SettingsPage() {
  const user = await requirePermission('SETTINGS_VIEW');
  const tenant = await getTenantWithSettings(user.tenantId);

  if (!tenant) return null;

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Salon Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your business profile, invoicing, and regional preferences.
        </p>
      </div>

      <SettingsForms tenant={tenant} />
    </div>
  );
}
