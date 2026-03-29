import { prisma } from "@/src/lib/prisma/client";

const testDb = async() => {
    try {
        await prisma.$connect();
        console.log("DB connected successfully")
    } catch (error) {
       console.error("Cannot connect to DB", error) 
    }
}
export default testDb;