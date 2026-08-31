import {drizzleAdapter} from "@better-auth/drizzle-adapter"
import {betterAuth} from "better-auth/minimal"
import {getPlatformProxy} from "wrangler"

import {account, rateLimit, session, user, verification} from "~/db/auth"
import {createDb} from "~/db/client.server"
import * as schema from "~/db/schema"

const password = "password"
const testEmail = "test@example.com"
const users = [
    {name: "Test User", email: testEmail},
    {name: "Patrick Mahomes", email: "patrick@example.com"},
    {name: "Jalen Hurts", email: "jalen@example.com"},
    {name: "Josh Allen", email: "josh@example.com"},
    {name: "Lamar Jackson", email: "lamar@example.com"},
]

const main = async () => {
    if (process.env.NODE_ENV === "production") {
        throw new Error("Seeding is disabled in production")
    }

    const platform = await getPlatformProxy<Pick<Env, "DB">>({
        remoteBindings: false,
    })

    try {
        const db = createDb(platform.env.DB)
        const auth = betterAuth({
            baseURL: {
                allowedHosts: [
                    "localhost:*",
                    "*.bradgarropy.com",
                    "*.bradgarropy.workers.dev",
                ],
                fallback: "http://localhost:5173",
            },
            database: drizzleAdapter(db, {
                provider: "sqlite",
                schema,
            }),
            emailAndPassword: {
                enabled: true,
            },
            rateLimit: {
                storage: "database",
            },
        })

        await db.batch([
            db.delete(session),
            db.delete(account),
            db.delete(verification),
            db.delete(rateLimit),
            db.delete(user),
        ])

        for (const {name, email} of users) {
            await auth.api.signUpEmail({
                body: {name, email, password},
            })
        }

        await db.batch([db.delete(session), db.delete(rateLimit)])

        console.log(`Seeded ${users.length} users in local D1`)
        console.log(`Login with ${testEmail} / ${password}`)
    } finally {
        await platform.dispose()
    }
}

await main()
