import "dotenv/config"

import bcrypt from "bcryptjs"

import {db} from "~/db/client.server"
import {users} from "~/db/schema"

const password = "password"
const testEmail = "test@example.com"
const userSeeds = [
    {firstName: "Test", lastName: "User", email: testEmail},
    {firstName: "Patrick", lastName: "Mahomes", email: "patrick@example.com"},
    {firstName: "Jalen", lastName: "Hurts", email: "jalen@example.com"},
    {firstName: "Josh", lastName: "Allen", email: "josh@example.com"},
    {firstName: "Lamar", lastName: "Jackson", email: "lamar@example.com"},
]

const main = async () => {
    if (
        process.env.NODE_ENV === "production" ||
        process.env.VERCEL_ENV === "production"
    ) {
        throw new Error("Seeding is disabled in production")
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await db.transaction(async transaction => {
        await transaction.delete(users)
        await transaction.insert(users).values(
            userSeeds.map(user => ({
                ...user,
                password: hashedPassword,
            })),
        )
    })

    console.log(`Seeded ${userSeeds.length} users`)
    console.log(`Login with ${testEmail} / ${password}`)
}

try {
    await main()
} finally {
    await db.$client.end()
}
