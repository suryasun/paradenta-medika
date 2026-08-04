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
  'emr.allergy.record',
  'emr.attachment.annotate',
  'emr.attachment.archive',
  'emr.attachment.read',
  'emr.attachment.restore',
  'emr.attachment.upload',
  'emr.certificate.issue',
  'emr.certificate.read',
  'emr.consent-template.manage',
  'emr.consent-template.read',
  'emr.consent.create',
  'emr.consent.read',
  'emr.consent.sign',
  'emr.diagnosis.record',
  'emr.followup.create',
  'emr.medical-history.record',
  'emr.odontogram.read',
  'emr.odontogram.record',
  'emr.periodontal.create',
  'emr.periodontal.lock',
  'emr.periodontal.measurement.delete',
  'emr.periodontal.measurement.record',
  'emr.periodontal.measurement.update',
  'emr.periodontal.read',
  'emr.prescription.create',
  'emr.prescription.read',
  'emr.referral.create',
  'emr.soap.record',
  'emr.timeline.read',
  'emr.treatment.record',
  'emr.treatment-plan.create',
  'emr.treatment-plan.read',
  'emr.visit.close',
  'emr.visit.create',
  'emr.visit.read',
  'emr.vital.record',
  'finance.account.manage',
  'finance.account.read',
  'finance.cash.approve_close',
  'finance.cash.close',
  'finance.cash.manage',
  'finance.cash.read',
  'finance.cash.transfer',
  'finance.expense.approve',
  'finance.expense.create',
  'finance.expense.pay',
  'finance.expense.read',
  'finance.journal.create',
  'finance.journal.post',
  'finance.journal.read',
  'finance.journal.reverse',
  'finance.journal.update',
  'finance.journal.void',
  'finance.period.close',
  'finance.period.lock',
  'finance.period.manage',
  'finance.period.read',
  'finance.period.reopen',
  'finance.report.export',
  'finance.report.read',
  'finance.settlement.approve',
  'finance.settlement.generate',
  'finance.settlement.pay',
  'finance.settlement.read',
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
  'masterdata.tooth-condition.manage',
  'masterdata.tooth-condition.read',
  'masterdata.template.manage',
  'masterdata.template.read',
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
  'report.audit.read',
  'report.billing.read',
  'report.catalog.read',
  'report.clinical.read',
  'report.export.create',
  'report.export.download',
  'report.job.cancel',
  'report.job.create',
  'report.dashboard.clinical.read',
  'report.dashboard.executive.read',
  'report.dashboard.finance.read',
  'report.dashboard.operations.read',
  'report.dashboard.warehouse.read',
  'report.dashboard.branch.read',
  'report.branch-comparison.read',
  'report.branch-performance.read',
  'report.finance.read',
  'report.hr.payroll.read',
  'report.hr.read',
  'report.operations.read',
  'report.warehouse.read',
  'reservation.analytics.read',
  'reservation.cancel',
  'reservation.check-in',
  'reservation.create',
  'reservation.read',
  'reservation.reschedule',
  'reservation.update',
  'system.activity.read',
  'system.audit.read',
  'system.config-request.approve',
  'system.config-request.create',
  'system.feature-flag.manage',
  'system.feature-flag.read',
  'system.menu.manage',
  'system.menu.read',
  'system.notification-template.manage',
  'system.notification-template.read',
  'system.notification.read',
  'system.parameter.manage',
  'system.parameter.read',
  'system.health.read',
  'system.job.manage',
  'system.job.read',
  'system.permission.read',
  'system.role.manage',
  'system.role.branch-policy.manage',
  'system.role.permission.manage',
  'system.role.read',
  'system.user.activate',
  'system.user.deactivate',
  'system.user.manage',
  'system.user.read',
  'system.user.role.manage',
  'system.user.branch.manage',
  'system.user.session.revoke',
  'warehouse.batch.quarantine',
  'warehouse.batch.read',
  'warehouse.item.manage',
  'warehouse.item.read',
  'warehouse.location.manage',
  'warehouse.location.read',
  'warehouse.opname.approve',
  'warehouse.opname.count',
  'warehouse.opname.create',
  'warehouse.opname.post',
  'warehouse.opname.read',
  'warehouse.purchase.approve',
  'warehouse.purchase.cancel',
  'warehouse.purchase.create',
  'warehouse.purchase.post',
  'warehouse.purchase.read',
  'warehouse.purchase.receive',
  'warehouse.purchase.submit',
  'warehouse.report.read',
  'warehouse.stock.adjust',
  'warehouse.stock.adjust.post',
  'warehouse.stock.read',
  'warehouse.stock.reserve',
  'warehouse.stock.transfer',
  'warehouse.supplier.manage',
  'warehouse.supplier.read',
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
    'emr.medical-history.record',
    'emr.allergy.record',
    'emr.odontogram.record',
    'emr.odontogram.read',
    'emr.treatment-plan.create',
    'emr.treatment-plan.read',
    'emr.periodontal.create',
    'emr.periodontal.lock',
    'emr.periodontal.measurement.delete',
    'emr.periodontal.measurement.record',
    'emr.periodontal.measurement.update',
    'emr.periodontal.read',
    'emr.referral.create',
    'emr.followup.create',
    'emr.attachment.upload',
    'emr.attachment.read',
    'emr.attachment.annotate',
    'emr.attachment.archive',
    'emr.attachment.restore',
    'emr.prescription.create',
    'emr.prescription.read',
    'emr.consent-template.read',
    'emr.consent.create',
    'emr.consent.sign',
    'emr.consent.read',
    'emr.certificate.issue',
    'emr.certificate.read',
    'emr.timeline.read',
    'reservation.create',
    'masterdata.treatment.read',
    'masterdata.tooth-condition.read',
    'report.dashboard.clinical.read',
    'report.catalog.read',
    'system.notification.read',
    'report.job.create',
    'report.job.cancel',
    'report.export.download',
    'report.clinical.read',
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
    'report.catalog.read',
    'system.notification.read',
    'report.job.create',
    'report.job.cancel',
    'report.export.download',
    'report.operations.read',
    'report.billing.read',
  ],
  CASHIER: [
    'billing.invoice.read',
    'billing.invoice.create',
    'billing.invoice.close',
    'billing.payment.create',
    'patient.read',
    'masterdata.payment-method.read',
    'report.dashboard.operations.read',
    'report.catalog.read',
    'system.notification.read',
    'report.job.create',
    'report.job.cancel',
    'report.export.download',
    'report.operations.read',
    'report.billing.read',
  ],
  // docs/03-sad/18-module-warehouse.md Section 4.1 Actor Matrix: Warehouse
  // Staff can view stock/create-submit PO/receive but NOT "Kelola item/
  // warehouse" (manage item/supplier/location master data), "Approve/
  // reject PO", or Post (task-114's explicit segregation-of-duties note --
  // Post is a stricter tier than Create/Receive, kept Manager-only here).
  WAREHOUSE_STAFF: [
    'warehouse.item.read',
    'warehouse.supplier.read',
    'warehouse.location.read',
    'warehouse.stock.read',
    'warehouse.purchase.read',
    'warehouse.purchase.create',
    'warehouse.purchase.submit',
    'warehouse.purchase.receive',
    // task-115-126 (Epic X): Transfer/Adjustment/Reservation share one
    // permission across their lifecycle steps (see warehouse.routes.ts
    // comments) since self-approval is blocked at the use-case level, not
    // the permission level -- so Staff gets the same `.transfer`/`.adjust`/
    // `.reserve` grants as Manager, matching the Actor Matrix's "Transfer/
    // issue stock", "Create adjustment", and "Reserve stock" rows. Post
    // (`.adjust.post`) is intentionally withheld -- Manager-only.
    'warehouse.stock.transfer',
    'warehouse.stock.adjust',
    'warehouse.stock.reserve',
    // task-127-135 (Epic Y): opname read/create/count reuses the same
    // "Adjustment/opname ✔" Actor Matrix row as Staff's adjust grant above
    // -- opname.approve/opname.post are withheld, mirroring "Approve
    // variance/adjustment" being a Manager-only row. Batch quarantine is
    // a safety action any warehouse worker should be able to trigger
    // immediately on discovering a bad batch (Section 8.2 only requires a
    // *high* role for quarantine *release*, which this phase doesn't
    // implement), so both roles get it.
    'warehouse.opname.read',
    'warehouse.opname.create',
    'warehouse.opname.count',
    'warehouse.batch.read',
    'warehouse.batch.quarantine',
    // task-137-142 (Epic AA): "Export laporan ✔" Actor Matrix row covers
    // both roles for report *read* access (export itself isn't
    // implemented this phase -- see warehouse.routes.ts comment).
    'warehouse.report.read',
    'report.dashboard.warehouse.read',
    'report.catalog.read',
    'system.notification.read',
    'report.job.create',
    'report.job.cancel',
    'report.export.download',
    'report.warehouse.read',
  ],
  // Warehouse Manager has every row in the Actor Matrix ✔ except the
  // Finance-specific "Approve variance/adjustment (financial threshold)"
  // column, which is not part of Epic V/W's scope (task-095-114).
  WAREHOUSE_MANAGER: [
    'warehouse.item.read',
    'warehouse.item.manage',
    'warehouse.supplier.read',
    'warehouse.supplier.manage',
    'warehouse.location.read',
    'warehouse.location.manage',
    'warehouse.stock.read',
    'warehouse.purchase.read',
    'warehouse.purchase.create',
    'warehouse.purchase.submit',
    'warehouse.purchase.approve',
    'warehouse.purchase.cancel',
    'warehouse.purchase.receive',
    'warehouse.purchase.post',
    'warehouse.stock.transfer',
    'warehouse.stock.adjust',
    'warehouse.stock.adjust.post',
    'warehouse.stock.reserve',
    'warehouse.opname.read',
    'warehouse.opname.create',
    'warehouse.opname.count',
    'warehouse.opname.approve',
    'warehouse.opname.post',
    'warehouse.batch.read',
    'warehouse.batch.quarantine',
    'warehouse.report.read',
    'report.dashboard.warehouse.read',
    'report.catalog.read',
    'system.notification.read',
    'report.job.create',
    'report.job.cancel',
    'report.export.download',
    'report.warehouse.read',
  ],
  // docs/03-sad/17-module-finance.md Section 4.1 Actor Matrix: "Maintain
  // COA mapping" is Finance Manager (and Administrator) only -- Finance
  // Staff can read the chart of accounts (needed to pick accounts on a
  // manual journal, Epic AC) but not create/edit/deactivate it.
  // docs/03-sad/17-module-finance.md Section 4.1 Actor Matrix: Staff can
  // view ledger/reports and create/submit manual journals but not post/
  // reverse them (Post/reverse is Manager-only, matching Warehouse's own
  // dual-tier create-vs-post precedent); Update/Void apply only to a
  // journal's own draft state, granted alongside Create. Period Create
  // isn't its own matrix row -- period.manage follows "Close/reopen
  // period" being Manager-only, and period.read is harmless/useful for
  // both roles to check valid posting dates.
  // task-153-161 (Epic AD): "Create/submit expense ✔" and "Pay expense
  // ✔" both include Staff per the Actor Matrix; "Approve expense" is
  // Manager-only. Cash account create/manage isn't its own matrix row --
  // follows the same Manager-only tier as COA mapping; cash.transfer
  // (which posts a journal, not unlike Create manual journal) is granted
  // to both.
  // task-162-171 (Epic AE): "Daily cash close ✔" includes Staff (own
  // shift), "Approve closing variance" is Manager-only. Doctor Fee
  // Settlement has no dedicated Actor Matrix row -- mirrors Expense's own
  // generate(create)/pay-both, approve-Manager-only tiering. Period
  // Lock/Close are Manager-only per "Close/reopen period" ✔ Manager;
  // Reopen is intentionally withheld from Manager -- task-171's own text
  // ("elevated authorization... distinct from ordinary period-manage
  // permission") maps to Administrator-only (Administrator already gets
  // every permission via the blanket grant below, not through this map).
  // task-172-177 (Epic AF): reports have no dedicated Actor Matrix row --
  // finance.report.read is granted to both roles since either needs to
  // view operational/statutory reports; finance.report.export (reserved,
  // no export-format endpoint exists yet) stays Manager-only.
  FINANCE_STAFF: [
    'finance.account.read',
    'finance.journal.read',
    'finance.journal.create',
    'finance.journal.update',
    'finance.journal.void',
    'finance.period.read',
    'finance.cash.read',
    'finance.cash.transfer',
    'finance.cash.close',
    'finance.expense.read',
    'finance.expense.create',
    'finance.expense.pay',
    'finance.settlement.generate',
    'finance.settlement.pay',
    'finance.settlement.read',
    'finance.report.read',
    'report.dashboard.finance.read',
    'report.catalog.read',
    'system.notification.read',
    'report.job.create',
    'report.job.cancel',
    'report.export.download',
    'report.finance.read',
  ],
  FINANCE_MANAGER: [
    'finance.account.read',
    'finance.account.manage',
    'finance.journal.read',
    'finance.journal.create',
    'finance.journal.update',
    'finance.journal.void',
    'finance.journal.post',
    'finance.journal.reverse',
    'finance.period.read',
    'finance.period.manage',
    'finance.period.lock',
    'finance.period.close',
    'finance.cash.read',
    'finance.cash.manage',
    'finance.cash.transfer',
    'finance.cash.close',
    'finance.cash.approve_close',
    'finance.expense.read',
    'finance.expense.create',
    'finance.expense.approve',
    'finance.expense.pay',
    'finance.settlement.generate',
    'finance.settlement.approve',
    'finance.settlement.pay',
    'finance.settlement.read',
    'finance.report.read',
    'finance.report.export',
    'report.dashboard.finance.read',
    'report.catalog.read',
    'system.notification.read',
    'report.job.create',
    'report.job.cancel',
    'report.export.download',
    'report.finance.read',
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
  { username: 'warehouse_staff1', email: 'warehouse.staff1@parakita.local', password: TEST_PASSWORD, roleCode: 'WAREHOUSE_STAFF' },
  { username: 'warehouse_manager1', email: 'warehouse.manager1@parakita.local', password: TEST_PASSWORD, roleCode: 'WAREHOUSE_MANAGER' },
  { username: 'finance_staff1', email: 'finance.staff1@parakita.local', password: TEST_PASSWORD, roleCode: 'FINANCE_STAFF' },
  { username: 'finance_manager1', email: 'finance.manager1@parakita.local', password: TEST_PASSWORD, roleCode: 'FINANCE_MANAGER' },
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
    // docs/06-tasks/task-216.md/task-217.md (Phase 4 Epic BC): Administrator
    // is a cross-branch role by definition, per the Actor Matrix pattern
    // (Owner/Administrator/Security Admin) referenced throughout Phase 4.
    // `update` also sets it so pre-Phase-4 seeded databases upgrade correctly.
    update: { isCrossBranch: true },
    create: {
      roleCode: 'ADMINISTRATOR',
      roleName: 'Administrator',
      description: 'Full-access seeded role for local development.',
      isSystem: true,
      isCrossBranch: true,
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

  // Doctor Schedule (docs/03-sad/13-module-reservation.md Section 15/16):
  // no CRUD endpoint exists for this entity anywhere in the app (it is
  // read-only from GetDoctorTimeSlotsUseCase/DoctorScheduleValidator), so
  // seed data is the only way to populate it for manual/dev testing.
  // Mon-Sat (dayOfWeek 1-6, getUTCDay() convention), 08:00-17:00 UTC,
  // 30-minute slots, up to 3 patients per slot -- a reasonable dev-seed
  // schedule, not a documented SAD default (none is specified).
  const doctorSchedules: Array<{ doctorCode: string; dayOfWeek: number }> = [
    { doctorCode: 'DOC001', dayOfWeek: 1 },
    { doctorCode: 'DOC001', dayOfWeek: 2 },
    { doctorCode: 'DOC001', dayOfWeek: 3 },
    { doctorCode: 'DOC001', dayOfWeek: 4 },
    { doctorCode: 'DOC001', dayOfWeek: 5 },
    { doctorCode: 'DOC001', dayOfWeek: 6 },
    { doctorCode: 'DOC002', dayOfWeek: 1 },
    { doctorCode: 'DOC002', dayOfWeek: 2 },
    { doctorCode: 'DOC002', dayOfWeek: 3 },
    { doctorCode: 'DOC002', dayOfWeek: 4 },
    { doctorCode: 'DOC002', dayOfWeek: 5 },
    { doctorCode: 'DOC002', dayOfWeek: 6 },
  ];
  for (const entry of doctorSchedules) {
    const doctor = await prisma.doctor.findUniqueOrThrow({ where: { doctorCode: entry.doctorCode } });
    const existing = await prisma.doctorSchedule.findFirst({
      where: { doctorId: doctor.id, dayOfWeek: entry.dayOfWeek, deletedAt: null },
    });
    if (!existing) {
      await prisma.doctorSchedule.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: entry.dayOfWeek,
          startTime: new Date('1970-01-01T08:00:00.000Z'),
          endTime: new Date('1970-01-01T17:00:00.000Z'),
          slotDuration: 30,
          maxPatient: 3,
          isActive: true,
        },
      });
    }
  }

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

  // docs/03-sad/15-module-emr.md Part 3.1C Section 21.3 "Standard Tooth
  // Conditions" list, verbatim. Category assignment follows Section 21.2's
  // 8 categories; colorCode follows Section 27's literal color table where
  // given -- entries not named in Section 27 use a neutral "Slate" default
  // (a seed-script judgment call, not a documented requirement).
  const toothConditions: Array<{
    conditionCode: string;
    conditionName: string;
    category:
      | 'HEALTHY'
      | 'DISEASE'
      | 'RESTORATION'
      | 'PROSTHODONTIC'
      | 'ENDODONTIC'
      | 'SURGICAL'
      | 'ORTHODONTIC'
      | 'IMPLANTOLOGY';
    colorCode: string;
  }> = [
    { conditionCode: 'HEALTHY', conditionName: 'Healthy', category: 'HEALTHY', colorCode: 'Green' },
    { conditionCode: 'INITIAL_CARIES', conditionName: 'Initial Caries', category: 'DISEASE', colorCode: 'Red' },
    { conditionCode: 'DEEP_CARIES', conditionName: 'Deep Caries', category: 'DISEASE', colorCode: 'Red' },
    { conditionCode: 'PULPITIS', conditionName: 'Pulpitis', category: 'DISEASE', colorCode: 'Slate' },
    { conditionCode: 'NECROTIC_PULP', conditionName: 'Necrotic Pulp', category: 'DISEASE', colorCode: 'Slate' },
    { conditionCode: 'ROOT_RESIDUE', conditionName: 'Root Residue', category: 'DISEASE', colorCode: 'Slate' },
    { conditionCode: 'MISSING_TOOTH', conditionName: 'Missing Tooth', category: 'DISEASE', colorCode: 'Gray' },
    { conditionCode: 'FRACTURE', conditionName: 'Fracture', category: 'DISEASE', colorCode: 'Orange' },
    { conditionCode: 'CRACK_TOOTH', conditionName: 'Crack Tooth', category: 'DISEASE', colorCode: 'Orange' },
    { conditionCode: 'ABRASION', conditionName: 'Abrasion', category: 'DISEASE', colorCode: 'Slate' },
    { conditionCode: 'ATTRITION', conditionName: 'Attrition', category: 'DISEASE', colorCode: 'Slate' },
    { conditionCode: 'EROSION', conditionName: 'Erosion', category: 'DISEASE', colorCode: 'Slate' },
    { conditionCode: 'COMPOSITE_FILLING', conditionName: 'Composite Filling', category: 'RESTORATION', colorCode: 'Blue' },
    { conditionCode: 'GLASS_IONOMER_CEMENT', conditionName: 'Glass Ionomer Cement', category: 'RESTORATION', colorCode: 'Blue' },
    { conditionCode: 'AMALGAM_FILLING', conditionName: 'Amalgam Filling', category: 'RESTORATION', colorCode: 'Blue' },
    { conditionCode: 'TEMPORARY_FILLING', conditionName: 'Temporary Filling', category: 'RESTORATION', colorCode: 'Yellow' },
    { conditionCode: 'ROOT_CANAL_TREATMENT', conditionName: 'Root Canal Treatment', category: 'ENDODONTIC', colorCode: 'Purple' },
    { conditionCode: 'CROWN', conditionName: 'Crown', category: 'PROSTHODONTIC', colorCode: 'Gold' },
    { conditionCode: 'BRIDGE', conditionName: 'Bridge', category: 'PROSTHODONTIC', colorCode: 'Gold' },
    { conditionCode: 'IMPLANT', conditionName: 'Implant', category: 'IMPLANTOLOGY', colorCode: 'Silver' },
    { conditionCode: 'EXTRACTION', conditionName: 'Extraction', category: 'SURGICAL', colorCode: 'Gray' },
    { conditionCode: 'MOBILITY', conditionName: 'Mobility', category: 'DISEASE', colorCode: 'Brown' },
    { conditionCode: 'IMPACTED_TOOTH', conditionName: 'Impacted Tooth', category: 'SURGICAL', colorCode: 'Slate' },
    { conditionCode: 'UNERUPTED_TOOTH', conditionName: 'Unerupted Tooth', category: 'DISEASE', colorCode: 'Slate' },
    { conditionCode: 'SEALANT', conditionName: 'Sealant', category: 'RESTORATION', colorCode: 'Blue' },
    { conditionCode: 'PERIAPICAL_LESION', conditionName: 'Periapical Lesion', category: 'DISEASE', colorCode: 'Red' },
  ];
  for (const condition of toothConditions) {
    await prisma.toothCondition.upsert({ where: { conditionCode: condition.conditionCode }, update: {}, create: condition });
  }

  // docs/03-sad/15-module-emr.md Part 3.3D Section 39 "Consent Categories"
  // -- one representative template per task-085's literal 3-category list.
  // ConsentTemplate has no natural unique code, so `title` is used as the
  // idempotency key for this dev seed only (not a DB constraint).
  const consentTemplates: Array<{ category: 'GENERAL' | 'CLINICAL' | 'SURGICAL'; title: string; body: string }> = [
    {
      category: 'GENERAL',
      title: 'Registration & Privacy Consent',
      body: 'I consent to registration at Parakita Medika and to the collection and processing of my personal data per the clinic privacy policy.',
    },
    {
      category: 'CLINICAL',
      title: 'Dental Treatment Consent',
      body: 'I have been informed of the proposed dental treatment, its risks, benefits, and alternatives, and I consent to proceed.',
    },
    {
      category: 'SURGICAL',
      title: 'Tooth Extraction / Surgical Consent',
      body: 'I have been informed of the risks of the surgical procedure (including anesthesia) and consent to proceed.',
    },
  ];
  for (const template of consentTemplates) {
    const existing = await prisma.consentTemplate.findFirst({ where: { title: template.title } });
    if (!existing) {
      await prisma.consentTemplate.create({ data: template });
    }
  }

  // Warehouse Module (docs/03-sad/18-module-warehouse.md, Epic V Foundation):
  // ItemCategory/Unit are the minimal FK targets the Item entity's own
  // documented fields require (see prisma/schema.prisma comment above
  // ItemCategory) -- no dedicated CRUD endpoint exists for either, so a
  // small fixed reference set is seeded directly.
  const itemCategories: Array<{ categoryCode: string; categoryName: string }> = [
    { categoryCode: 'DENTAL-MAT', categoryName: 'Dental Material' },
    { categoryCode: 'DENTAL-CONS', categoryName: 'Dental Consumable' },
    { categoryCode: 'NON-MEDICAL', categoryName: 'Non-Medical Supply' },
  ];
  const itemCategoryIdByCode = new Map<string, string>();
  for (const category of itemCategories) {
    const row = await prisma.itemCategory.upsert({
      where: { categoryCode: category.categoryCode },
      update: {},
      create: category,
    });
    itemCategoryIdByCode.set(category.categoryCode, row.id);
  }

  const units: Array<{ unitCode: string; unitName: string }> = [
    { unitCode: 'PCS', unitName: 'Piece' },
    { unitCode: 'BOX', unitName: 'Box' },
    { unitCode: 'PACK', unitName: 'Pack' },
  ];
  const unitIdByCode = new Map<string, string>();
  for (const unit of units) {
    const row = await prisma.unit.upsert({ where: { unitCode: unit.unitCode }, update: {}, create: unit });
    unitIdByCode.set(unit.unitCode, row.id);
  }

  // Sample Item/Supplier/WarehouseLocation for manual/live testing of
  // Epic V's endpoints, mirroring the sample-data pattern already used for
  // Treatments/PaymentMethods above.
  await prisma.warehouseLocation.upsert({
    where: { branchId_locationCode: { branchId: branchKemang.id, locationCode: 'WH-KMG-01' } },
    update: {},
    create: {
      branchId: branchKemang.id,
      locationCode: 'WH-KMG-01',
      locationName: 'Kemang Main Warehouse',
      locationType: 'MAIN',
      address: branchKemang.address,
    },
  });

  await prisma.supplier.upsert({
    where: { supplierCode: 'SUP-001' },
    update: {},
    create: {
      supplierCode: 'SUP-001',
      supplierName: 'PT Dental Supply Nusantara',
      picName: 'Rina Wijaya',
      phone: '021-7000-1000',
      address: 'Jl. Industri Dental No. 10, Jakarta',
    },
  });

  const items: Array<{
    itemCode: string;
    itemName: string;
    categoryCode: string;
    unitCode: string;
    minimumStock: number;
    isBatchTracked: boolean;
    isExpiryTracked: boolean;
  }> = [
    {
      itemCode: 'MAT-COMP-001',
      itemName: 'Dental Composite Resin',
      categoryCode: 'DENTAL-MAT',
      unitCode: 'PCS',
      minimumStock: 10,
      isBatchTracked: true,
      isExpiryTracked: true,
    },
    {
      itemCode: 'CONS-GLOVE-001',
      itemName: 'Latex Examination Gloves (Box)',
      categoryCode: 'DENTAL-CONS',
      unitCode: 'BOX',
      minimumStock: 20,
      isBatchTracked: false,
      isExpiryTracked: false,
    },
  ];
  for (const item of items) {
    await prisma.item.upsert({
      where: { itemCode: item.itemCode },
      update: {},
      create: {
        itemCode: item.itemCode,
        itemName: item.itemName,
        categoryId: itemCategoryIdByCode.get(item.categoryCode)!,
        unitId: unitIdByCode.get(item.unitCode)!,
        minimumStock: item.minimumStock,
        isConsumable: true,
        isBatchTracked: item.isBatchTracked,
        isExpiryTracked: item.isExpiryTracked,
      },
    });
  }
  return {
    clinics: 1,
    branches: 2,
    doctors: 2,
    doctorSchedules: doctorSchedules.length,
    treatmentCategories: categories.length,
    treatments: treatments.length,
    paymentMethods: paymentMethods.length,
    toothConditions: toothConditions.length,
    consentTemplates: consentTemplates.length,
    itemCategories: itemCategories.length,
    units: units.length,
    warehouseItems: items.length,
    warehouseSuppliers: 1,
    warehouseLocations: 1,
  };
}

// docs/03-sad/12-module-patient.md Section 16.1 required fields (fullName/
// gender/dateOfBirth/phoneNumber/address). MRNs assigned directly in the
// same MRN000001 format apps/backend's MedicalRecordNumberGenerator
// produces, rather than going through CreatePatientUseCase, since a seed
// script has no HTTP request/actor context to construct one. One patient
// (Dewi Lestari) is seeded archived, to exercise the Patient Archive/
// Restore action without needing to do it manually first.
async function seedPatients() {
  const patients: Array<{
    mrn: string;
    patientName: string;
    gender: 'MALE' | 'FEMALE';
    birthDate: string;
    birthPlace: string;
    phone: string;
    email?: string;
    identityNumber: string;
    address: string;
    active: boolean;
  }> = [
    {
      mrn: 'MRN000001',
      patientName: 'Siti Rahayu',
      gender: 'FEMALE',
      birthDate: '1992-03-14',
      birthPlace: 'Jakarta',
      phone: '0812-3456-7890',
      email: 'siti.rahayu@example.local',
      identityNumber: '3271014403920001',
      address: 'Jl. Kemang Selatan No. 22, Jakarta Selatan',
      active: true,
    },
    {
      mrn: 'MRN000002',
      patientName: 'Budi Santoso',
      gender: 'MALE',
      birthDate: '1988-11-02',
      birthPlace: 'Bandung',
      phone: '0813-1122-3344',
      email: 'budi.santoso@example.local',
      identityNumber: '3273020211880002',
      address: 'Jl. Fatmawati Raya No. 8, Jakarta Selatan',
      active: true,
    },
    {
      mrn: 'MRN000003',
      patientName: 'Rina Wulandari',
      gender: 'FEMALE',
      birthDate: '1995-07-27',
      birthPlace: 'Surabaya',
      phone: '0857-9988-1122',
      identityNumber: '3271026707950003',
      address: 'Jl. Radio Dalam No. 15, Jakarta Selatan',
      active: true,
    },
    {
      mrn: 'MRN000004',
      patientName: 'Ahmad Fauzi',
      gender: 'MALE',
      birthDate: '1980-01-19',
      birthPlace: 'Medan',
      phone: '0821-4455-6677',
      email: 'ahmad.fauzi@example.local',
      identityNumber: '3271011901800004',
      address: 'Jl. Cipete Raya No. 40, Jakarta Selatan',
      active: true,
    },
    {
      mrn: 'MRN000005',
      patientName: 'Nabila Putri',
      gender: 'FEMALE',
      birthDate: '2001-05-30',
      birthPlace: 'Tangerang',
      phone: '0899-2233-4456',
      identityNumber: '3671017005010005',
      address: 'Jl. BSD Raya Utama No. 3, Tangerang Selatan',
      active: true,
    },
    {
      mrn: 'MRN000006',
      patientName: 'Dewi Lestari',
      gender: 'FEMALE',
      birthDate: '2001-05-05',
      birthPlace: 'Yogyakarta',
      phone: '0899-2233-4455',
      identityNumber: '3471014505010006',
      address: 'Jl. Ampera Raya No. 12, Jakarta Selatan',
      active: false,
    },
  ];

  for (const patient of patients) {
    await prisma.patient.upsert({
      where: { medicalRecordNo: patient.mrn },
      update: {},
      create: {
        medicalRecordNo: patient.mrn,
        patientName: patient.patientName,
        identityType: 'KTP',
        identityNumber: patient.identityNumber,
        birthPlace: patient.birthPlace,
        birthDate: new Date(patient.birthDate),
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        active: patient.active,
      },
    });
  }

  return patients.length;
}

async function main() {
  const permissionCount = await seedPermissionsAndRoles();
  const userIdByUsername = await seedUsers();
  const masterDataCounts = await seedMasterData(userIdByUsername);
  const patientCount = await seedPatients();

  // eslint-disable-next-line no-console
  console.log(`Seeded ${permissionCount} permissions and roles: ${['ADMINISTRATOR', ...Object.keys(ROLE_PERMISSIONS)].join(', ')}`);
  // eslint-disable-next-line no-console
  console.log(
    `Seeded Master Data: ${masterDataCounts.clinics} clinic, ${masterDataCounts.branches} branches, ${masterDataCounts.doctors} doctors, ${masterDataCounts.doctorSchedules} doctor schedules, ${masterDataCounts.treatmentCategories} treatment categories, ${masterDataCounts.treatments} treatments, ${masterDataCounts.paymentMethods} payment methods, ${masterDataCounts.toothConditions} tooth conditions, ${masterDataCounts.consentTemplates} consent templates.`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `Seeded Warehouse Module: ${masterDataCounts.itemCategories} item categories, ${masterDataCounts.units} units, ${masterDataCounts.warehouseItems} items, ${masterDataCounts.warehouseSuppliers} supplier, ${masterDataCounts.warehouseLocations} warehouse location.`,
  );
  // eslint-disable-next-line no-console
  console.log(`Seeded ${patientCount} patients (5 active, 1 archived).`);
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
