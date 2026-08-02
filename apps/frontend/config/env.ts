// docs/04-ai-contract/03-project-structure-contract.md STRUCT-009: frontend
// configuration lives in config/. Base URL includes the /api/v1 prefix
// (apps/backend/src/app.ts API_V1_PREFIX) so services call bare resource
// paths, e.g. apiClient.get('/patients').
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
