import { PERMISSION_KEYS, ROLE_PERMISSIONS, CROSS_BRANCH_ROLE_CODES, USERS } from '../../prisma/seed';

/**
 * Phase 4 hardening (RBAC dashboard-access gap): guards the seed data's
 * role/permission graph so the Owner/Clinic Manager roles this fix adds
 * can't silently regress -- every ROLE_PERMISSIONS entry must only
 * reference real permission keys (mirrors the runtime check in
 * seedPermissionsAndRoles), and Owner/Clinic Manager must exist with the
 * dashboard access the reporting Actor Matrix documents
 * (docs/01-prd/features/reporting.md, docs/03-sad/20-module-report.md).
 */
describe('seed RBAC integrity', () => {
  const permissionKeySet = new Set(PERMISSION_KEYS);

  it('every ROLE_PERMISSIONS entry only references keys that exist in PERMISSION_KEYS', () => {
    for (const [roleCode, keys] of Object.entries(ROLE_PERMISSIONS)) {
      for (const key of keys) {
        expect(permissionKeySet.has(key)).toBe(true);
        if (!permissionKeySet.has(key)) {
          throw new Error(`Role ${roleCode} references unknown permission ${key}`);
        }
      }
    }
  });

  it('OWNER exists, is cross-branch, and can reach the Executive/Branch/Comparison/Performance dashboards', () => {
    expect(ROLE_PERMISSIONS.OWNER).toBeDefined();
    expect(CROSS_BRANCH_ROLE_CODES.has('OWNER')).toBe(true);
    expect(ROLE_PERMISSIONS.OWNER).toEqual(
      expect.arrayContaining([
        'report.dashboard.executive.read',
        'report.dashboard.branch.read',
        'report.branch-comparison.read',
        'report.branch-performance.read',
      ]),
    );
  });

  it('CLINIC_MANAGER exists, is branch-scoped (not cross-branch), and can reach the Operations/Branch/Clinical dashboards', () => {
    expect(ROLE_PERMISSIONS.CLINIC_MANAGER).toBeDefined();
    expect(CROSS_BRANCH_ROLE_CODES.has('CLINIC_MANAGER')).toBe(false);
    expect(ROLE_PERMISSIONS.CLINIC_MANAGER).toEqual(
      expect.arrayContaining(['report.dashboard.operations.read', 'report.dashboard.branch.read', 'report.dashboard.clinical.read', 'queue.dashboard.read']),
    );
  });

  it('every seeded USER references a role that either is ADMINISTRATOR or exists in ROLE_PERMISSIONS', () => {
    for (const user of USERS) {
      const isKnownRole = user.roleCode === 'ADMINISTRATOR' || Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, user.roleCode);
      expect(isKnownRole).toBe(true);
    }
  });

  it('at least one seeded user is provisioned for OWNER and one for CLINIC_MANAGER', () => {
    expect(USERS.some((user) => user.roleCode === 'OWNER')).toBe(true);
    expect(USERS.some((user) => user.roleCode === 'CLINIC_MANAGER')).toBe(true);
  });
});
