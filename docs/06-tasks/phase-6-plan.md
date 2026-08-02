# Phase 6 Task Plan — Healthcare Ecosystem

**Source:** docs/03-sad/26-roadmap.md Section 9 (Phase 6 — Healthcare Ecosystem)
**Task Range:** task-255 through task-283 (29 tasks)
**Scope:** Future Integrations (National Health Integration, Insurance Platform, Payment Gateway, Laboratory System, Radiology System, Telemedicine, Patient Mobile App, Doctor Mobile App, Public API, AI Services) and Innovation Areas (AI Clinical Assistant, Predictive Analytics, Smart Scheduling, Clinical Decision Support, Executive Intelligence, Healthcare Data Exchange), built on Patient (docs/03-sad/12-module-patient.md), EMR (docs/03-sad/15-module-emr.md), Billing (docs/03-sad/16-module-billing.md), Reservation (docs/03-sad/13-module-reservation.md), Reporting (docs/03-sad/20-module-report.md), Security (docs/03-sad/25-security.md), and API Standard (docs/03-sad/09-api-standard.md).

This is the final roadmap phase (docs/03-sad/26-roadmap.md has no Phase 7). Per the standing instruction pattern applied to every prior phase in this project, this plan covers **Phase 6 only** and does not extend beyond it.

---

## Important Context: Phase 6 Has the Widest Range of Documentation Depth Yet

Phase 6 is unusual: some items (Radiology System, Clinical Decision Support, Clinical Alert Engine) have exceptionally rich, literal SAD content — full field lists, literal workflows, worked examples — because docs/03-sad/15-module-emr.md's Dental X-Ray and CDSS sections were clearly written with production detail in mind even though they're framed as forward-looking. Other items (Laboratory System, SSO-adjacent National Health Integration, Video Consultation, both Mobile Apps) have **zero** technical specification — only a single bullet point or table row anywhere in the entire SAD. This plan treats each item honestly according to its actual documentation depth: richly-specified items get full implementation tasks; zero-specification items get Design Spike tasks that explicitly do not produce code, per CLAUDE.md's Missing Information rule (the same pattern already established for Phase 5's SSO/IdP task).

Six of this phase's 29 tasks are Design Spikes producing an Architecture Decision Record rather than working code: task-255 (National Health Integration), task-258 (External Insurance/BPJS), task-261 (Laboratory System), task-267 (Video Consultation), task-292 (Patient Mobile App API Surface), and task-294 (Doctor Mobile App API Surface).

---

## Ambiguities and Gaps Reported

1. **National Health Integration (SATUSEHAT/HL7 FHIR)** has only one line of source material (docs/03-sad/12-module-patient.md Section 30's Future Enhancements table row). task-255 is a Design Spike; task-256 builds a self-contained, testable FHIR resource-mapping foundation that delivers value independent of any live SATUSEHAT connection.

2. **Insurance Platform** splits into two very differently-specified halves: UC-BIL-006 Apply Insurance (task-257) is a literal, already-specified Billing use case that was simply never built in Phase 1 — this is a real, closeable gap, not new roadmap scope. External BPJS/insurer clearinghouse integration (task-258) has zero specification and is a Design Spike.

3. **Payment Gateway** names three literal candidate providers (Midtrans, Xendit, Stripe) without selecting one (task-259); Webhook Security (task-260) is fully specified with a literal five-point validation checklist.

4. **Laboratory System** is the single most under-specified item in this entire phase — as already flagged in Phase 2's own ambiguity report, no dedicated Laboratory module exists anywhere in the SAD. task-261 is a pure Design Spike.

5. **Radiology System** is, by contrast, the best-specified item in Phase 6 — docs/03-sad/15-module-emr.md's Dental X-Ray sections (DICOM Standard, PACS Integration, Image Processing Pipeline, Image Annotation) give literal field lists, literal workflows, and literal rule sets. Tasks 262–265 are full implementations, not spikes.

6. **Telemedicine** has two narrative mentions (a reservation category, a consent requirement) sufficient to ground a real data-model task (task-266), but the actual video mechanism (task-267) has zero specification and is a Design Spike.

7. **Patient Mobile App and Doctor Mobile App** are explicitly listed as Out of Scope in docs/03-sad/01-system-overview.md Section 3.2 and marked "Future" everywhere else. task-268 (Patient Self-Check-In/QR) and task-269's design-spike sibling are the only concretely buildable slice; the Doctor Mobile App (task-270) has no buildable slice at all beyond its own spike.

8. **Public API** has a rate-limit number (60 req/min) and an explicitly-deferred "API Key (Future)" feature from Phase 5's API Gateway, both literal enough to ground a real implementation (tasks 271–272) — unlike most other Phase 6 items, this one only requires *scope documentation* (which endpoints are public), not a full architectural spike.

9. **AI Services** (a Future Integrations bullet) is not built as its own separate epic — it is functionally identical to, and fully absorbed by, the AI Clinical Assistant epic's governance foundation (task-273) plus the Predictive Analytics epic's model-backed tasks (task-275, task-276). Building a separate "AI Services" epic would duplicate task-273's shared governance layer; this consolidation is a deliberate design choice, not an omission.

10. **Patient Satisfaction KPI has no data-collection mechanism.** task-282 (Executive Intelligence Dashboard) discovers this gap while trying to surface EMR's literal Business Intelligence KPI list: no survey/NPS/CSAT capture capability exists anywhere in Phase 1–5. Per CLAUDE.md's Missing Information rule, task-282 explicitly reports this rather than fabricating a survey feature.

11. **AI model/provider selection is undefined across every AI-powered task** (task-274 AI Clinical Assistant capabilities, task-304 Predictive Financial Dashboard's forecasting method). No SAD document names an LLM provider, hosting approach, or forecasting algorithm. Each affected task requires this decision to be made and documented during implementation, not guessed.

12. **Healthcare Data Exchange (task-283) overlaps with National Health Integration (task-255/256).** The two are related but distinct: DA (National Health Integration) is SATUSEHAT-specific and blocked on an ADR; DP (Healthcare Data Exchange) is the general-purpose provider-to-provider exchange mechanism and can proceed once task-256's FHIR mappers exist, independent of task-255's approval. This distinction is called out explicitly in task-283's Definition of Done.

---

## Task List by Epic

| Epic | Feature Area | Module | Tasks | Count |
|---|---|---|---|---|
| DA. National Health Integration | SATUSEHAT/HL7 FHIR | Patient | task-255–256 | 2 |
| DB. Insurance Platform | Internal Insurance Allocation, External Clearinghouse | Billing | task-257–258 | 2 |
| DC. Payment Gateway | Provider Integration, Webhook Confirmation | Billing | task-259–260 | 2 |
| DD. Laboratory System | Feasibility & Design | EMR | task-261 | 1 |
| DE. Radiology System | DICOM, PACS, Processing Pipeline, Annotation | EMR | task-262–265 | 4 |
| DF. Telemedicine | Appointment Type, Video Session | Reservation | task-266–267 | 2 |
| DG. Patient Mobile App | Self-Check-In, Mobile API Design | Reservation | task-268–269 | 2 |
| DH. Doctor Mobile App | Mobile API Design | Reservation | task-270 | 1 |
| DI. Public API | API Key Access, Documentation | System | task-271–272 | 2 |
| DK. AI Clinical Assistant | Governance Foundation, Assistant Capabilities | EMR | task-273–274 | 2 |
| DL. Predictive Analytics | Recall Prediction, No-Show Prediction, Financial Forecasting | EMR / Reservation / Reporting | task-275–277 | 3 |
| DM. Smart Scheduling | Slot Recommendation, Calendar Sync | Reservation | task-278–279 | 2 |
| DN. Clinical Decision Support | CDSS Rule Engine, Clinical Alert Engine | EMR | task-280–281 | 2 |
| DO. Executive Intelligence | Unified Dashboard Extension | Reporting | task-282 | 1 |
| DP. Healthcare Data Exchange | Bidirectional Exchange | Patient | task-283 | 1 |

**Total: 29 tasks (task-255 through task-283).**

---

## Task Dependencies (Summary)

- task-255 (National Health Integration Spike) depends on Phase 1's task-021/task-022.
- task-256 (FHIR Resource Mapping) depends on Phase 1's task-001 and task-255.
- task-257 (Apply/Remove Insurance) depends on Phase 1 Billing Basic's Create Invoice task.
- task-258 (External Insurance Spike) depends on task-257.
- task-259 (Payment Gateway Provider) depends on Phase 1 Billing Basic.
- task-260 (Payment Gateway Webhook) depends on task-259.
- task-261 (Laboratory Spike) depends on Phase 2's Clinical Attachment module.
- task-262 (DICOM Ingestion) depends on Phase 2's Clinical Attachment module.
- task-263 (PACS Integration) depends on task-262.
- task-264 (Image Processing Pipeline) depends on task-262.
- task-265 (Image Annotation) depends on task-264.
- task-266 (Telemedicine Appointment) depends on Phase 1 Reservation and Phase 3 Consent Management.
- task-267 (Video Consultation Spike) depends on task-266.
- task-268 (Patient Self-Check-In) depends on Phase 1's task-035.
- task-269 (Patient Mobile Spike) depends on task-268.
- task-270 (Doctor Mobile Spike) depends on Phase 1 Authentication and Phase 1 Queue module.
- task-271 (Public API Gateway) depends on Phase 5's task-235.
- task-272 (Public API Docs) depends on task-271.
- task-273 (AI Pipeline Governance) depends on Phase 1's task-001.
- task-274 (AI Clinical Assistant Capabilities) depends on task-273 and Phase 2's EMR clinical entry.
- task-275 (Recall Prediction) depends on task-273 and Phase 2's Recall Recommendation Engine.
- task-276 (No-Show Prediction) depends on task-273 and Phase 1 Reservation.
- task-277 (Predictive Financial Dashboard) depends on Phase 5's task-239/task-240.
- task-278 (AI Slot Recommendation) depends on task-273 and Phase 1's task-036.
- task-279 (Calendar Sync) depends on Phase 1's task-023.
- task-280 (CDSS Rule Engine) depends on Phase 2's EMR clinical entry.
- task-281 (Clinical Alert Engine) depends on task-280.
- task-282 (Executive Intelligence) depends on Phase 5's task-241 and task-277.
- task-283 (Healthcare Data Exchange) depends on task-256 and task-255.

---

## Implementation Order

1. **Design Spikes (parallel, low-cost, unblock everything else)** — task-255 (National Health Integration), task-258 (External Insurance — after task-257), task-261 (Laboratory), task-267 (Video Consultation — after task-266), task-269 (Patient Mobile — after task-268), task-270 (Doctor Mobile). These have minimal dependencies and can be scheduled early to surface architecture decisions before dependent implementation work begins.
2. **Insurance & Payment Gateway** — task-257 (Apply/Remove Insurance) → task-258 (spike, parallel). task-259 (Payment Gateway Provider) → task-260 (Webhook). Both sub-tracks depend only on Phase 1 Billing.
3. **Radiology System (richest-specified track)** — task-262 (DICOM Ingestion) → task-263 (PACS Integration) and task-264 (Image Processing Pipeline) in parallel → task-265 (Image Annotation, depends on task-264).
4. **AI Governance Foundation** — task-273, the single most-depended-upon task in this phase (blocks task-274, task-275, task-276, task-278). Should be prioritized early once Phase 1's task-001 is confirmed live.
5. **AI Clinical Assistant & CDSS** — task-274 (after task-273), task-280 (CDSS, independent of task-273 — depends only on Phase 2 EMR) → task-281 (Clinical Alert Engine, after task-280).
6. **Predictive Analytics** — task-275 (Recall Prediction, after task-273), task-276 (No-Show Prediction, after task-273), task-277 (Predictive Financial Dashboard, depends on Phase 5's task-239/240, independent of task-273).
7. **Smart Scheduling** — task-278 (AI Slot Recommendation, after task-273 and Phase 1's task-036), task-279 (Calendar Sync, independent — only needs Phase 1's task-023).
8. **Telemedicine & Mobile** — task-266 (Telemedicine Appointment) → task-267 (spike). task-268 (Patient Self-Check-In) → task-269 (spike). task-270 (Doctor Mobile spike, independent). All can run in parallel with Groups 3–7.
9. **National Health Integration & Data Exchange** — task-255 (spike) → task-256 (FHIR Mapping) → task-283 (Healthcare Data Exchange, also depends on task-255's spike having been reviewed even though it doesn't block on approval per the Epic DP/DA distinction in Ambiguity #12).
10. **Public API** — task-271 (after Phase 5's task-235) → task-272 (Documentation). Independent of Groups 1–9.
11. **Executive Intelligence (capstone)** — task-282, the last task to sequence since it depends on task-241 (Phase 5) and task-277 (Group 6 of this phase).

**Critical path:** task-001 (Phase 1) → task-273 (AI Governance) → task-274/275/276/278 (parallel AI capabilities) demonstrates the widest fan-out in this phase. Separately: task-262 → task-263/264 → task-265 delivers the richest, most literal-spec-compliant track (Radiology). Separately: Phase 5's task-239/240 → task-277 → task-282 delivers the Executive Intelligence capstone.

---

## Definition of Done (Phase 6)

- All 29 tasks (task-255–task-283) implemented per their individual Definition of Done, Acceptance Criteria, and (for application-code tasks) the response/error envelope in docs/04-ai-contract/04-api-contract.md.
- All six Design Spike tasks (task-255, task-258, task-261, task-267, task-269, task-270) produce an approved ADR; none of them produce premature, invented implementation code, per CLAUDE.md's Missing Information rule.
- Radiology System's four tasks (task-262–265) match every literal field list, workflow step, and rule from docs/03-sad/15-module-emr.md's Dental X-Ray sections exactly.
- CDSS's two tasks (task-280–281) match all nineteen literal recommendation/alert types (9 CDSS + 10 Alert) and the literal worked example exactly.
- AI Clinical Assistant's governance foundation (task-273) is proven to be shared infrastructure: task-274, task-275, task-276, and task-278 all demonstrably write through it rather than reimplementing governance controls independently.
- task-282's Patient Satisfaction gap is explicitly reported as missing documentation, not fabricated, per Ambiguity #10.
- Every "provider/model selection undecided" ambiguity (Payment Gateway, AI model, forecasting method) is resolved with a documented decision during implementation, not left silently unresolved.

## Acceptance Criteria (Phase 6)

- National Health Integration: an approved ADR exists; a FHIR resource-mapping library validates against the public FHIR R4 schema independent of any live SATUSEHAT connection.
- Insurance Platform: the literal UC-BIL-006 Apply Insurance flow works end-to-end; an approved ADR exists for external clearinghouse integration.
- Payment Gateway: a payment can be initiated and confirmed end-to-end via webhook, with all five literal webhook-security validations enforced.
- Laboratory System: an approved ADR exists (no premature implementation).
- Radiology System: DICOM images ingest with full literal metadata, sync from PACS, flow through the full nine-step processing pipeline, and support all eight literal annotation types with version history.
- Telemedicine: a telemedicine reservation cannot be confirmed without consent; an approved ADR exists for the video mechanism.
- Patient/Doctor Mobile App: self-check-in via QR code works end-to-end reusing the existing check-in flow unchanged; approved ADRs exist for the broader mobile app builds.
- Public API: API-key-authenticated access is rate-limited at the literal 60/min ceiling, scoped to an explicitly documented endpoint subset, and revocable.
- AI Clinical Assistant / Predictive Analytics / Smart Scheduling / CDSS: every AI-touched clinical action requires explicit doctor review before it affects the permanent record; CDSS recommendations are advisory-only while Critical Clinical Alerts can block until acknowledged; predictions never trigger fully-automated actions (cancellation, overbooking) without human decision.
- Executive Intelligence: the dashboard correctly surfaces every literal, data-available KPI and explicitly flags the one KPI (Patient Satisfaction) with no data source, rather than fabricating a value.
- Healthcare Data Exchange: export produces a valid FHIR Bundle; import never auto-merges into the live EMR without explicit doctor review.
