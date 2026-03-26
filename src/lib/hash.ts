import bcrypt from "bcrypt";
import crypto from 'crypto';


const SALT_ROUNDS = 12;

export const hashPassword = async(password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword( 
    password: string, hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
}

export const hashToken = async(token: string): Promise<string> => {
    return crypto.createHash("sha256")
    .update(token)
    .digest("hex")
}

export const generateOTP = (): string => {
    return String(Math.floor(100000 + Math.random() * 900000)) //This generates a random 6-didgit number and converts it to a string
}

export const generateReceiptNumber = (): string => {
  const date = new Date();
  const prefix = `RCP${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${suffix}`;
}