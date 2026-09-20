import {isAPIError} from "better-auth/api"
import {
    data,
    Form,
    redirect,
    useActionData,
    useSearchParams,
} from "react-router"

import {auth} from "~/utils/auth.server"
import {getRedirectTo} from "~/utils/redirect"

import type {Route} from "./+types/signup"

export const action = async ({request}: Route.ActionArgs) => {
    const formData = await request.formData()

    const firstName = String(formData.get("firstName") ?? "")
    const lastName = String(formData.get("lastName") ?? "")
    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")
    const passwordConfirmation = String(
        formData.get("passwordConfirmation") ?? "",
    )
    const redirectTo = getRedirectTo(formData.get("redirectTo"))

    if (password !== passwordConfirmation) {
        return data({error: "Passwords do not match."}, {status: 400})
    }

    try {
        const {headers} = await auth.api.signUpEmail({
            body: {
                email,
                name: `${firstName} ${lastName}`,
                password,
            },
            headers: request.headers,
            returnHeaders: true,
        })

        return redirect(redirectTo, {headers})
    } catch (error) {
        if (isAPIError(error)) {
            return data(
                {error: error.body?.message ?? "Unable to create account."},
                {status: error.statusCode},
            )
        }

        throw error
    }
}

const Signup = () => {
    const actionData = useActionData<typeof action>()
    const [searchParams] = useSearchParams()
    const redirectTo = searchParams.get("redirectTo") ?? "/boards"

    return (
        <div className="max-w-lg mx-auto">
            <h1 className="mb-10">signup</h1>

            <Form method="post" className="grid gap-y-4">
                <input type="hidden" name="redirectTo" value={redirectTo} />

                <fieldset className="grid grid-cols-2 grid-rows-2 gap-x-10">
                    <div className="grid">
                        <label htmlFor="firstName">first name</label>

                        <input
                            className="bg-white text-black"
                            type="text"
                            name="firstName"
                            id="firstName"
                            required
                        />
                    </div>

                    <div className="grid">
                        <label htmlFor="lastName">last name</label>

                        <input
                            className="bg-white text-black"
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
                        className="bg-white text-black"
                        type="email"
                        name="email"
                        id="email"
                        required
                    />
                </div>

                <div className="grid">
                    <label htmlFor="password">password</label>

                    <input
                        className="bg-white text-black"
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
                        className="bg-white text-black"
                        type="password"
                        name="passwordConfirmation"
                        id="passwordConfirmation"
                        required
                    />
                </div>

                <button type="submit" className="mt-4 justify-self-end">
                    signup
                </button>

                {actionData?.error ? (
                    <p role="alert">{actionData.error}</p>
                ) : null}
            </Form>
        </div>
    )
}

export default Signup
