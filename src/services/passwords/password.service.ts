import bcrypt from "bcrypt"


const SALT_ROUNDS = 12; //controls how many times bcrypt processes user's password
export const passwordServices = {
    async hashPassword(password: string): Promise<string> {
        //Takes the plain-text password and runs it through bcrypt's hashing algorithm 2¹² (4,096) times
        //adding the salt automatically to make it unique and resistant to rainbow table attacks.
        return bcrypt.hash(password, SALT_ROUNDS) 
    },
    
    async  verifyPassword( 
        password: string, hashedPassword: string
    ): Promise<boolean> {
        // Takes a plain-text password and a stored hash, re-hashes the plain password using the same salt embedded inside the hash, 
        // then compares the two. Returns true if they match, false if not.
        return bcrypt.compare(password, hashedPassword) 
    },
    /**
 * Generates a temporary password the admin never sees after creation.
 * Format: 3 words + 4-digit number, e.g. "amber-fox-7291"
 * Easy to read aloud/type but hard to guess.
 */
  setUpTempPasswordForAdmin(): string {
    const adjectives = ["amber", "brave", "calm", "deep", "eager", "fair", "gold", "high", "iron", "jade"];
    const nouns      = ["crane", "delta", "eagle", "flame", "grove", "heron", "ivory", "lark",  "maple", "north"];
    const rand       = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const digits     = String(Math.floor(Math.random() * 9000) + 1000); // 1000–9999
    return `${rand(adjectives)}-${rand(nouns)}-${digits}`;
    },

    generalTempPassword (lastName: string): string  { //uses user's surname as the temporaty password 
        return lastName;
    }

}


