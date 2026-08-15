import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION = "7d";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET não configurado nas variáveis de ambiente.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  tipo: string;
};

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

export async function decryptSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "string" || typeof payload.tipo !== "string") {
      return null;
    }
    return { userId: payload.userId, tipo: payload.tipo };
  } catch {
    return null;
  }
}

// Só pode ser chamada a partir de um Server Function (Server Action) ou Route Handler.
export async function createSession(payload: SessionPayload): Promise<void> {
  const session = await encryptSession(payload);
  const expires = new Date(Date.now() + SESSION_DURATION_MS);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    expires,
    path: "/",
  });
}

// Só pode ser chamada a partir de um Server Function (Server Action) ou Route Handler.
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return decryptSession(token);
}
