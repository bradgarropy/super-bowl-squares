import {isAPIError} from "better-auth/api"
import {
    data,
    Form,
    Link,
    redirect,
    useActionData,
    useSearchParams,
} from "react-router"

import {auth} from "~/utils/auth.server"
import {getRedirectTo} from "~/utils/redirect"

import type {Route} from "./+types/login"

export const action = async ({request}: Route.ActionArgs) => {
    const formData = await request.formData()

    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")
    const redirectTo = getRedirectTo(formData.get("redirectTo"))

    try {
        const {headers} = await auth.api.signInEmail({
            body: {email, password},
            headers: request.headers,
            returnHeaders: true,
        })

        return redirect(redirectTo, {headers})
    } catch (error) {
        if (isAPIError(error)) {
            return data(
                {error: error.body?.message ?? "Unable to log in."},
                {status: error.statusCode},
            )
        }

        throw error
    }
}

const Login = () => {
    const actionData = useActionData<typeof action>()
    const [searchParams] = useSearchParams()
    const redirectTo = searchParams.get("redirectTo") ?? "/boards"

    return (
        <div className="max-w-lg mx-auto">
            <h1 className="mb-10">login</h1>

            <Form method="post" className="grid gap-y-4">
                <input type="hidden" name="redirectTo" value={redirectTo} />

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

                <button type="submit" className="mt-4 justify-self-end">
                    login
                </button>

                {actionData?.error ? (
                    <p role="alert">{actionData.error}</p>
                ) : null}
            </Form>

            <p className="mt-10 text-center">
                Or{" "}
                <Link
                    to={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`}
                    className="underline"
                >
                    sign up
                </Link>{" "}
                if you do not have an account.
            </p>
        </div>
    )
}

export default Login
