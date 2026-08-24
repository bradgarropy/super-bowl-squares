import {redirect} from "react-router"

import {destroySession, getSession} from "~/utils/session.server"

import type {Route} from "./+types/logout"

export const action = async ({request}: Route.ActionArgs) => {
    const session = await getSession(request.headers.get("Cookie"))
    const setCookieHeader = await destroySession(session)
    console.log(setCookieHeader)

    return redirect("/", {
        headers: {
            "Set-Cookie": setCookieHeader,
        },
    })
}
