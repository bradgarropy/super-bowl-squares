import {createRequestHandler} from "react-router"

const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
)

const worker: ExportedHandler<Env> = {
    async fetch(request) {
        return requestHandler(request)
    },
}

export default worker
