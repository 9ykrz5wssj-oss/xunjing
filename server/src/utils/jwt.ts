import jwt from "jsonwebtoken";
import { JwtPayload } from "../types";

const SECRET = process.env.JWT_SECRET || "campus-dev-secret";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, SECRET as string, { expiresIn: EXPIRES_IN as any });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
