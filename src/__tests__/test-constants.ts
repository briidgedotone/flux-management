// Well-known test UUIDs — never use real org/user IDs in tests
// See: docs/security-and-operations.md §11 (Test Data Isolation)

export const TEST_ORG_ID = "00000000-0000-0000-0000-000000000099";
export const TEST_ORG_NAME = "Flux QA Internal";
export const TEST_ORG_SLUG = "flux-qa-internal";

export const TEST_CEO_ID = "00000000-0000-0000-0000-000000000001";
export const TEST_DIRECTOR_ID = "00000000-0000-0000-0000-000000000002";
export const TEST_EMPLOYEE_ID = "00000000-0000-0000-0000-000000000003";
export const TEST_CLIENT_USER_ID = "00000000-0000-0000-0000-000000000004";

export const TEST_EMAIL_DOMAIN = "@test.flux.internal";

export const TEST_USER_IDS = [
  TEST_CEO_ID,
  TEST_DIRECTOR_ID,
  TEST_EMPLOYEE_ID,
  TEST_CLIENT_USER_ID,
];
