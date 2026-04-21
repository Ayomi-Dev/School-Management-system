import bcrypt from "bcrypt";
import crypto from 'crypto';


const SALT_ROUNDS = 12; //controls how many times bcrypt processes user's password



export const hashPassword = async(password: string): Promise<string> => {
    //Takes the plain-text password and runs it through bcrypt's hashing algorithm 2¹² (4,096) times
    //adding the salt automatically to make it unique and resistant to rainbow table attacks.
    //  The resulting hash is what gets stored in the database, not the original password.
    return bcrypt.hash(password, SALT_ROUNDS) 
}

export async function verifyPassword( 
    password: string, hashedPassword: string
): Promise<boolean> {
    // Takes a plain-text password and a stored hash, re-hashes the plain password using the same salt embedded inside the hash, 
    // then compares the two. Returns true if they match, false if not.
    return bcrypt.compare(password, hashedPassword) 
}


export function hashedRefreshToken(rawToken: string) { //Generates a random token for account setup or password reset, and returns both the raw token (for sending to the user) and the hashed version (for securely storing in the database).
  const hashedToken = crypto.createHash("sha256") ////Creates a new hash object using the SHA-256 algorithm, which is a cryptographic hash function that produces a fixed-size 256-bit (32-byte) hash value.
    .update(rawToken) //Feeds the token string into the hasher.
    .digest("hex");  //Performs the hashing operation and outputs the result as a hexadecimal string, which is what gets stored in the database.

  return hashedToken;
}

export const generateOTP = (): string => {
    return String(Math.floor(100000 + Math.random() * 900000)) //This generates a random 6-didgit number and converts it to a string
}

export const generateReceiptNumber = (): string => {
  const date = new Date();

//   Extracts the 4-digit year,  gets the month,  ensures the month is always 2 digits (e.g., "01" for January), and constructs a prefix in the format "RCPYYYYMM". Then, 
  const prefix = `RCP${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`; 
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase(); //generates a random 6-character hexadecimal string as a suffix and converts it to uppercase
  return `${prefix}-${suffix}`; //combines both parts with a hyphen to create the final receipt number.
}

export const compareHashes = async(rawPassword: string, storedHashPassword: string ) => {
  return bcrypt.compare(rawPassword, storedHashPassword) //Compares a raw password with a stored hash using bcrypt's compare function, which handles the hashing and salting internally to determine if they match.
} 