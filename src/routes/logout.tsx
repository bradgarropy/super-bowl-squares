import {redirect} from "react-router"

import {auth} from "~/utils/auth.server"

import type {Route} from "./+types/logout"

export const action = async ({request}: Route.ActionArgs) => {
    const {headers} = await auth.api.signOut({
        headers: request.headers,
        returnHeaders: true,
    })

    return redirect("/", {headers})
}
