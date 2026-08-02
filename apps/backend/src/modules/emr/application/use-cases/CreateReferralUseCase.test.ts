import { CreateReferralUseCase } from './CreateReferralUseCase';
import { GetReferralsUseCase } from './GetReferralsUseCase';
import { FakeReferralRepository, FakeVisitRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { ReferralTargetTypeDto } from '../dtos/CreateReferralRequestDto';

async function seedVisit(repo: FakeVisitRepository) {
  return repo.create({ visitNo: 'VIS000001', patientId: 'p1', doctorId: 'd1', branchId: 'b1', queueId: 'q1', createdBy: 'doc-1' });
}

describe('CreateReferralUseCase (task-089)', () => {
  it('persists a referral with the correct target type and reason, and it is retrievable', async () => {
    const visitRepository = new FakeVisitRepository();
    const referralRepository = new FakeReferralRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const useCase = new CreateReferralUseCase(visitRepository, referralRepository, auditService);

    const referral = await useCase.execute({
      visitId: visit.id,
      targetType: ReferralTargetTypeDto.LABORATORY,
      reason: 'Blood test for pre-surgery clearance',
      actorUserId: 'doc-1',
    });

    expect(referral.targetType).toBe('LABORATORY');
    expect(referral.reason).toBe('Blood test for pre-surgery clearance');
    expect(referral.patientId).toBe('p1');
    expect(auditService.records).toHaveLength(1);

    const getUseCase = new GetReferralsUseCase(visitRepository, referralRepository);
    const referrals = await getUseCase.execute(visit.id);
    expect(referrals).toHaveLength(1);
    expect(referrals[0].id).toBe(referral.id);
  });
});
