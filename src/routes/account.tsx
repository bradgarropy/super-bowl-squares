import {requireUser} from "~/utils/auth.server"

import type {Route} from "./+types/account"

export const loader = async ({request}: Route.LoaderArgs) => {
    const user = await requireUser(request)

    return {user}
}

const Route = () => {
    return <h1>account</h1>
}

export default Route
