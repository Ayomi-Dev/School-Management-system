import { prisma } from "@/src/lib/prisma/client";

const testDb = async() => {
    try {
        await prisma.$connect();
        console.log("DB connected successfully")
    } catch (error) {
       console.error("Cannot connect to DB", error) 
    }
}
// export default testDb;

const testRefreshToken = async() => {
    try {
        const res = await fetch("http://localhost:3000/api/auth/refresh", {
            method: "POST",
            credentials: "include", // Include cookies in the request
        });
        const data = await res.json();
        console.log("Refresh token test result:", data);
    } catch (error) {
        console.log("error refreshing", error)
    }
}
export default testRefreshToken