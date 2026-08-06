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
  'finance.account-mapping.manage',
  'finance.account-mapping.read',
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
  'masterdata.referral-source.read',
  'masterdata.region.read',
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
  'report.reservation.new-patient.read',
  'report.reservation.by-status.read',
  'report.reservation.patient-type.read',
  'report.reservation.doctor.read',
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
    'masterdata.referral-source.read',
    'masterdata.region.read',
    'report.dashboard.operations.read',
    'report.catalog.read',
    'system.notification.read',
    'report.job.create',
    'report.job.cancel',
    'report.export.download',
    'report.operations.read',
    'report.billing.read',
    'report.reservation.new-patient.read',
    'report.reservation.by-status.read',
    'report.reservation.patient-type.read',
    'report.reservation.doctor.read',
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
    'finance.account-mapping.read',
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
    'finance.account-mapping.read',
    'finance.account-mapping.manage',
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

  // task-287 (Epic PE4, Patient Module Enhancement addendum):
  // docs/03-sad/11-module-master-data.md §11.25's literal 9-entry example
  // list. "Staf Klinik" is the only entry with requiresReferrer: true.
  const referralSources: Array<{ code: string; name: string; requiresReferrer: boolean }> = [
    { code: 'GOOGLE', name: 'Google', requiresReferrer: false },
    { code: 'INSTAGRAM', name: 'Instagram', requiresReferrer: false },
    { code: 'FACEBOOK', name: 'Facebook', requiresReferrer: false },
    { code: 'TIKTOK', name: 'TikTok', requiresReferrer: false },
    { code: 'FRIEND', name: 'Teman (Friend)', requiresReferrer: false },
    { code: 'WALK_IN', name: 'Datang Sendiri (Walk-in)', requiresReferrer: false },
    { code: 'ALODOKTER', name: 'Alodokter', requiresReferrer: false },
    { code: 'STAFF', name: 'Staf Klinik', requiresReferrer: true },
    { code: 'OTHER', name: 'Lain-lain (Other)', requiresReferrer: false },
  ];
  for (const source of referralSources) {
    await prisma.referralSource.upsert({
      where: { referralSourceCode: source.code },
      update: {},
      create: { referralSourceCode: source.code, referralSourceName: source.name, requiresReferrer: source.requiresReferrer },
    });
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
    referralSources: referralSources.length,
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

// ---------------------------------------------------------------------------
// Full workflow-chain sample data: Reservation -> Queue -> EMR Visit ->
// Billing -> Finance, plus Warehouse Operations, System module records, and
// Phase 4 Multi-Branch records -- so every module's screens have something
// to look at without a tester first creating it all by hand. Dev-only, same
// as the rest of this file -- not a task-specified deliverable.
//
// Written via direct Prisma writes, not through the application's
// use-cases (those require an HTTP actor/request context this script
// doesn't have -- the same reasoning already used above for Patient MRNs).
// That means fields a real use-case would compute automatically are set by
// hand here, matching each entity's actual invariant:
//   - WarehouseStock.currentStock/availableStock and StockTransaction.balance
//     are derived state in the real flow (StockRepository.applyStockMovement)
//     -- kept mutually consistent by hand.
//   - Invoice.paidAmount/status are ordinary columns CreatePaymentUseCase
//     updates alongside inserting a Payment row -- set to match here.
//   - Journal.journalNo is normally assigned only at Post time (stays null
//     while DRAFT) -- since the seeded Journal is written directly as
//     POSTED, its number is assigned up front.
//   - PurchaseOrderItem.quantityReceived / PurchaseOrder.status normally
//     update via PostGoodsReceiptUseCase -- set directly to a fully-received
//     end state here.
// Guarded with upsert (where a real unique constraint exists) or a
// find-first-then-create check (where it doesn't), so this is safe to
// re-run without `prisma migrate reset` first, mirroring the pattern
// already used above for consentTemplates.
// ---------------------------------------------------------------------------

function formatDateCompact(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function timeOfDay(hours: number, minutes: number): Date {
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

async function seedTransactionalData(userIdByUsername: Map<string, string>) {
  const clinic = await prisma.clinic.findUniqueOrThrow({ where: { clinicCode: 'PM01' } });
  const [branchKemang, branchBsd] = await Promise.all([
    prisma.branch.findUniqueOrThrow({ where: { branchCode: 'PM01-KMG' } }),
    prisma.branch.findUniqueOrThrow({ where: { branchCode: 'PM01-BSD' } }),
  ]);
  const [doctor1, doctor2] = await Promise.all([
    prisma.doctor.findUniqueOrThrow({ where: { doctorCode: 'DOC001' } }),
    prisma.doctor.findUniqueOrThrow({ where: { doctorCode: 'DOC002' } }),
  ]);
  const [siti, budi, rina, ahmad] = await Promise.all([
    prisma.patient.findUniqueOrThrow({ where: { medicalRecordNo: 'MRN000001' } }),
    prisma.patient.findUniqueOrThrow({ where: { medicalRecordNo: 'MRN000002' } }),
    prisma.patient.findUniqueOrThrow({ where: { medicalRecordNo: 'MRN000003' } }),
    prisma.patient.findUniqueOrThrow({ where: { medicalRecordNo: 'MRN000004' } }),
  ]);

  const today = new Date();
  const todayDateOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const datePart = formatDateCompact(todayDateOnly);
  const inThreeDays = new Date(todayDateOnly);
  inThreeDays.setUTCDate(inThreeDays.getUTCDate() + 3);
  const twoDaysAgo = new Date(todayDateOnly);
  twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
  const oneDayAgo = new Date(todayDateOnly);
  oneDayAgo.setUTCDate(oneDayAgo.getUTCDate() - 1);
  const twoYearsFromNow = new Date(todayDateOnly);
  twoYearsFromNow.setUTCFullYear(twoYearsFromNow.getUTCFullYear() + 2);

  // --- Reservation (BOOKED / COMPLETED / CANCELLED) ---
  const reservationCompleted = await prisma.reservation.upsert({
    where: { reservationNo: `RSV-${datePart}-9001` },
    update: {},
    create: {
      reservationNo: `RSV-${datePart}-9001`,
      patientId: budi.id,
      doctorId: doctor1.id,
      branchId: branchKemang.id,
      reservationDate: todayDateOnly,
      reservationTime: timeOfDay(9, 0),
      reservationType: 'REGULAR',
      complaint: 'Sakit gigi geraham kanan bawah',
      status: 'COMPLETED',
      source: 'PHONE',
      checkedInAt: new Date(todayDateOnly.getTime() + 8.5 * 3600 * 1000),
      // task-290 (Epic RE1): seeded as a returning patient's visit for
      // manual-testing variety across the new Patient Type badge/filter.
      patientTypeAtBooking: 'OLD',
      createdBy: userIdByUsername.get('registration1'),
    },
  });
  await prisma.reservation.upsert({
    where: { reservationNo: `RSV-${datePart}-9002` },
    update: {},
    create: {
      reservationNo: `RSV-${datePart}-9002`,
      patientId: siti.id,
      doctorId: doctor1.id,
      branchId: branchKemang.id,
      reservationDate: inThreeDays,
      reservationTime: timeOfDay(10, 30),
      reservationType: 'REGULAR',
      complaint: 'Kontrol rutin scaling',
      status: 'BOOKED',
      source: 'WHATSAPP',
      patientTypeAtBooking: 'NEW',
      createdBy: userIdByUsername.get('registration1'),
    },
  });
  await prisma.reservation.upsert({
    where: { reservationNo: `RSV-${datePart}-9003` },
    update: {},
    create: {
      reservationNo: `RSV-${datePart}-9003`,
      patientId: rina.id,
      doctorId: doctor2.id,
      branchId: branchBsd.id,
      reservationDate: twoDaysAgo,
      reservationTime: timeOfDay(14, 0),
      reservationType: 'REGULAR',
      complaint: 'Konsultasi behel',
      status: 'CANCELLED',
      source: 'WEBSITE',
      cancelledReason: 'Pasien meminta reschedule',
      cancelledAt: twoDaysAgo,
      patientTypeAtBooking: 'NEW',
      createdBy: userIdByUsername.get('registration1'),
    },
  });

  // --- Queue (COMPLETED / CALLED / WAITING) ---
  const queueCompleted = await prisma.queue.upsert({
    where: { queueNumber_queueDate_branchId: { queueNumber: 'S901', queueDate: todayDateOnly, branchId: branchKemang.id } },
    update: {},
    create: {
      reservationId: reservationCompleted.id,
      branchId: branchKemang.id,
      patientId: budi.id,
      queueNumber: 'S901',
      queuePrefix: 'S',
      queueDate: todayDateOnly,
      queueType: 'RESERVATION',
      doctorId: doctor1.id,
      room: 'Ruang 1',
      priority: 'NORMAL',
      status: 'COMPLETED',
      checkedInAt: new Date(todayDateOnly.getTime() + 8.5 * 3600 * 1000),
      calledAt: new Date(todayDateOnly.getTime() + 9 * 3600 * 1000),
      startedAt: new Date(todayDateOnly.getTime() + 9.1 * 3600 * 1000),
      completedAt: new Date(todayDateOnly.getTime() + 10 * 3600 * 1000),
    },
  });
  await prisma.queue.upsert({
    where: { queueNumber_queueDate_branchId: { queueNumber: 'S902', queueDate: todayDateOnly, branchId: branchKemang.id } },
    update: {},
    create: {
      branchId: branchKemang.id,
      patientId: ahmad.id,
      queueNumber: 'S902',
      queuePrefix: 'S',
      queueDate: todayDateOnly,
      queueType: 'WALK_IN',
      doctorId: doctor1.id,
      room: 'Ruang 1',
      priority: 'NORMAL',
      status: 'CALLED',
      checkedInAt: new Date(todayDateOnly.getTime() + 10.5 * 3600 * 1000),
      calledAt: new Date(todayDateOnly.getTime() + 11 * 3600 * 1000),
    },
  });
  await prisma.queue.upsert({
    where: { queueNumber_queueDate_branchId: { queueNumber: 'S901', queueDate: todayDateOnly, branchId: branchBsd.id } },
    update: {},
    create: {
      branchId: branchBsd.id,
      patientId: rina.id,
      queueNumber: 'S901',
      queuePrefix: 'S',
      queueDate: todayDateOnly,
      queueType: 'WALK_IN',
      doctorId: doctor2.id,
      priority: 'NORMAL',
      status: 'WAITING',
      checkedInAt: new Date(todayDateOnly.getTime() + 13 * 3600 * 1000),
    },
  });

  // --- EMR: Visit + SOAP + Odontogram + Treatment + Prescription + Consent ---
  const [treatmentComposite, treatmentExtraction] = await Promise.all([
    prisma.treatment.findUniqueOrThrow({ where: { treatmentCode: 'TRT001' } }),
    prisma.treatment.findUniqueOrThrow({ where: { treatmentCode: 'TRT003' } }),
  ]);
  const [conditionCaries, conditionFilling] = await Promise.all([
    prisma.toothCondition.findUniqueOrThrow({ where: { conditionCode: 'INITIAL_CARIES' } }),
    prisma.toothCondition.findUniqueOrThrow({ where: { conditionCode: 'COMPOSITE_FILLING' } }),
  ]);
  const consentTemplate = await prisma.consentTemplate.findFirstOrThrow({ where: { title: 'Dental Treatment Consent' } });

  const visit = await prisma.visit.upsert({
    where: { visitNo: 'VIS900001' },
    update: {},
    create: {
      visitNo: 'VIS900001',
      reservationId: reservationCompleted.id,
      patientId: budi.id,
      doctorId: doctor1.id,
      branchId: branchKemang.id,
      queueId: queueCompleted.id,
      visitDate: new Date(todayDateOnly.getTime() + 9 * 3600 * 1000),
      chiefComplaint: 'Sakit gigi geraham kanan bawah sejak 3 hari lalu',
      status: 'COMPLETED',
      startedAt: new Date(todayDateOnly.getTime() + 9.1 * 3600 * 1000),
      finishedAt: new Date(todayDateOnly.getTime() + 10 * 3600 * 1000),
      createdBy: userIdByUsername.get('doctor1'),
    },
  });

  await prisma.soapNote.upsert({
    where: { visitId: visit.id },
    update: {},
    create: {
      visitId: visit.id,
      subjective: 'Pasien mengeluh sakit gigi geraham kanan bawah, nyeri saat mengunyah, sejak 3 hari lalu.',
      objective: 'Karies dalam pada gigi 46, tes perkusi positif, tidak ada pembengkakan.',
      assessment: 'Karies dentin dalam gigi 46 dengan pulpitis reversibel.',
      plan: 'Tumpatan komposit gigi 46, kontrol 1 minggu bila masih nyeri.',
      updatedBy: userIdByUsername.get('doctor1'),
    },
  });

  const odontogramSeeds: Array<{ toothConditionId: string; note: string }> = [
    { toothConditionId: conditionCaries.id, note: 'Kondisi sebelum perawatan' },
    { toothConditionId: conditionFilling.id, note: 'Kondisi setelah tumpatan komposit' },
  ];
  for (const entry of odontogramSeeds) {
    const existing = await prisma.odontogramEntry.findFirst({
      where: { visitId: visit.id, toothNumber: 46, toothConditionId: entry.toothConditionId },
    });
    if (!existing) {
      await prisma.odontogramEntry.create({
        data: {
          visitId: visit.id,
          patientId: budi.id,
          toothNumber: 46,
          surface: 'O',
          toothConditionId: entry.toothConditionId,
          note: entry.note,
          createdBy: userIdByUsername.get('doctor1'),
        },
      });
    }
  }

  const existingTreatments = await prisma.visitTreatment.findMany({ where: { visitId: visit.id } });
  let treatmentLine1 = existingTreatments.find((t) => t.treatmentId === treatmentComposite.id);
  if (!treatmentLine1) {
    treatmentLine1 = await prisma.visitTreatment.create({
      data: {
        visitId: visit.id,
        treatmentId: treatmentComposite.id,
        toothReference: '46',
        quantity: 1,
        unitPrice: treatmentComposite.defaultPrice,
        subtotal: treatmentComposite.defaultPrice,
        createdBy: userIdByUsername.get('doctor1'),
      },
    });
  }
  let treatmentLine2 = existingTreatments.find((t) => t.treatmentId === treatmentExtraction.id);
  if (!treatmentLine2) {
    treatmentLine2 = await prisma.visitTreatment.create({
      data: {
        visitId: visit.id,
        treatmentId: treatmentExtraction.id,
        toothReference: '18',
        quantity: 1,
        unitPrice: treatmentExtraction.defaultPrice,
        subtotal: treatmentExtraction.defaultPrice,
        notes: 'Cabut gigi bungsu yang sudah goyang',
        createdBy: userIdByUsername.get('doctor1'),
      },
    });
  }

  const existingPrescription = await prisma.prescription.findFirst({ where: { visitId: visit.id } });
  const prescription =
    existingPrescription ??
    (await prisma.prescription.create({
      data: { visitId: visit.id, patientId: budi.id, doctorId: doctor1.id, createdBy: userIdByUsername.get('doctor1') },
    }));
  if (!existingPrescription) {
    await prisma.prescriptionItem.createMany({
      data: [
        {
          prescriptionId: prescription.id,
          medicineName: 'Amoxicillin 500mg',
          dosage: '500mg',
          frequency: '3x sehari',
          duration: '5 hari',
          instruction: 'Diminum setelah makan',
        },
        {
          prescriptionId: prescription.id,
          medicineName: 'Asam Mefenamat 500mg',
          dosage: '500mg',
          frequency: '3x sehari',
          duration: '3 hari',
          instruction: 'Diminum bila nyeri',
        },
      ],
    });
  }

  const existingConsent = await prisma.consent.findFirst({ where: { visitId: visit.id, templateId: consentTemplate.id } });
  if (!existingConsent) {
    await prisma.consent.create({
      data: {
        templateId: consentTemplate.id,
        patientId: budi.id,
        visitId: visit.id,
        doctorId: doctor1.id,
        procedure: 'Tumpatan Komposit Gigi 46',
        signedAt: new Date(todayDateOnly.getTime() + 9.05 * 3600 * 1000),
        signerName: 'Budi Santoso',
        signerRelationship: 'SELF',
        createdBy: userIdByUsername.get('doctor1'),
      },
    });
  }

  // --- Billing: Invoice + InvoiceItem + Payment (PAID, matching the two
  // VisitTreatment lines above per GenerateInvoiceUseCase's own math) ---
  const grandTotal = Number(treatmentLine1.subtotal) + Number(treatmentLine2.subtotal);
  const invoice = await prisma.invoice.upsert({
    where: { visitId: visit.id },
    update: {},
    create: {
      invoiceNo: `INV-${datePart}-900001`,
      visitId: visit.id,
      patientId: budi.id,
      branchId: branchKemang.id,
      subtotal: grandTotal,
      discount: 0,
      tax: 0,
      grandTotal,
      paidAmount: grandTotal,
      status: 'PAID',
      createdBy: userIdByUsername.get('cashier1'),
    },
  });

  const existingInvoiceItemCount = await prisma.invoiceItem.count({ where: { invoiceId: invoice.id } });
  if (existingInvoiceItemCount === 0) {
    await prisma.invoiceItem.createMany({
      data: [
        {
          invoiceId: invoice.id,
          referenceType: 'Treatment',
          referenceId: treatmentComposite.id,
          itemName: treatmentComposite.treatmentName,
          quantity: 1,
          unitPrice: treatmentComposite.defaultPrice,
          total: treatmentComposite.defaultPrice,
        },
        {
          invoiceId: invoice.id,
          referenceType: 'Treatment',
          referenceId: treatmentExtraction.id,
          itemName: treatmentExtraction.treatmentName,
          quantity: 1,
          unitPrice: treatmentExtraction.defaultPrice,
          total: treatmentExtraction.defaultPrice,
        },
      ],
    });
  }

  const cashMethod = await prisma.paymentMethod.findUniqueOrThrow({ where: { methodCode: 'CASH' } });
  const existingPayment = await prisma.payment.findFirst({ where: { invoiceId: invoice.id } });
  if (!existingPayment) {
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        paymentMethodId: cashMethod.id,
        amount: grandTotal,
        receivedBy: userIdByUsername.get('cashier1'),
        note: 'Pembayaran lunas tunai',
        createdBy: userIdByUsername.get('cashier1'),
      },
    });
  }

  // --- Finance: Chart of Accounts + Financial Period + Cash Account +
  // a POSTED Journal balancing Cash (debit) against Revenue (credit) for
  // the invoice above ---
  const [cashLedgerAccount, , revenueAccount] = await Promise.all([
    prisma.account.upsert({
      where: { branchId_code: { branchId: branchKemang.id, code: '1101' } },
      update: {},
      create: { branchId: branchKemang.id, code: '1101', name: 'Kas Klinik Kemang', accountType: 'ASSET', normalBalance: 'DEBIT', createdBy: userIdByUsername.get('finance_manager1') },
    }),
    prisma.account.upsert({
      where: { branchId_code: { branchId: branchKemang.id, code: '1102' } },
      update: {},
      create: { branchId: branchKemang.id, code: '1102', name: 'Piutang Pasien', accountType: 'ASSET', normalBalance: 'DEBIT', createdBy: userIdByUsername.get('finance_manager1') },
    }),
    prisma.account.upsert({
      where: { branchId_code: { branchId: branchKemang.id, code: '4101' } },
      update: {},
      create: { branchId: branchKemang.id, code: '4101', name: 'Pendapatan Tindakan', accountType: 'REVENUE', normalBalance: 'CREDIT', createdBy: userIdByUsername.get('finance_manager1') },
    }),
    prisma.account.upsert({
      where: { branchId_code: { branchId: branchKemang.id, code: '5101' } },
      update: {},
      create: { branchId: branchKemang.id, code: '5101', name: 'Beban Operasional', accountType: 'EXPENSE', normalBalance: 'DEBIT', createdBy: userIdByUsername.get('finance_manager1') },
    }),
  ]);

  const periodStart = new Date(Date.UTC(todayDateOnly.getUTCFullYear(), todayDateOnly.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(todayDateOnly.getUTCFullYear(), todayDateOnly.getUTCMonth() + 1, 0));
  const existingPeriod = await prisma.financialPeriod.findFirst({ where: { branchId: branchKemang.id, startDate: periodStart, endDate: periodEnd } });
  if (!existingPeriod) {
    await prisma.financialPeriod.create({
      data: {
        branchId: branchKemang.id,
        periodName: `Periode ${todayDateOnly.getUTCMonth() + 1}/${todayDateOnly.getUTCFullYear()}`,
        startDate: periodStart,
        endDate: periodEnd,
        status: 'OPEN',
        createdBy: userIdByUsername.get('finance_manager1'),
      },
    });
  }

  await prisma.cashAccount.upsert({
    where: { branchId_code: { branchId: branchKemang.id, code: 'CASH-KMG' } },
    update: {},
    create: {
      branchId: branchKemang.id,
      code: 'CASH-KMG',
      name: 'Kas Tunai Klinik Kemang',
      accountType: 'CASH',
      ledgerAccountId: cashLedgerAccount.id,
      currentBalance: grandTotal,
      createdBy: userIdByUsername.get('finance_manager1'),
    },
  });

  const journal = await prisma.journal.upsert({
    where: { idempotency_key: { referenceType: 'INVOICE', referenceId: invoice.id, postingType: 'BILLING_REVENUE' } },
    update: {},
    create: {
      journalNo: `JRN-${datePart}-9001`,
      branchId: branchKemang.id,
      journalDate: todayDateOnly,
      referenceType: 'INVOICE',
      referenceId: invoice.id,
      postingType: 'BILLING_REVENUE',
      description: `Pencatatan pendapatan tindakan - Invoice ${invoice.invoiceNo}`,
      status: 'POSTED',
      postedAt: new Date(),
      postedBy: userIdByUsername.get('finance_manager1'),
      createdBy: userIdByUsername.get('finance_staff1'),
    },
  });
  const existingJournalLineCount = await prisma.journalLine.count({ where: { journalId: journal.id } });
  if (existingJournalLineCount === 0) {
    await prisma.journalLine.createMany({
      data: [
        { journalId: journal.id, accountId: cashLedgerAccount.id, debit: grandTotal, credit: 0, description: `Penerimaan kas - ${invoice.invoiceNo}` },
        { journalId: journal.id, accountId: revenueAccount.id, debit: 0, credit: grandTotal, description: 'Pendapatan tindakan gigi' },
      ],
    });
  }

  // --- Warehouse Operations: Purchase Order -> posted Goods Receipt ->
  // Stock Transaction -> Warehouse Stock (+ Item Batch for the
  // batch-tracked item), mirroring PostGoodsReceiptUseCase's bookkeeping ---
  const supplier = await prisma.supplier.findUniqueOrThrow({ where: { supplierCode: 'SUP-001' } });
  const warehouseKemang = await prisma.warehouseLocation.findUniqueOrThrow({
    where: { branchId_locationCode: { branchId: branchKemang.id, locationCode: 'WH-KMG-01' } },
  });
  const [itemComposite, itemGloves] = await Promise.all([
    prisma.item.findUniqueOrThrow({ where: { itemCode: 'MAT-COMP-001' } }),
    prisma.item.findUniqueOrThrow({ where: { itemCode: 'CONS-GLOVE-001' } }),
  ]);

  const purchaseOrder = await prisma.purchaseOrder.upsert({
    where: { purchaseOrderNumber: `PO-${datePart}-9001` },
    update: {},
    create: {
      purchaseOrderNumber: `PO-${datePart}-9001`,
      supplierId: supplier.id,
      branchId: branchKemang.id,
      warehouseId: warehouseKemang.id,
      orderDate: oneDayAgo,
      expectedDate: oneDayAgo,
      status: 'RECEIVED',
      totalAmount: 50 * 25000 + 20 * 45000,
      approvedBy: userIdByUsername.get('warehouse_manager1'),
      approvedAt: oneDayAgo,
      createdBy: userIdByUsername.get('warehouse_staff1'),
    },
  });

  const existingPoItems = await prisma.purchaseOrderItem.findMany({ where: { purchaseOrderId: purchaseOrder.id } });
  let poItemComposite = existingPoItems.find((i) => i.itemId === itemComposite.id);
  if (!poItemComposite) {
    poItemComposite = await prisma.purchaseOrderItem.create({
      data: { purchaseOrderId: purchaseOrder.id, itemId: itemComposite.id, quantityOrdered: 50, unitPrice: 25000, subtotal: 50 * 25000, quantityReceived: 50 },
    });
  }
  let poItemGloves = existingPoItems.find((i) => i.itemId === itemGloves.id);
  if (!poItemGloves) {
    poItemGloves = await prisma.purchaseOrderItem.create({
      data: { purchaseOrderId: purchaseOrder.id, itemId: itemGloves.id, quantityOrdered: 20, unitPrice: 45000, subtotal: 20 * 45000, quantityReceived: 20 },
    });
  }

  const goodsReceipt = await prisma.goodsReceipt.upsert({
    where: { goodsReceiptNumber: `GR-${datePart}-9001` },
    update: {},
    create: {
      goodsReceiptNumber: `GR-${datePart}-9001`,
      purchaseOrderId: purchaseOrder.id,
      warehouseId: warehouseKemang.id,
      receiptDate: oneDayAgo,
      supplierDocumentNo: 'SJ-2026-0001',
      status: 'POSTED',
      postedBy: userIdByUsername.get('warehouse_staff1'),
      postedAt: oneDayAgo,
      createdBy: userIdByUsername.get('warehouse_staff1'),
    },
  });
  const existingGrItemCount = await prisma.goodsReceiptItem.count({ where: { goodsReceiptId: goodsReceipt.id } });
  if (existingGrItemCount === 0) {
    await prisma.goodsReceiptItem.createMany({
      data: [
        { goodsReceiptId: goodsReceipt.id, purchaseOrderItemId: poItemComposite.id, itemId: itemComposite.id, quantity: 50, unitCost: 25000, batchNumber: 'BATCH-COMP-0001', expiryDate: twoYearsFromNow },
        { goodsReceiptId: goodsReceipt.id, purchaseOrderItemId: poItemGloves.id, itemId: itemGloves.id, quantity: 20, unitCost: 45000 },
      ],
    });
  }

  const batch = await prisma.itemBatch.upsert({
    where: { warehouseId_itemId_batchNumber: { warehouseId: warehouseKemang.id, itemId: itemComposite.id, batchNumber: 'BATCH-COMP-0001' } },
    update: {},
    create: {
      warehouseId: warehouseKemang.id,
      itemId: itemComposite.id,
      batchNumber: 'BATCH-COMP-0001',
      receivedDate: oneDayAgo,
      expiryDate: twoYearsFromNow,
      initialQuantity: 50,
      remainingQuantity: 50,
      status: 'ACTIVE',
      createdBy: userIdByUsername.get('warehouse_staff1'),
    },
  });

  await prisma.stockTransaction.upsert({
    where: { transactionNumber: `STK-${datePart}-9001` },
    update: {},
    create: {
      transactionNumber: `STK-${datePart}-9001`,
      warehouseId: warehouseKemang.id,
      itemId: itemComposite.id,
      batchId: batch.id,
      transactionType: 'PURCHASE',
      referenceType: 'GOODS_RECEIPT',
      referenceId: goodsReceipt.id,
      qtyIn: 50,
      qtyOut: 0,
      balance: 50,
      transactionDate: oneDayAgo,
      performedBy: userIdByUsername.get('warehouse_staff1')!,
    },
  });
  await prisma.stockTransaction.upsert({
    where: { transactionNumber: `STK-${datePart}-9002` },
    update: {},
    create: {
      transactionNumber: `STK-${datePart}-9002`,
      warehouseId: warehouseKemang.id,
      itemId: itemGloves.id,
      transactionType: 'PURCHASE',
      referenceType: 'GOODS_RECEIPT',
      referenceId: goodsReceipt.id,
      qtyIn: 20,
      qtyOut: 0,
      balance: 20,
      transactionDate: oneDayAgo,
      performedBy: userIdByUsername.get('warehouse_staff1')!,
    },
  });

  await prisma.warehouseStock.upsert({
    where: { warehouseId_itemId: { warehouseId: warehouseKemang.id, itemId: itemComposite.id } },
    update: {},
    create: {
      warehouseId: warehouseKemang.id,
      itemId: itemComposite.id,
      currentStock: 50,
      reservedStock: 0,
      availableStock: 50,
      minimumStock: itemComposite.minimumStock,
      version: 1,
      lastTransactionAt: oneDayAgo,
    },
  });
  await prisma.warehouseStock.upsert({
    where: { warehouseId_itemId: { warehouseId: warehouseKemang.id, itemId: itemGloves.id } },
    update: {},
    create: {
      warehouseId: warehouseKemang.id,
      itemId: itemGloves.id,
      currentStock: 20,
      reservedStock: 0,
      availableStock: 20,
      minimumStock: itemGloves.minimumStock,
      version: 1,
      lastTransactionAt: oneDayAgo,
    },
  });

  // --- System module: Notification Template + Notification + Feature Flag
  // + System Parameters (one branch-scoped, one global) ---
  const notificationTemplate = await prisma.notificationTemplate.upsert({
    where: { templateKey_version: { templateKey: 'queue.called', version: 1 } },
    update: {},
    create: {
      templateKey: 'queue.called',
      channel: 'IN_APP',
      locale: 'id-ID',
      body: 'Nomor antrian {{queueNumber}} Anda telah dipanggil ke {{room}}.',
      variableSchema: { queueNumber: 'string', room: 'string' },
      classification: 'internal',
      version: 1,
      isActive: true,
      createdBy: userIdByUsername.get('admin'),
    },
  });
  await prisma.notification.upsert({
    where: { idempotencyKey: 'seed-notification-0001' },
    update: {},
    create: {
      recipientUserId: userIdByUsername.get('registration1')!,
      templateId: notificationTemplate.id,
      channel: 'IN_APP',
      message: 'Nomor antrian S902 Anda telah dipanggil ke Ruang 1.',
      status: 'SENT',
      idempotencyKey: 'seed-notification-0001',
      attempts: 1,
      sentAt: new Date(),
    },
  });

  await prisma.featureFlag.upsert({
    where: { flagKey: 'reports.branch-comparison' },
    update: {},
    create: {
      flagKey: 'reports.branch-comparison',
      ownerModule: 'reports',
      enabled: true,
      riskClass: 'standard',
      effectiveFrom: new Date(),
      description: 'Enable multi-branch comparison reporting (Phase 4).',
      createdBy: userIdByUsername.get('admin'),
    },
  });

  await prisma.systemParameter.upsert({
    where: { key_scopeType_scopeId_version: { key: 'queue.max.length', scopeType: 'BRANCH', scopeId: branchKemang.id, version: 1 } },
    update: {},
    create: {
      key: 'queue.max.length',
      scopeType: 'BRANCH',
      scopeId: branchKemang.id,
      valueType: 'INTEGER',
      value: '50',
      version: 1,
      changeReason: 'Seed default branch queue capacity.',
      createdBy: userIdByUsername.get('admin'),
    },
  });
  // Prisma's compound-unique WhereUniqueInput can't take `null` for the
  // nullable `scopeId` member (MySQL doesn't support NULL in a composite
  // unique lookup the same way) -- find-first-then-create instead, same
  // pattern already used above for FinancialPeriod.
  const existingGlobalParam = await prisma.systemParameter.findFirst({
    where: { key: 'reservation.slot.minutes', scopeType: 'GLOBAL', scopeId: null, version: 1 },
  });
  if (!existingGlobalParam) {
    await prisma.systemParameter.create({
      data: {
        key: 'reservation.slot.minutes',
        scopeType: 'GLOBAL',
        valueType: 'INTEGER',
        value: '30',
        version: 1,
        changeReason: 'Seed default reservation slot duration.',
        createdBy: userIdByUsername.get('admin'),
      },
    });
  }

  // --- Phase 4: Branch Assignment (cashier1 works both branches, default
  // Kemang) + a Master Data Template pushed in-sync to Kemang and drifted
  // at BSD (to exercise the Drift Report) ---
  const cashier1Id = userIdByUsername.get('cashier1')!;
  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId: cashier1Id, branchId: branchKemang.id } },
    update: {},
    create: { userId: cashier1Id, branchId: branchKemang.id, isDefault: true, effectiveFrom: new Date(), createdBy: userIdByUsername.get('admin') },
  });
  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId: cashier1Id, branchId: branchBsd.id } },
    update: {},
    create: { userId: cashier1Id, branchId: branchBsd.id, isDefault: false, effectiveFrom: new Date(), createdBy: userIdByUsername.get('admin') },
  });

  const templatePayloadV2 = { treatmentCode: 'TRT-TEMPLATE-01', treatmentName: 'Scaling Standar', durationMinute: 30, defaultPrice: 200000, doctorFee: 60000 };
  const templatePayloadV1 = { treatmentCode: 'TRT-TEMPLATE-01', treatmentName: 'Scaling Standar', durationMinute: 30, defaultPrice: 180000, doctorFee: 60000 };
  const driftedPayload = { treatmentCode: 'TRT-TEMPLATE-01', treatmentName: 'Scaling Standar (BSD custom)', durationMinute: 30, defaultPrice: 190000, doctorFee: 60000 };

  let masterDataTemplate = await prisma.masterDataTemplate.findFirst({ where: { entityType: 'TREATMENT', ownerClinicId: clinic.id } });
  if (!masterDataTemplate) {
    masterDataTemplate = await prisma.masterDataTemplate.create({
      data: { entityType: 'TREATMENT', templatePayload: templatePayloadV2, version: 2, ownerClinicId: clinic.id, createdBy: userIdByUsername.get('admin') },
    });
  }
  await prisma.masterDataTemplateBranchLink.upsert({
    where: { templateId_branchId: { templateId: masterDataTemplate.id, branchId: branchKemang.id } },
    update: {},
    create: { templateId: masterDataTemplate.id, branchId: branchKemang.id, pushedVersion: 2, snapshotPayload: templatePayloadV2, currentPayload: templatePayloadV2 },
  });
  await prisma.masterDataTemplateBranchLink.upsert({
    where: { templateId_branchId: { templateId: masterDataTemplate.id, branchId: branchBsd.id } },
    update: {},
    create: { templateId: masterDataTemplate.id, branchId: branchBsd.id, pushedVersion: 1, snapshotPayload: templatePayloadV1, currentPayload: driftedPayload },
  });

  return {
    reservations: 3,
    queueEntries: 3,
    visits: 1,
    invoices: 1,
    financeAccounts: 4,
    journals: 1,
    purchaseOrders: 1,
    goodsReceipts: 1,
    notifications: 1,
    featureFlags: 1,
    systemParameters: 2,
    branchAssignments: 2,
    masterDataTemplates: 1,
  };
}

// ---------------------------------------------------------------------------
// System Module: Menus (docs/06-tasks/task-206.md, Epic AK). No Phase 1
// task builds Menu CRUD (apps/frontend/config/navigation.ts's own header
// comment documents this gap: navigation is static/client-side until this
// aggregate exists) -- this tree is copied verbatim from that file's
// NAV_ITEMS (the one place the intended IA is actually documented), not
// invented, so it's an honest mirror of what the frontend already renders.
// Each node links to the matching seeded Permission via MenuPermission,
// same key used for that route's `permission` field in navigation.ts.
// ---------------------------------------------------------------------------

interface MenuSeedNode {
  key: string;
  label: string;
  route: string;
  permissionKey: string;
  children?: MenuSeedNode[];
}

const MENU_TREE: MenuSeedNode[] = [
  { key: 'dashboard', label: 'Dashboard', route: '/dashboard', permissionKey: 'report.dashboard.operations.read' },
  { key: 'patients', label: 'Patients', route: '/patients', permissionKey: 'patient.read' },
  {
    key: 'reservations',
    label: 'Reservations',
    route: '/reservations',
    permissionKey: 'reservation.read',
    children: [
      { key: 'reservations.list', label: 'List', route: '/reservations', permissionKey: 'reservation.read' },
      { key: 'reservations.analytics', label: 'Analytics', route: '/reservations/analytics', permissionKey: 'reservation.analytics.read' },
    ],
  },
  { key: 'queue', label: 'Queue', route: '/queue', permissionKey: 'queue.read' },
  { key: 'billing', label: 'Billing', route: '/billing', permissionKey: 'billing.invoice.read' },
  {
    key: 'dashboards',
    label: 'Dashboards',
    route: '/reports/dashboards/executive',
    permissionKey: 'report.dashboard.executive.read',
    children: [
      { key: 'dashboards.executive', label: 'Executive', route: '/reports/dashboards/executive', permissionKey: 'report.dashboard.executive.read' },
      { key: 'dashboards.operations', label: 'Operations', route: '/reports/dashboards/operations', permissionKey: 'report.dashboard.operations.read' },
      { key: 'dashboards.clinical', label: 'Clinical', route: '/reports/dashboards/clinical', permissionKey: 'report.dashboard.clinical.read' },
      { key: 'dashboards.finance', label: 'Finance', route: '/reports/dashboards/finance', permissionKey: 'report.dashboard.finance.read' },
      { key: 'dashboards.warehouse', label: 'Warehouse', route: '/reports/dashboards/warehouse', permissionKey: 'report.dashboard.warehouse.read' },
      { key: 'dashboards.branch', label: 'Branch', route: '/reports/dashboards/branch', permissionKey: 'report.dashboard.branch.read' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    route: '/reports/catalog',
    permissionKey: 'report.catalog.read',
    children: [
      { key: 'reports.catalog', label: 'Catalog', route: '/reports/catalog', permissionKey: 'report.catalog.read' },
      { key: 'reports.branch-comparison', label: 'Branch Comparison', route: '/reports/branch-comparison', permissionKey: 'report.branch-comparison.read' },
      { key: 'reports.branch-performance', label: 'Branch Performance', route: '/reports/branch-performance', permissionKey: 'report.branch-performance.read' },
    ],
  },
  {
    key: 'master-data',
    label: 'Master Data',
    route: '/master-data/clinics',
    permissionKey: 'masterdata.clinic.read',
    children: [
      { key: 'master-data.clinics', label: 'Clinics', route: '/master-data/clinics', permissionKey: 'masterdata.clinic.read' },
      { key: 'master-data.branches', label: 'Branches', route: '/master-data/branches', permissionKey: 'masterdata.branch.read' },
      { key: 'master-data.doctors', label: 'Doctors', route: '/master-data/doctors', permissionKey: 'masterdata.doctor.read' },
      { key: 'master-data.treatment-categories', label: 'Treatment Categories', route: '/master-data/treatment-categories', permissionKey: 'masterdata.treatment-category.read' },
      { key: 'master-data.treatments', label: 'Treatments', route: '/master-data/treatments', permissionKey: 'masterdata.treatment.read' },
      { key: 'master-data.payment-methods', label: 'Payment Methods', route: '/master-data/payment-methods', permissionKey: 'masterdata.payment-method.read' },
      { key: 'master-data.tooth-conditions', label: 'Tooth Conditions', route: '/master-data/tooth-conditions', permissionKey: 'masterdata.tooth-condition.read' },
      { key: 'master-data.consent-templates', label: 'Consent Templates', route: '/master-data/consent-templates', permissionKey: 'emr.consent-template.read' },
      { key: 'master-data.templates', label: 'Templates', route: '/master-data/templates', permissionKey: 'masterdata.template.read' },
    ],
  },
  {
    key: 'warehouse',
    label: 'Warehouse',
    route: '/warehouse/stocks',
    permissionKey: 'warehouse.stock.read',
    children: [
      { key: 'warehouse.items', label: 'Items', route: '/warehouse/items', permissionKey: 'warehouse.item.read' },
      { key: 'warehouse.suppliers', label: 'Suppliers', route: '/warehouse/suppliers', permissionKey: 'warehouse.supplier.read' },
      { key: 'warehouse.locations', label: 'Locations', route: '/warehouse/locations', permissionKey: 'warehouse.location.read' },
      { key: 'warehouse.stock', label: 'Stock', route: '/warehouse/stocks', permissionKey: 'warehouse.stock.read' },
      { key: 'warehouse.purchase-orders', label: 'Purchase Orders', route: '/warehouse/purchase-orders', permissionKey: 'warehouse.purchase.read' },
      { key: 'warehouse.transfers', label: 'Stock Transfer', route: '/warehouse/transfers', permissionKey: 'warehouse.stock.transfer' },
      { key: 'warehouse.adjustments', label: 'Stock Adjustment', route: '/warehouse/adjustments', permissionKey: 'warehouse.stock.adjust' },
      { key: 'warehouse.stock-opnames', label: 'Stock Opname', route: '/warehouse/stock-opnames', permissionKey: 'warehouse.opname.read' },
      { key: 'warehouse.batches', label: 'Batches', route: '/warehouse/batches', permissionKey: 'warehouse.batch.read' },
      { key: 'warehouse.reports', label: 'Reports', route: '/warehouse/reports', permissionKey: 'warehouse.report.read' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    route: '/finance/journals',
    permissionKey: 'finance.journal.read',
    children: [
      { key: 'finance.accounts', label: 'Chart of Accounts', route: '/finance/accounts', permissionKey: 'finance.account.read' },
      { key: 'finance.journals', label: 'Journal', route: '/finance/journals', permissionKey: 'finance.journal.read' },
      { key: 'finance.periods', label: 'Financial Period', route: '/finance/periods', permissionKey: 'finance.period.read' },
      { key: 'finance.cash-accounts', label: 'Cash & Bank Accounts', route: '/finance/cash-accounts', permissionKey: 'finance.cash.read' },
      { key: 'finance.cash-movements', label: 'Cash Movements', route: '/finance/cash-movements', permissionKey: 'finance.cash.read' },
      { key: 'finance.cash-transfers', label: 'Cash Transfer', route: '/finance/cash-transfers', permissionKey: 'finance.cash.transfer' },
      { key: 'finance.daily-closings', label: 'Daily Cash Closing', route: '/finance/daily-closings', permissionKey: 'finance.cash.read' },
      { key: 'finance.expenses', label: 'Expenses', route: '/finance/expenses', permissionKey: 'finance.expense.read' },
      { key: 'finance.doctor-fee-settlements', label: 'Doctor Fee Settlement', route: '/finance/doctor-fee-settlements', permissionKey: 'finance.settlement.generate' },
      { key: 'finance.account-mappings', label: 'Account Mappings', route: '/finance/account-mappings', permissionKey: 'finance.account-mapping.read' },
      { key: 'finance.reports', label: 'Reports', route: '/finance/reports', permissionKey: 'finance.report.read' },
    ],
  },
  {
    key: 'system',
    label: 'System',
    route: '/system/users',
    permissionKey: 'system.user.read',
    children: [
      { key: 'system.users', label: 'Users', route: '/system/users', permissionKey: 'system.user.read' },
      { key: 'system.roles', label: 'Roles', route: '/system/roles', permissionKey: 'system.role.read' },
      { key: 'system.roles.branch-matrix', label: 'Role-Branch Matrix', route: '/system/roles/branch-matrix', permissionKey: 'system.role.read' },
      { key: 'system.audit-logs', label: 'Audit Log', route: '/system/audit-logs', permissionKey: 'system.audit.read' },
      { key: 'system.activity-logs', label: 'Activity Log', route: '/system/activity-logs', permissionKey: 'system.activity.read' },
      { key: 'system.operations-health', label: 'Operations Health', route: '/system/operations-health', permissionKey: 'system.health.read' },
      { key: 'system.notifications', label: 'Notifications', route: '/system/notifications', permissionKey: 'system.notification.read' },
      { key: 'system.notification-templates', label: 'Notification Templates', route: '/system/notification-templates', permissionKey: 'system.notification-template.read' },
      { key: 'system.parameters', label: 'System Parameters', route: '/system/parameters', permissionKey: 'system.parameter.read' },
      { key: 'system.feature-flags', label: 'Feature Flags', route: '/system/feature-flags', permissionKey: 'system.feature-flag.read' },
      { key: 'system.menus', label: 'Menus', route: '/system/menus', permissionKey: 'system.menu.read' },
      { key: 'system.jobs', label: 'Background Jobs', route: '/system/jobs', permissionKey: 'system.job.read' },
    ],
  },
];

async function seedMenus(userIdByUsername: Map<string, string>) {
  const permissions = await prisma.permission.findMany();
  const permissionIdByKey = new Map(permissions.map((p) => [p.permissionKey, p.id]));

  let menuCount = 0;

  async function seedNode(node: MenuSeedNode, parentId: string | null, order: number) {
    const menu = await prisma.menu.upsert({
      where: { menuKey: node.key },
      update: {},
      create: {
        menuKey: node.key,
        label: node.label,
        route: node.route,
        parentId,
        order,
        isActive: true,
        createdBy: userIdByUsername.get('admin'),
      },
    });
    menuCount += 1;

    const permissionId = permissionIdByKey.get(node.permissionKey);
    if (permissionId) {
      const existingLink = await prisma.menuPermission.findFirst({ where: { menuId: menu.id, permissionId } });
      if (!existingLink) {
        await prisma.menuPermission.create({ data: { menuId: menu.id, permissionId } });
      }
    }

    if (node.children) {
      for (let i = 0; i < node.children.length; i += 1) {
        await seedNode(node.children[i], menu.id, i + 1);
      }
    }
  }

  for (let i = 0; i < MENU_TREE.length; i += 1) {
    await seedNode(MENU_TREE[i], null, i + 1);
  }

  return { menus: menuCount };
}

// ---------------------------------------------------------------------------
// Regional Address Master Data (task-285, Epic PE2, Patient Module
// Enhancement addendum).
//
// NOT the full Indonesian administrative catalog. task-285's own Backend
// Scope explicitly flags that a real seed source (Kemendagri/BPS, ~34
// provinces / ~514 regencies / ~7,200 districts / ~83,900 villages) was
// never specified in that documentation pass and must be sourced before
// writing the seed script -- rather than fabricate that volume of
// administrative codes/postal codes I cannot verify, this seeds a small,
// well-known real subset (Jakarta Selatan and Tangerang Selatan -- the two
// cities apps/frontend's seeded Branches actually sit in) so
// task-286/Patient Address's cascading selects have real data to
// demonstrate end-to-end. Village level is seeded for only one district
// (Kebayoran Baru) for the same reason -- confidently sourcing every
// kelurahan under all 17 districts here without a verified dataset would
// risk asserting inaccurate reference data into a healthcare system.
// Replace with a real Kemendagri/BPS import before this is relied on
// beyond local/dev testing.
// ---------------------------------------------------------------------------
async function seedRegions() {
  const provinceDkiJakarta = await prisma.province.upsert({
    where: { provinceCode: '31' },
    update: {},
    create: { provinceCode: '31', provinceName: 'DKI Jakarta' },
  });
  const provinceBanten = await prisma.province.upsert({
    where: { provinceCode: '36' },
    update: {},
    create: { provinceCode: '36', provinceName: 'Banten' },
  });

  const regencyJakartaSelatan = await prisma.regency.upsert({
    where: { regencyCode: '3171' },
    update: {},
    create: { regencyCode: '3171', regencyName: 'Kota Jakarta Selatan', provinceId: provinceDkiJakarta.id },
  });
  const regencyTangerangSelatan = await prisma.regency.upsert({
    where: { regencyCode: '3674' },
    update: {},
    create: { regencyCode: '3674', regencyName: 'Kota Tangerang Selatan', provinceId: provinceBanten.id },
  });

  const jakartaSelatanDistricts: Array<{ code: string; name: string }> = [
    { code: '317101', name: 'Jagakarsa' },
    { code: '317102', name: 'Pasar Minggu' },
    { code: '317103', name: 'Cilandak' },
    { code: '317104', name: 'Pesanggrahan' },
    { code: '317105', name: 'Kebayoran Lama' },
    { code: '317106', name: 'Kebayoran Baru' },
    { code: '317107', name: 'Mampang Prapatan' },
    { code: '317108', name: 'Pancoran' },
    { code: '317109', name: 'Tebet' },
    { code: '317110', name: 'Setiabudi' },
  ];
  const districtIdByCode = new Map<string, string>();
  for (const district of jakartaSelatanDistricts) {
    const row = await prisma.district.upsert({
      where: { districtCode: district.code },
      update: {},
      create: { districtCode: district.code, districtName: district.name, regencyId: regencyJakartaSelatan.id },
    });
    districtIdByCode.set(district.code, row.id);
  }

  const tangerangSelatanDistricts: Array<{ code: string; name: string }> = [
    { code: '367401', name: 'Serpong' },
    { code: '367402', name: 'Serpong Utara' },
    { code: '367403', name: 'Ciputat' },
    { code: '367404', name: 'Ciputat Timur' },
    { code: '367405', name: 'Pondok Aren' },
    { code: '367406', name: 'Pamulang' },
    { code: '367407', name: 'Setu' },
  ];
  for (const district of tangerangSelatanDistricts) {
    await prisma.district.upsert({
      where: { districtCode: district.code },
      update: {},
      create: { districtCode: district.code, districtName: district.name, regencyId: regencyTangerangSelatan.id },
    });
  }

  // Village (Kelurahan) level, seeded only for Kebayoran Baru -- see this
  // function's header comment for why the other 16 districts stop at the
  // district level in this dev seed.
  const kebayoranBaruVillages: Array<{ code: string; name: string }> = [
    { code: '3171061001', name: 'Selong' },
    { code: '3171061002', name: 'Gunung' },
    { code: '3171061003', name: 'Kramat Pela' },
    { code: '3171061004', name: 'Gandaria Utara' },
    { code: '3171061005', name: 'Cipete Utara' },
    { code: '3171061006', name: 'Pulo' },
    { code: '3171061007', name: 'Petogogan' },
    { code: '3171061008', name: 'Melawai' },
    { code: '3171061009', name: 'Rawa Barat' },
    { code: '3171061010', name: 'Senayan' },
  ];
  const kebayoranBaruId = districtIdByCode.get('317106')!;
  for (const village of kebayoranBaruVillages) {
    await prisma.village.upsert({
      where: { villageCode: village.code },
      update: {},
      create: { villageCode: village.code, villageName: village.name, districtId: kebayoranBaruId },
    });
  }

  return {
    provinces: 2,
    regencies: 2,
    districts: jakartaSelatanDistricts.length + tangerangSelatanDistricts.length,
    villages: kebayoranBaruVillages.length,
  };
}

async function main() {
  const permissionCount = await seedPermissionsAndRoles();
  const userIdByUsername = await seedUsers();
  const masterDataCounts = await seedMasterData(userIdByUsername);
  const patientCount = await seedPatients();
  const regionCounts = await seedRegions();
  const transactionalCounts = await seedTransactionalData(userIdByUsername);
  const menuCounts = await seedMenus(userIdByUsername);

  // eslint-disable-next-line no-console
  console.log(`Seeded ${permissionCount} permissions and roles: ${['ADMINISTRATOR', ...Object.keys(ROLE_PERMISSIONS)].join(', ')}`);
  // eslint-disable-next-line no-console
  console.log(
    `Seeded Master Data: ${masterDataCounts.clinics} clinic, ${masterDataCounts.branches} branches, ${masterDataCounts.doctors} doctors, ${masterDataCounts.doctorSchedules} doctor schedules, ${masterDataCounts.treatmentCategories} treatment categories, ${masterDataCounts.treatments} treatments, ${masterDataCounts.paymentMethods} payment methods, ${masterDataCounts.toothConditions} tooth conditions, ${masterDataCounts.consentTemplates} consent templates, ${masterDataCounts.referralSources} referral sources.`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `Seeded Warehouse Module: ${masterDataCounts.itemCategories} item categories, ${masterDataCounts.units} units, ${masterDataCounts.warehouseItems} items, ${masterDataCounts.warehouseSuppliers} supplier, ${masterDataCounts.warehouseLocations} warehouse location.`,
  );
  // eslint-disable-next-line no-console
  console.log(`Seeded ${patientCount} patients (5 active, 1 archived).`);
  // eslint-disable-next-line no-console
  console.log(
    `Seeded Regional Address Master Data (placeholder subset, NOT the full catalog -- see seedRegions() comment): ${regionCounts.provinces} provinces, ${regionCounts.regencies} regencies, ${regionCounts.districts} districts, ${regionCounts.villages} villages (Kebayoran Baru only).`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `Seeded workflow chains: ${transactionalCounts.reservations} reservations, ${transactionalCounts.queueEntries} queue entries, ${transactionalCounts.visits} EMR visit (SOAP+odontogram+treatment+prescription+consent), ${transactionalCounts.invoices} invoice+payment, ${transactionalCounts.financeAccounts} finance accounts + 1 period + 1 cash account + ${transactionalCounts.journals} posted journal, ${transactionalCounts.purchaseOrders} purchase order + ${transactionalCounts.goodsReceipts} posted goods receipt (2 items, 1 batch), ${transactionalCounts.notifications} notification (+template), ${transactionalCounts.featureFlags} feature flag, ${transactionalCounts.systemParameters} system parameters, ${transactionalCounts.branchAssignments} branch assignments, ${transactionalCounts.masterDataTemplates} master data template (1 in-sync + 1 drifted branch link).`,
  );
  // eslint-disable-next-line no-console
  console.log(`Seeded ${menuCounts.menus} menu entries (mirrors apps/frontend/config/navigation.ts's NAV_ITEMS tree, each linked to its permission).`);
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
