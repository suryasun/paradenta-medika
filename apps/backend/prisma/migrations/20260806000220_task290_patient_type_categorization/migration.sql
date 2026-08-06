-- docs/06-tasks/task-290.md (Epic RE1, Reservation Module Enhancement
-- addendum). `patient_type_at_booking` and `patient_type` cannot use a
-- schema-level default that reflects real history for the 10 pre-existing
-- reservations in this dev database, so this migration adds the columns
-- nullable/defaulted, backfills them using the exact same "any prior
-- reservation not CANCELLED/NO_SHOW" rule the application layer applies
-- going forward (docs/03-sad/13-module-reservation.md Section 39.2), then
-- tightens `reservations.patient_type_at_booking` to NOT NULL.

-- AlterTable
ALTER TABLE `patients` ADD COLUMN `first_reservation_at` DATETIME(3) NULL,
    ADD COLUMN `patient_type` ENUM('NEW', 'OLD') NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE `reservations` ADD COLUMN `patient_type_at_booking` ENUM('NEW', 'OLD') NULL;

-- Backfill reservations.patient_type_at_booking: NEW unless an earlier
-- (by created_at), non-CANCELLED/NO_SHOW reservation already exists for the
-- same patient. Uses a materialized derived table (`counts`) rather than a
-- direct correlated subquery in the UPDATE...SET clause, since MySQL
-- rejects referencing the update target table in a FROM subquery.
UPDATE `reservations` r
JOIN (
  SELECT r1.`id` AS `id`,
    (
      SELECT COUNT(*) FROM `reservations` r2
      WHERE r2.`patient_id` = r1.`patient_id`
        AND r2.`status` NOT IN ('CANCELLED', 'NO_SHOW')
        AND r2.`created_at` < r1.`created_at`
    ) AS `prior_count`
  FROM `reservations` r1
) counts ON counts.`id` = r.`id`
SET r.`patient_type_at_booking` = CASE WHEN counts.`prior_count` = 0 THEN 'NEW' ELSE 'OLD' END;

-- AlterTable: tighten now that every row has a value.
ALTER TABLE `reservations` MODIFY COLUMN `patient_type_at_booking` ENUM('NEW', 'OLD') NOT NULL;

-- Backfill patients.patient_type/first_reservation_at: a patient flips to
-- OLD, with first_reservation_at set to the moment of the flip, on their
-- second non-CANCELLED/NO_SHOW reservation (by created_at) -- matching the
-- event-subscriber's own idempotent-flip rule going forward.
-- (Rank computed via a correlated "how many earlier eligible reservations"
-- count rather than ROW_NUMBER(), since this dev MySQL version rejects
-- window function syntax.)
UPDATE `patients` p
JOIN (
  SELECT r1.`patient_id` AS `patient_id`, r1.`created_at` AS `created_at`
  FROM `reservations` r1
  WHERE r1.`status` NOT IN ('CANCELLED', 'NO_SHOW')
    AND (
      SELECT COUNT(*) FROM `reservations` r2
      WHERE r2.`patient_id` = r1.`patient_id`
        AND r2.`status` NOT IN ('CANCELLED', 'NO_SHOW')
        AND r2.`created_at` < r1.`created_at`
    ) = 1
) second ON second.`patient_id` = p.`id`
SET p.`patient_type` = 'OLD', p.`first_reservation_at` = second.`created_at`;
