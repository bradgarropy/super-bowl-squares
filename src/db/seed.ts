import "dotenv/config"

import bcrypt from "bcryptjs"
import {inArray} from "drizzle-orm"
import {seed} from "drizzle-seed"

import {db} from "~/db/client.server"
import {users} from "~/db/schema"

const password = "password"
const testEmail = "test@example.com"
const generatedEmails = [
    "player.one@example.com",
    "player.two@example.com",
    "player.three@example.com",
    "player.four@example.com",
]

const main = async () => {
    if (
        process.env.NODE_ENV === "production" ||
        process.env.VERCEL_ENV === "production"
    ) {
        throw new Error("Seeding is disabled in production")
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const seedEmails = [testEmail, ...generatedEmails]

    await db.delete(users).where(inArray(users.email, seedEmails))

    await seed(db, {users}, {count: generatedEmails.length, seed: 1}).refine(
        funcs => ({
            users: {
                columns: {
                    email: funcs.valuesFromArray({
                        values: generatedEmails,
                        isUnique: true,
                    }),
                    firstName: funcs.firstName(),
                    lastName: funcs.lastName(),
                    password: funcs.default({defaultValue: hashedPassword}),
                },
            },
        }),
    )

    await db.insert(users).values({
        email: testEmail,
        firstName: "Test",
        lastName: "User",
        password: hashedPassword,
    })

    console.log(`Seeded ${seedEmails.length} users`)
    console.log(`Login with ${testEmail} / ${password}`)
}

try {
    await main()
} finally {
    await db.$client.end()
}
