import {createCookieSessionStorage} from "@remix-run/node"

const storage = createCookieSessionStorage({
    cookie: {
        httpOnly: true,
        name: "__session",
        path: "/",
        secrets: [process.env.SESSION_SECRET],
        sameSite: "lax",
    },
})
