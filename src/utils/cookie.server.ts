import {createCookie} from "@remix-run/node"

const cookie = createCookie("session", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET ?? ""],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
})

export {cookie}
