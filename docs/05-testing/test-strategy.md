# Test Strategy

> Source: `docs/03-sad/03-clean-architecture.md` Section 40 (Testing Strategy), cross-referenced with `CLAUDE.md` project instructions ("TESTING" section: Unit Test, Integration Test, API Test, Frontend Component Test, E2E Test if required).

---

# 40. Testing Strategy

## 40.1 Testing Pyramid

```mermaid
graph TD

E2E

Integration Test

Unit Test
```

---

## 40.2 Test Layer

| Layer | Type |
|---------|------|
| Controller | Integration Test |
| Use Case | Unit Test |
| Domain | Unit Test |
| Repository | Integration Test |
| API | E2E Test |

---

## 40.3 Coverage Target

| Layer | Target |
|--------|-------|
| Domain | 90% |
| Use Case | 90% |
| Repository | 80% |
| Controller | 80% |

---


---

# Scope Mapping

| Test Type | Detailed In | Coverage Target |
|---|---|---|
| Unit Test (Domain, Use Case) | `docs/05-testing/unit-tests.md` | 90% (per Section 40.3 above) |
| Integration Test (Controller, Repository) | `docs/05-testing/api-tests.md` | 80% |
| API Test | `docs/05-testing/api-tests.md` | See per-module API specs in `docs/03-sad/` |
| E2E Test | `docs/05-testing/e2e-tests.md` | Critical flows per `docs/03-sad/01-system-overview.md` Sections 21–24 |

# Additional Binding Requirement

Per `CLAUDE.md`: "Generate tests for every implementation. Include: Unit Test, Integration Test, API Test, Frontend Component Test, E2E Test if required." Frontend Component Test is not separately detailed in `docs/03-sad/` (no frontend test framework or component-test convention is specified there — this is a documentation gap); it should follow whatever component-testing convention accompanies the eventual Design System (see `docs/02-design/design-system.md`).
