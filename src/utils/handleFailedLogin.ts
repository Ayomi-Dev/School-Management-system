import { prisma } from "../lib/prisma/client";


const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export const handleFailedLogin = async(userId: string, currentCount: number) => {
    const newCount = currentCount + 1
    const whenToLock = newCount >= MAX_FAILED_ATTEMPTS

    await prisma.user.update({
        where: { id: userId},
        data: {
            failedLoginCount: newCount,
            lockedUntil: whenToLock ? new Date(Date.now() + LOCKOUT_DURATION ) : undefined //this updates the lockedUntil field only when the account should be locked, otherwise it leaves it unchanged
        }
    })

}