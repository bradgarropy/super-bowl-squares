import {drizzleAdapter} from "@better-auth/drizzle-adapter"
import {betterAuth} from "better-auth/minimal"
import {env} from "cloudflare:workers"
import {drizzle} from "drizzle-orm/d1"

import * as schema from "~/db/auth"

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
        schema,
    }),
    emailAndPassword: {
        enabled: true,
    },
    rateLimit: {
        storage: "database",
    },
})

export {auth}
