// Azure AD OAuth2 helpers — see docs/implementation-plan.md Step 2.1
// Security: [SO §3] Authorization Code Flow with PKCE, never Implicit Flow
// Adapted from client portal — identical OAuth2 flow, separate app registration

import * as jose from "jose";
import { randomBytes, createHash } from "crypto";

const TENANT_ID = process.env.AZURE_AD_TENANT_ID ?? "";
const CLIENT_ID = process.env.AZURE_AD_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET ?? "";
const REDIRECT_URI = process.env.AZURE_AD_REDIRECT_URI ?? "";

const BASE_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0`;
const JWKS_URL = `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`;
const SCOPES = "openid profile email User.Read";

// Cache JWKS key set for 24 hours
let jwksCache: jose.JWTVerifyGetKey | null = null;
let jwksCacheTime = 0;
const JWKS_CACHE_MS = 24 * 60 * 60 * 1000;

function getJwks() {
  if (jwksCache && Date.now() - jwksCacheTime < JWKS_CACHE_MS) {
    return jwksCache;
  }
  jwksCache = jose.createRemoteJWKSet(new URL(JWKS_URL));
  jwksCacheTime = Date.now();
  return jwksCache;
}

/** Generate cryptographically random string for state/nonce. */
function randomString(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Generate PKCE code_verifier and code_challenge (S256). */
function generatePkce() {
  const verifier = randomString(32);
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/** Build the Azure AD authorization URL with state, nonce, and PKCE. */
export function buildAuthorizationUrl() {
  const state = randomString();
  const nonce = randomString();
  const { verifier, challenge } = generatePkce();

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    response_mode: "query",
  });

  return {
    url: `${BASE_URL}/authorize?${params}`,
    state,
    nonce,
    codeVerifier: verifier,
  };
}

interface TokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

/** Exchange authorization code for tokens (server-side only). [SO §3] */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const res = await fetch(`${BASE_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<TokenResponse>;
}

interface IdTokenClaims {
  sub: string;
  oid: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  iss: string;
  aud: string;
  exp: number;
  nonce?: string;
}

/** Validate ID token: signature, issuer, audience, expiry, nonce. [SO §3] */
export async function validateIdToken(
  idToken: string,
  expectedNonce: string,
): Promise<IdTokenClaims> {
  const jwks = getJwks();

  const { payload } = await jose.jwtVerify(idToken, jwks, {
    issuer: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
    audience: CLIENT_ID,
  });

  const claims = payload as unknown as IdTokenClaims;

  if (claims.nonce !== expectedNonce) {
    throw new Error("Nonce mismatch — possible token replay");
  }

  return claims;
}

/** Build Azure AD logout URL. [SO §3] */
export function buildLogoutUrl(postLogoutRedirectUri: string): string {
  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogoutRedirectUri,
  });
  return `${BASE_URL}/logout?${params}`;
}
