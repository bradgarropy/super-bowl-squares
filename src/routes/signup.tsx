import type {ActionFunctionArgs} from "@remix-run/node"
import {Form, redirect} from "@remix-run/react"

export const action = async ({request}: ActionFunctionArgs) => {
    console.log("signup")

    const formData = await request.formData()

    const firstName = formData.get("firstName")
    const lastName = formData.get("lastName")
    const email = formData.get("email")
    const password = formData.get("password")
    const passwordConfirmation = formData.get("passwordConfirmation")

    console.log({firstName, lastName, email, password, passwordConfirmation})

    // check if email is already taken
    // TODO

    // check if password and passwordConfirmation match
    if (password !== passwordConfirmation) {
        console.log("passwords dont match")
        return redirect("/signup")
    }

    // create user
    // TODO

    return redirect("/boards")
}

const Route = () => {
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

export default Route
