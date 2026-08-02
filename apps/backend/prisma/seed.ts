import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Dev-only seed: NOT a task-specified deliverable (no Phase 1 task defines
 * seed data). Provisions what's needed to log in, exercise RBAC as
 * different roles, and manually click through every module in a browser
 * without first having to create Master Data by hand:
 *
 * - The full permission catalog actually enforced by every
 *   `requirePermission(...)` call in the codebase (grepped, not invented).
 * - Four roles (ADMINISTRATOR + DOCTOR/REGISTRATION/CASHIER, matching
 *   RBAC-004's documented standard role list) with permission subsets
 *   scoped to what each role's screens in apps/frontend actually call.
 * - One login user per role.
 * - One Clinic, two Branches, two Doctors (linked 1:1 to the doctor
 *   Users, per the schema's actual relation), four Treatment Categories,
 *   eight Treatments, and the seven Payment Methods named in
 *   docs/03-sad/16-module-billing.md's Payment Method list.
 *
 * Password policy (docs/04-ai-contract/05-auth-contract.md AUTH-056..061):
 * min 8 chars, upper+lower+digit+special, not the username/email, not a
 * common password. Every seeded user shares `Test#12345` except admin.
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

// Scoped to what each role's screens in apps/frontend actually call --
// not a documented RBAC matrix (docs/04-ai-contract/05-auth-contract.md
// RBAC-007: "the exact role-to-permission matrix MUST be treated as
// defined only where explicitly listed in the SAD", and the SAD does not
// enumerate one either), so this is a reasonable dev-seed judgment call,
// not an authoritative mapping.
const ROLE_PERMISSIONS: Record<string, string[]> = {
  DOCTOR: [
    'patient.read',
    'reservation.read',
    'queue.read',
    'queue.call',
    'queue.recall',
    'queue.start',
    'queue.complete',
    'emr.visit.create',
    'emr.visit.read',
    'emr.visit.close',
    'emr.vital.record',
    'emr.soap.record',
    'emr.diagnosis.record',
    'emr.treatment.record',
    'masterdata.treatment.read',
  ],
  REGISTRATION: [
    'patient.create',
    'patient.read',
    'patient.update',
    'patient.archive',
    'reservation.create',
    'reservation.read',
    'reservation.update',
    'reservation.reschedule',
    'reservation.cancel',
    'reservation.check-in',
    'queue.create',
    'queue.read',
    'queue.dashboard.read',
    'masterdata.doctor.read',
    'report.dashboard.operations.read',
  ],
  CASHIER: [
    'billing.invoice.read',
    'billing.invoice.create',
    'billing.invoice.close',
    'billing.payment.create',
    'patient.read',
    'masterdata.payment-method.read',
    'report.dashboard.operations.read',
  ],
};

function toPermissionName(key: string): string {
  return key
    .split('.')
    .map((part) => part.replace(/-/g, ' '))
    .join(' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const TEST_PASSWORD = 'Test#12345';

interface SeededUser {
  username: string;
  email: string;
  password: string;
  roleCode: string;
}

const USERS: SeededUser[] = [
  { username: 'admin', email: 'admin@parakita.local', password: 'Admin#12345', roleCode: 'ADMINISTRATOR' },
  { username: 'doctor1', email: 'amelia.putri@parakita.local', password: TEST_PASSWORD, roleCode: 'DOCTOR' },
  { username: 'doctor2', email: 'bayu.aji@parakita.local', password: TEST_PASSWORD, roleCode: 'DOCTOR' },
  { username: 'registration1', email: 'registration1@parakita.local', password: TEST_PASSWORD, roleCode: 'REGISTRATION' },
  { username: 'cashier1', email: 'cashier1@parakita.local', password: TEST_PASSWORD, roleCode: 'CASHIER' },
];

async function seedPermissionsAndRoles() {
  const permissions = await Promise.all(
    PERMISSION_KEYS.map((key) =>
      prisma.permission.upsert({
        where: { permissionKey: key },
        update: {},
        create: { module: key.split('.')[0], permissionKey: key, permissionName: toPermissionName(key) },
      }),
    ),
  );
  const permissionByKey = new Map(permissions.map((p) => [p.permissionKey, p]));

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

  for (const [roleCode, keys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { roleCode },
      update: {},
      create: {
        roleCode,
        roleName: roleCode.charAt(0) + roleCode.slice(1).toLowerCase(),
        description: `Seeded ${roleCode.toLowerCase()} role for local development.`,
        isSystem: true,
      },
    });
    await Promise.all(
      keys.map((key) => {
        const permission = permissionByKey.get(key);
        if (!permission) throw new Error(`Seed error: role ${roleCode} references unknown permission ${key}`);
        return prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
          update: {},
          create: { roleId: role.id, permissionId: permission.id },
        });
      }),
    );
  }

  return permissions.length;
}

async function seedUsers(): Promise<Map<string, string>> {
  const userIdByUsername = new Map<string, string>();
  for (const seededUser of USERS) {
    const role = await prisma.role.findUniqueOrThrow({ where: { roleCode: seededUser.roleCode } });
    const passwordHash = await bcrypt.hash(seededUser.password, 12);
    const user = await prisma.user.upsert({
      where: { username: seededUser.username },
      update: {},
      create: { username: seededUser.username, email: seededUser.email, passwordHash, status: 'ACTIVE' },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });
    userIdByUsername.set(seededUser.username, user.id);
  }
  return userIdByUsername;
}

async function seedMasterData(userIdByUsername: Map<string, string>) {
  const clinic = await prisma.clinic.upsert({
    where: { clinicCode: 'PM01' },
    update: {},
    create: {
      clinicCode: 'PM01',
      clinicName: 'Parakita Medika',
      legalName: 'PT Parakita Medika Indonesia',
      taxNumber: '01.234.567.8-901.000',
      ownerName: 'Budi Hartono',
      phone: '021-5551234',
      email: 'info@parakitamedika.local',
      address: 'Jl. Kemang Raya No. 10, Jakarta Selatan',
    },
  });

  const branchKemang = await prisma.branch.upsert({
    where: { branchCode: 'PM01-KMG' },
    update: {},
    create: {
      clinicId: clinic.id,
      branchCode: 'PM01-KMG',
      branchName: 'Parakita Medika - Cabang Kemang',
      phone: '021-5551234',
      email: 'kemang@parakitamedika.local',
      address: 'Jl. Kemang Raya No. 10, Jakarta Selatan',
    },
  });

  const branchBsd = await prisma.branch.upsert({
    where: { branchCode: 'PM01-BSD' },
    update: {},
    create: {
      clinicId: clinic.id,
      branchCode: 'PM01-BSD',
      branchName: 'Parakita Medika - Cabang BSD',
      phone: '021-5555678',
      email: 'bsd@parakitamedika.local',
      address: 'Jl. BSD Boulevard No. 5, Tangerang Selatan',
    },
  });

  await prisma.doctor.upsert({
    where: { doctorCode: 'DOC001' },
    update: {},
    create: {
      doctorCode: 'DOC001',
      userId: userIdByUsername.get('doctor1')!,
      branchId: branchKemang.id,
      fullName: 'drg. Amelia Putri',
      specialization: 'Dokter Gigi Umum',
      sipNumber: 'SIP-001-2024',
      consultationFee: 150000,
      phone: '0812-1000-0001',
      email: 'amelia.putri@parakita.local',
    },
  });

  await prisma.doctor.upsert({
    where: { doctorCode: 'DOC002' },
    update: {},
    create: {
      doctorCode: 'DOC002',
      userId: userIdByUsername.get('doctor2')!,
      branchId: branchBsd.id,
      fullName: 'drg. Bayu Aji',
      specialization: 'Ortodonti',
      sipNumber: 'SIP-002-2024',
      consultationFee: 200000,
      phone: '0812-1000-0002',
      email: 'bayu.aji@parakita.local',
    },
  });

  const categories: Array<{ categoryCode: string; categoryName: string }> = [
    { categoryCode: 'KONS', categoryName: 'Konservasi Gigi' },
    { categoryCode: 'BEDAH', categoryName: 'Bedah Mulut' },
    { categoryCode: 'ORTHO', categoryName: 'Ortodonti' },
    { categoryCode: 'PREV', categoryName: 'Preventif & Kebersihan Gigi' },
  ];
  const categoryIdByCode = new Map<string, string>();
  for (const category of categories) {
    const row = await prisma.treatmentCategory.upsert({
      where: { categoryCode: category.categoryCode },
      update: {},
      create: category,
    });
    categoryIdByCode.set(category.categoryCode, row.id);
  }

  const treatments: Array<{
    treatmentCode: string;
    treatmentName: string;
    categoryCode: string;
    durationMinute: number;
    defaultPrice: number;
    doctorFee: number;
  }> = [
    { treatmentCode: 'TRT001', treatmentName: 'Tambal Gigi (Komposit)', categoryCode: 'KONS', durationMinute: 45, defaultPrice: 350000, doctorFee: 100000 },
    { treatmentCode: 'TRT002', treatmentName: 'Perawatan Saluran Akar', categoryCode: 'KONS', durationMinute: 90, defaultPrice: 1200000, doctorFee: 400000 },
    { treatmentCode: 'TRT003', treatmentName: 'Cabut Gigi Sederhana', categoryCode: 'BEDAH', durationMinute: 30, defaultPrice: 250000, doctorFee: 75000 },
    { treatmentCode: 'TRT004', treatmentName: 'Cabut Gigi Bedah / Impaksi', categoryCode: 'BEDAH', durationMinute: 60, defaultPrice: 1500000, doctorFee: 500000 },
    { treatmentCode: 'TRT005', treatmentName: 'Pemasangan Behel Metal', categoryCode: 'ORTHO', durationMinute: 60, defaultPrice: 8000000, doctorFee: 1500000 },
    { treatmentCode: 'TRT006', treatmentName: 'Kontrol Behel Bulanan', categoryCode: 'ORTHO', durationMinute: 20, defaultPrice: 150000, doctorFee: 50000 },
    { treatmentCode: 'TRT007', treatmentName: 'Scaling / Pembersihan Karang Gigi', categoryCode: 'PREV', durationMinute: 30, defaultPrice: 200000, doctorFee: 60000 },
    { treatmentCode: 'TRT008', treatmentName: 'Fluoride Treatment', categoryCode: 'PREV', durationMinute: 20, defaultPrice: 150000, doctorFee: 40000 },
  ];
  for (const treatment of treatments) {
    await prisma.treatment.upsert({
      where: { treatmentCode: treatment.treatmentCode },
      update: {},
      create: {
        treatmentCode: treatment.treatmentCode,
        treatmentName: treatment.treatmentName,
        treatmentCategoryId: categoryIdByCode.get(treatment.categoryCode)!,
        durationMinute: treatment.durationMinute,
        defaultPrice: treatment.defaultPrice,
        doctorFee: treatment.doctorFee,
      },
    });
  }

  // docs/03-sad/16-module-billing.md Section "Payment Method" list, verbatim.
  const paymentMethods: Array<{ methodCode: string; methodName: string; isCash: boolean }> = [
    { methodCode: 'CASH', methodName: 'Cash', isCash: true },
    { methodCode: 'DEBIT', methodName: 'Debit Card', isCash: false },
    { methodCode: 'CREDIT', methodName: 'Credit Card', isCash: false },
    { methodCode: 'QRIS', methodName: 'QRIS', isCash: false },
    { methodCode: 'TRANSFER', methodName: 'Transfer', isCash: false },
    { methodCode: 'DEPOSIT', methodName: 'Deposit', isCash: false },
    { methodCode: 'EWALLET', methodName: 'E-Wallet', isCash: false },
  ];
  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({ where: { methodCode: method.methodCode }, update: {}, create: method });
  }

  return {
    clinics: 1,
    branches: 2,
    doctors: 2,
    treatmentCategories: categories.length,
    treatments: treatments.length,
    paymentMethods: paymentMethods.length,
  };
}

async function main() {
  const permissionCount = await seedPermissionsAndRoles();
  const userIdByUsername = await seedUsers();
  const masterDataCounts = await seedMasterData(userIdByUsername);

  // eslint-disable-next-line no-console
  console.log(`Seeded ${permissionCount} permissions and roles: ${['ADMINISTRATOR', ...Object.keys(ROLE_PERMISSIONS)].join(', ')}`);
  // eslint-disable-next-line no-console
  console.log(
    `Seeded Master Data: ${masterDataCounts.clinics} clinic, ${masterDataCounts.branches} branches, ${masterDataCounts.doctors} doctors, ${masterDataCounts.treatmentCategories} treatment categories, ${masterDataCounts.treatments} treatments, ${masterDataCounts.paymentMethods} payment methods.`,
  );
  // eslint-disable-next-line no-console
  console.log('Login users:');
  for (const user of USERS) {
    // eslint-disable-next-line no-console
    console.log(`  ${user.roleCode.padEnd(14)} username: ${user.username.padEnd(16)} password: ${user.password}`);
  }
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
