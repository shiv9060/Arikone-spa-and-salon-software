import prisma from '@/lib/db/prisma';

export async function getPlatformSettings() {
  let settings = await prisma.platformSettings.findUnique({
    where: { id: 'global' }
  });

  if (!settings) {
    settings = await prisma.platformSettings.create({
      data: {
        id: 'global'
      }
    });
  }

  return settings;
}

export async function updatePlatformSettings(data: any) {
  const settings = await prisma.platformSettings.update({
    where: { id: 'global' },
    data
  });
  return settings;
}

export async function isMaintenanceModeEnabled() {
  const settings = await getPlatformSettings();
  return settings.maintenanceEnabled;
}
