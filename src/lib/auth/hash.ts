import crypto from 'crypto';

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

