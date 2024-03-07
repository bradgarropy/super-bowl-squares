import type {ActionFunctionArgs} from "@remix-run/node"
import {Form, Link, redirect} from "@remix-run/react"
import bcrypt from "bcryptjs"

import {db} from "~/utils/prisma"
import {commitSession, getSession} from "~/utils/session.server"

export const action = async ({request}: ActionFunctionArgs) => {
    console.log("login")

    const formData = await request.formData()

    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // look up user by email
    const user = await db.user.findFirst({
        where: {email},
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            password: true,
        },
    })

    if (!user) {
        console.log("user does not exist")
        throw redirect("/login")
    }

    // check to see if password matches
    const matches = await bcrypt.compare(password, user.password)

    if (!matches) {
        console.log("incorrect password")
        throw redirect("/login")
    }

    const session = await getSession(request.headers.get("Cookie"))

    session.set("user", {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
    })

    const setCookieHeader = await commitSession(session)
    return redirect("/boards", {headers: {"Set-Cookie": setCookieHeader}})
}

const Route = () => {
    return (
        <div className="max-w-lg mx-auto">
            <h1 className="mb-10">login</h1>

            <Form method="post" className="grid gap-y-4">
                <div className="grid">
                    <label htmlFor="email">email</label>

                    <input
                        className="text-black"
                        type="email"
                        name="email"
                        id="email"
                        required
                    />
                </div>

                <div className="grid">
                    <label htmlFor="password">password</label>

                    <input
                        className="text-black"
                        type="password"
                        name="password"
                        id="password"
                        required
                    />
                </div>

                <button type="submit" className="mt-4 justify-self-end">
                    login
                </button>
            </Form>

            <p className="mt-10 text-center">
                Or{" "}
                <Link to="/signup" className="underline">
                    sign up
                </Link>{" "}
                if you do not have an account.
            </p>
        </div>
    )
}

export default Route
