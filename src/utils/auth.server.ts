import {redirect} from "@remix-run/node"

import {getSession} from "~/utils/session.server"

const requireUser = async (request: Request) => {
    const session = await getSession(request.headers.get("Cookie"))
    const user = session.get("user")

    if (!user) {
        throw redirect("/login")
    }

    return user
}

export {requireUser}
