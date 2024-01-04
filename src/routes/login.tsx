import type {ActionFunctionArgs} from "@remix-run/node"
import {Form, redirect} from "@remix-run/react"

export const action = async ({request}: ActionFunctionArgs) => {
    console.log("login")
    const formData = await request.formData()

    const email = formData.get("email")
    const password = formData.get("password")

    console.log({email, password})

    // look up user by email
    // check to see if password matches
    // TODO

    return redirect("/boards")
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
        </div>
    )
}

export default Route
