import bcrypt from "bcryptjs"
import {eq} from "drizzle-orm"
import {Form, redirect} from "react-router"

import {db} from "~/db/client.server"
import {users} from "~/db/schema"
import {commitSession, getSession} from "~/utils/session.server"

import type {Route} from "./+types/signup"

export const action = async ({request}: Route.ActionArgs) => {
    console.log("signup")

    const formData = await request.formData()

    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const passwordConfirmation = formData.get("passwordConfirmation")

    // check if email is already taken
    const existingUser = await db.query.users.findFirst({
        columns: {id: true},
        where: eq(users.email, email),
    })

    if (existingUser) {
        console.log("email already exists")
        throw redirect("/signup")
    }

    // check if password and passwordConfirmation match
    if (password !== passwordConfirmation) {
        console.log("passwords dont match")
        throw redirect("/signup")
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // create user
    const [user] = await db
        .insert(users)
        .values({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        })
        .returning({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
        })

    if (!user) {
        throw new Error("Failed to create user")
    }

    // set session
    const session = await getSession(request.headers.get("Cookie"))
    session.set("user", user)
    const setCookieHeader = await commitSession(session)

    return redirect("/boards", {
        headers: {"Set-Cookie": setCookieHeader},
    })
}

const Signup = () => {
    return (
        <div className="max-w-lg mx-auto">
            <h1 className="mb-10">signup</h1>

            <Form method="post" className="grid gap-y-4">
                <fieldset className="grid grid-cols-2 grid-rows-2 gap-x-10">
                    <div className="grid">
                        <label htmlFor="firstName">first name</label>

                        <input
                            className="text-black"
                            type="text"
                            name="firstName"
                            id="firstName"
                            required
                        />
                    </div>

                    <div className="grid">
                        <label htmlFor="lastName">last name</label>

                        <input
                            className="text-black"
                            type="text"
                            name="lastName"
                            id="lastName"
                            required
                        />
                    </div>
                </fieldset>

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

                <div className="grid">
                    <label htmlFor="passwordConfirmation">
                        confirm password
                    </label>

                    <input
                        className="text-black"
                        type="password"
                        name="passwordConfirmation"
                        id="passwordConfirmation"
                        required
                    />
                </div>

                <button type="submit" className="mt-4 justify-self-end">
                    signup
                </button>
            </Form>
        </div>
    )
}

export default Signup
