import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "development-secret-change-me");

export async function createSession(userId: string, email: string, name: string) {
  const token = await new SignJWT({ email, name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  const cookieStore = await cookies();
  cookieStore.set("forge_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("forge_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { 
      userId: payload.sub ?? "", 
      email: String(payload.email ?? ""),
      name: String(payload.name ?? "")
    };
  } catch {
    return null;
  }
}
