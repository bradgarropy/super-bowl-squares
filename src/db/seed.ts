import {drizzleAdapter} from "@better-auth/drizzle-adapter"
import {betterAuth} from "better-auth/minimal"
import {getPlatformProxy} from "wrangler"

import {account, rateLimit, session, user, verification} from "~/db/auth"
import {createDb} from "~/db/client.server"
import {board, player, square} from "~/db/schema"
import * as schema from "~/db/schema"
import {shuffleBoard} from "~/utils/squares.server"

const password = "password"
const testEmail = "test@example.com"
const users = [
    {name: "Test User", email: testEmail},
    {name: "Patrick Mahomes", email: "patrick@example.com"},
    {name: "Jalen Hurts", email: "jalen@example.com"},
    {name: "Josh Allen", email: "josh@example.com"},
    {name: "Lamar Jackson", email: "lamar@example.com"},
]
const gameIds = [
    "401873302",
    "401873305",
    "401873308",
    "401872924",
    "401872925",
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
            db.delete(square),
            db.delete(player),
            db.delete(board),
            db.delete(session),
            db.delete(account),
            db.delete(verification),
            db.delete(rateLimit),
            db.delete(user),
        ])

        const seededUsers = []

        for (const {name, email} of users) {
            const result = await auth.api.signUpEmail({
                body: {name, email, password},
            })

            seededUsers.push(result.user)
        }

        const owner = seededUsers[0]

        for (const [index, gameId] of gameIds.entries()) {
            const boardId = crypto.randomUUID()
            const boardUsers = seededUsers.slice(0, index + 1)
            const players = boardUsers.map(user => ({
                id: crypto.randomUUID(),
                boardId,
                userId: user.id,
                name: user.name,
            }))

            await db.batch([
                db
                    .insert(board)
                    .values({id: boardId, gameId, ownerId: owner.id}),
                db.insert(player).values(players),
            ])

            await shuffleBoard(
                db,
                boardId,
                players.map(player => player.id),
            )
        }

        await db.batch([db.delete(session), db.delete(rateLimit)])

        console.log(`Seeded ${users.length} users in local D1`)
        console.log(`Seeded ${gameIds.length} boards with 1–5 players`)
        console.log(`Login with ${testEmail} / ${password}`)
    } finally {
        await platform.dispose()
    }
}

await main()
