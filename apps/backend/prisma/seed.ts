import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Dev-only seed: NOT a task-specified deliverable (no Phase 1 task defines
 * seed data). Provisions exactly what's needed to log in and exercise
 * RBAC locally: the full permission catalog actually enforced by every
 * `requirePermission(...)` call across the codebase (grepped, not
 * invented), one ADMINISTRATOR role holding all of them (per AUTH RBAC-004's
 * documented standard role list), and one admin User assigned to it.
 *
 * Password policy (docs/04-ai-contract/05-auth-contract.md AUTH-056..061):
 * min 8 chars, upper+lower+digit+special, not the username/email, not a
 * common password -- `Admin#12345` satisfies all of these.
 */

// Grepped from every `requirePermission('...')` call in src/modules --
// this IS the literal enforced catalog, not a guess at what might exist.
const PERMISSION_KEYS = [
  'billing.invoice.close',
  'billing.invoice.create',
  'billing.invoice.read',
  'billing.payment.create',
  'emr.diagnosis.record',
  'emr.soap.record',
  'emr.treatment.record',
  'emr.visit.close',
  'emr.visit.create',
  'emr.visit.read',
  'emr.vital.record',
  'masterdata.branch.manage',
  'masterdata.branch.read',
  'masterdata.clinic.manage',
  'masterdata.clinic.read',
  'masterdata.doctor.manage',
  'masterdata.doctor.read',
  'masterdata.payment-method.manage',
  'masterdata.payment-method.read',
  'masterdata.treatment.manage',
  'masterdata.treatment.read',
  'masterdata.treatment-category.manage',
  'masterdata.treatment-category.read',
  'patient.archive',
  'patient.create',
  'patient.read',
  'patient.update',
  'queue.call',
  'queue.cancel',
  'queue.complete',
  'queue.create',
  'queue.dashboard.read',
  'queue.read',
  'queue.recall',
  'queue.skip',
  'queue.start',
  'queue.transfer',
  'report.dashboard.operations.read',
  'reservation.cancel',
  'reservation.check-in',
  'reservation.create',
  'reservation.read',
  'reservation.reschedule',
  'reservation.update',
  'system.permission.read',
  'system.role.manage',
  'system.role.permission.manage',
  'system.role.read',
  'system.user.activate',
  'system.user.deactivate',
  'system.user.manage',
  'system.user.read',
  'system.user.role.manage',
  'system.user.session.revoke',
];

function toPermissionName(key: string): string {
  return key
    .split('.')
    .map((part) => part.replace(/-/g, ' '))
    .join(' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@parakita.local';
const ADMIN_PASSWORD = 'Admin#12345';

async function main() {
  const permissions = await Promise.all(
    PERMISSION_KEYS.map((key) =>
      prisma.permission.upsert({
        where: { permissionKey: key },
        update: {},
        create: {
          module: key.split('.')[0],
          permissionKey: key,
          permissionName: toPermissionName(key),
        },
      }),
    ),
  );

  const adminRole = await prisma.role.upsert({
    where: { roleCode: 'ADMINISTRATOR' },
    update: {},
    create: {
      roleCode: 'ADMINISTRATOR',
      roleName: 'Administrator',
      description: 'Full-access seeded role for local development.',
      isSystem: true,
    },
  });

  await Promise.all(
    permissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: permission.id },
      }),
    ),
  );

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const adminUser = await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: {},
    create: {
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      passwordHash,
      status: 'ACTIVE',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded ${permissions.length} permissions, role ADMINISTRATOR, and user:`);
  // eslint-disable-next-line no-console
  console.log(`  username: ${ADMIN_USERNAME}`);
  // eslint-disable-next-line no-console
  console.log(`  password: ${ADMIN_PASSWORD}`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
