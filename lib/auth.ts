import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "auth_token";

export type JwtPayload = {
  sub: string;
  email: string;
};

function getJwtSecret(): Secret {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return "dev-secret-change-me";
  throw new Error("Missing JWT_SECRET.");
}

export function signAuthToken(payload: JwtPayload, expiresIn = "7d") {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, getJwtSecret(), options);
}

export function verifyAuthToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

