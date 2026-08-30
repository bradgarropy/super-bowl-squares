import bcrypt from "bcryptjs"
import {sql} from "drizzle-orm"
import {getPlatformProxy} from "wrangler"

import {createDb} from "~/db/client.server"
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
    if (process.env.NODE_ENV === "production") {
        throw new Error("Seeding is disabled in production")
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const platform = await getPlatformProxy<Pick<Env, "DB">>({
        remoteBindings: false,
    })

    try {
        const db = createDb(platform.env.DB)

        await db.batch([
            db.delete(users),
            // Reset SQLite's auto-increment counter so seeded IDs start at 1.
            db.run(sql`delete from sqlite_sequence where name = 'legacy_user'`),
            db.insert(users).values(
                userSeeds.map(user => ({
                    ...user,
                    password: hashedPassword,
                })),
            ),
        ])

        console.log(`Seeded ${userSeeds.length} users in local D1`)
        console.log(`Login with ${testEmail} / ${password}`)
    } finally {
        await platform.dispose()
    }
}

await main()
