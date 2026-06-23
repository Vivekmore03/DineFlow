import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const jwtSecret = process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
const jwtResetSecret = process.env.JWT_RESET_SECRET;

if (!jwtSecret || !jwtRefreshSecret || !jwtResetSecret) {
  throw new Error(
    `Missing required JWT environment variables: ${[
      !jwtSecret && "JWT_SECRET",
      !jwtRefreshSecret && "JWT_REFRESH_SECRET",
      !jwtResetSecret && "JWT_RESET_SECRET",
    ]
      .filter(Boolean)
      .join(", ")}`
  );
}

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(jwtSecret);
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(jwtRefreshSecret);
const RESET_TOKEN_SECRET = new TextEncoder().encode(jwtResetSecret);

export interface TokenPayload {
  userId: string;
  role: "OWNER" | "KITCHEN_STAFF";
  restaurantId: string | null;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compare plain text password with hashed password
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign JWT tokens using jose (compatible with Edge/Middleware)
 */
export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(ACCESS_TOKEN_SECRET);
}

export async function signRefreshToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(REFRESH_TOKEN_SECRET);
}

/**
 * Verify JWT tokens using jose (compatible with Edge/Middleware)
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET);
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Set HTTP-only Cookies for Authentication
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  // Access token cookie (expires in 15 mins)
  response.cookies.set({
    name: "access_token",
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  });

  // Refresh token cookie (expires in 7 days)
  response.cookies.set({
    name: "refresh_token",
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

/**
 * Clear Authentication Cookies on Logout
 */
export function clearAuthCookies(response: NextResponse) {
  response.cookies.set({
    name: "access_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set({
    name: "refresh_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Extract and verify authentication from Request cookies
 */
export async function getAuthUser(request: NextRequest): Promise<TokenPayload | null> {
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) return null;
  return verifyAccessToken(accessToken);
}

/**
 * Sign a stateless short-lived password reset token
 */
export async function signResetToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h") // 1 hour expiration
    .sign(RESET_TOKEN_SECRET);
}

/**
 * Verify a stateless password reset token
 */
export async function verifyResetToken(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, RESET_TOKEN_SECRET);
    return payload as unknown as { email: string };
  } catch (error) {
    return null;
  }
}

/**
 * Sign a short-lived socket token (expires in 2 minutes)
 */
export async function signSocketToken(payload: {
  role: "staff" | "customer";
  restaurantId: string;
  tableId?: string;
  userId?: string;
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(ACCESS_TOKEN_SECRET);
}

