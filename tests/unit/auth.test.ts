import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ROLES, PERMISSIONS, hasPermission } from '../../src/lib/auth/permissions';

describe('Authorization & Permissions', () => {

  it('TEST 4: Owner has full permissions', () => {
    // Owner should have ALL permissions defined in the system
    Object.values(PERMISSIONS).forEach(perm => {
      expect(hasPermission('OWNER', perm)).toBe(true);
    });
  });

  it('TEST 5: Manager cannot access restricted owner-level user administration', () => {
    expect(hasPermission('MANAGER', PERMISSIONS.USERS_VIEW)).toBe(false);
    expect(hasPermission('MANAGER', PERMISSIONS.USERS_CREATE)).toBe(false);
    expect(hasPermission('MANAGER', PERMISSIONS.USERS_DEACTIVATE)).toBe(false);
  });

  it('TEST 6: Receptionist cannot access financial reports', () => {
    expect(hasPermission('RECEPTIONIST', PERMISSIONS.REPORTS_FINANCIAL)).toBe(false);
  });

  it('TEST 7: Staff cannot access financial reports', () => {
    expect(hasPermission('STAFF', PERMISSIONS.REPORTS_FINANCIAL)).toBe(false);
  });

  it('TEST 8: Staff cannot access settings', () => {
    expect(hasPermission('STAFF', PERMISSIONS.SETTINGS_VIEW)).toBe(false);
    expect(hasPermission('STAFF', PERMISSIONS.SETTINGS_UPDATE)).toBe(false);
  });

  it('TEST 9: Receptionist cannot manage users', () => {
    expect(hasPermission('RECEPTIONIST', PERMISSIONS.USERS_VIEW)).toBe(false);
    expect(hasPermission('RECEPTIONIST', PERMISSIONS.USERS_CREATE)).toBe(false);
  });

});
