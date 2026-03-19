// Safety guards — prevent accidental writes to real data
// See: docs/security-and-operations.md §11 Rule 11

import { TEST_ORG_ID, TEST_USER_IDS, TEST_EMAIL_DOMAIN } from "./test-constants";

export function assertTestOrg(organizationId: string) {
  if (organizationId !== TEST_ORG_ID) {
    throw new Error(
      `FATAL: Test attempted to write to non-test org: ${organizationId}. ` +
      `Only TEST_ORG_ID (${TEST_ORG_ID}) is allowed.`
    );
  }
}

export function assertTestUser(userId: string) {
  if (!TEST_USER_IDS.includes(userId)) {
    throw new Error(
      `FATAL: Test attempted to use non-test user: ${userId}. ` +
      `Only TEST_USER_IDS are allowed.`
    );
  }
}

export function assertTestEmail(email: string) {
  if (!email.endsWith(TEST_EMAIL_DOMAIN)) {
    throw new Error(
      `FATAL: Test attempted to use non-test email: ${email}. ` +
      `Only ${TEST_EMAIL_DOMAIN} domain is allowed.`
    );
  }
}
