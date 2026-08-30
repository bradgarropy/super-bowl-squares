import {drizzleAdapter} from "@better-auth/drizzle-adapter"
import {betterAuth} from "better-auth/minimal"
import {env} from "cloudflare:workers"
import {drizzle} from "drizzle-orm/d1"

const auth = betterAuth({
    baseURL: {
        allowedHosts: [
            "localhost:*",
            "*.bradgarropy.com",
            "*.bradgarropy.workers.dev",
        ],
    },
    database: drizzleAdapter(drizzle(env.DB), {
        provider: "sqlite",
    }),
    emailAndPassword: {
        enabled: true,
    },
    rateLimit: {
        storage: "database",
    },
    secret: env.SESSION_SECRET,
})

export {auth}
