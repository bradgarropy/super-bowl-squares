import {createCookieSessionStorage} from "@remix-run/node"

import {cookie} from "~/utils/cookie.server"

const {commitSession, destroySession, getSession} = createCookieSessionStorage({
    cookie,
})

export {commitSession, destroySession, getSession}
