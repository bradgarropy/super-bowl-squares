import {createRequestHandler, RouterContextProvider} from "react-router"

import {createDb, dbCtx} from "~/db/client.server"

const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
)

const worker = {
    async fetch(request: Request, env: Env) {
        const ctx = new RouterContextProvider()

        const db = createDb(env.DB)
        ctx.set(dbCtx, db)

        return requestHandler(request, ctx)
    },
} satisfies ExportedHandler<Env>

export default worker
