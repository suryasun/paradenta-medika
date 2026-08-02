import { PeriodontalAssessment, PeriodontalMeasurement } from '@prisma/client';
import { PeriodontalAssessmentResponseDto, PeriodontalMeasurementResponseDto } from '../dtos/PeriodontalResponseDto';

export function toPeriodontalAssessmentResponseDto(assessment: PeriodontalAssessment): PeriodontalAssessmentResponseDto {
  return {
    id: assessment.id,
    visitId: assessment.visitId,
    patientId: assessment.patientId,
    doctorId: assessment.doctorId,
    status: assessment.status,
    lockedAt: assessment.lockedAt ? assessment.lockedAt.toISOString() : null,
    lockedBy: assessment.lockedBy,
    createdAt: assessment.createdAt.toISOString(),
    createdBy: assessment.createdBy,
  };
}

export function toPeriodontalMeasurementResponseDto(measurement: PeriodontalMeasurement): PeriodontalMeasurementResponseDto {
  return {
    id: measurement.id,
    assessmentId: measurement.assessmentId,
    toothNumber: measurement.toothNumber,
    measurementPoint: measurement.measurementPoint,
    pocketDepth: Number(measurement.pocketDepth),
    gingivalMargin: Number(measurement.gingivalMargin),
    cal: Number(measurement.cal),
    bleeding: measurement.bleeding,
    plaqueIndex: measurement.plaqueIndex,
    mobility: measurement.mobility,
    furcation: measurement.furcation,
    createdAt: measurement.createdAt.toISOString(),
    createdBy: measurement.createdBy,
  };
}
