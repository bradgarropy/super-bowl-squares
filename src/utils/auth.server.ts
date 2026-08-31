import {drizzleAdapter} from "@better-auth/drizzle-adapter"
import {betterAuth} from "better-auth/minimal"
import {env} from "cloudflare:workers"
import {drizzle} from "drizzle-orm/d1"
import {redirect} from "react-router"

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

const requireUser = async (request: Request) => {
    const session = await auth.api.getSession({headers: request.headers})

    if (!session) {
        throw redirect("/login")
    }

    return session.user
}

export {auth, requireUser}
