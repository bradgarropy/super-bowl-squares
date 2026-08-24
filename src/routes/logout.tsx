import type {ActionFunctionArgs} from "react-router"
import {redirect} from "react-router"

import {destroySession, getSession} from "~/utils/session.server"

export const action = async ({request}: ActionFunctionArgs) => {
    const session = await getSession(request.headers.get("Cookie"))
    const setCookieHeader = await destroySession(session)
    console.log(setCookieHeader)

    return redirect("/", {
        headers: {
            "Set-Cookie": setCookieHeader,
        },
    })
}
