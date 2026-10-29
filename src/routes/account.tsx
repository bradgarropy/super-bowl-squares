import {isAPIError} from "better-auth/api"
import {data, Form, useActionData} from "react-router"

import {accountActionSchema} from "~/schemas/auth"
import {getErrorMessage} from "~/schemas/errors"
import {auth, requireUser} from "~/utils/auth.server"

import type {Route} from "./+types/account"

export const loader = async ({request}: Route.LoaderArgs) => {
    const user = await requireUser(request)

    return {user}
}

export const action = async ({request}: Route.ActionArgs) => {
    await requireUser(request)

    const formData = await request.formData()
    const result = accountActionSchema.safeParse(Object.fromEntries(formData))

    if (!result.success) {
        return data({error: getErrorMessage(result.error)}, {status: 400})
    }

    try {
        if (result.data.intent === "profile") {
            const {headers} = await auth.api.updateUser({
                body: {name: result.data.name},
                headers: request.headers,
                returnHeaders: true,
            })

            return data(
                {intent: "profile", message: "Profile updated."} as const,
                {headers},
            )
        }

        await auth.api.changePassword({
            body: {
                currentPassword: result.data.currentPassword,
                newPassword: result.data.newPassword,
            },
            headers: request.headers,
        })

        return {intent: "password", message: "Password changed."} as const
    } catch (error) {
        if (isAPIError(error)) {
            return data(
                {error: error.body?.message ?? "Unable to update account."},
                {status: error.statusCode},
            )
        }

        throw error
    }
}

const Account = ({loaderData}: Route.ComponentProps) => {
    const actionData = useActionData<typeof action>()
    const {user} = loaderData

    return (
        <main className="mx-auto grid max-w-lg gap-10">
            <h1 className="text-2xl font-bold">Account</h1>

            {actionData && "error" in actionData ? (
                <p role="alert">{actionData.error}</p>
            ) : null}

            <section className="grid gap-4">
                <h2 className="text-xl font-semibold">Profile</h2>

                <Form method="post" className="grid gap-4">
                    <input type="hidden" name="intent" value="profile" />

                    <div className="grid">
                        <label htmlFor="name">name</label>
                        <input
                            className="bg-white text-black"
                            type="text"
                            name="name"
                            id="name"
                            defaultValue={user.name}
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="grid">
                        <label htmlFor="email">email</label>
                        <input
                            className="bg-white text-black disabled:opacity-70"
                            type="email"
                            id="email"
                            value={user.email}
                            disabled
                        />
                    </div>

                    <button type="submit" className="justify-self-end">
                        Save profile
                    </button>

                    {actionData &&
                    "intent" in actionData &&
                    actionData.intent === "profile" ? (
                        <p role="status">{actionData.message}</p>
                    ) : null}
                </Form>
            </section>

            <section className="grid gap-4">
                <h2 className="text-xl font-semibold">Change password</h2>

                <Form method="post" className="grid gap-4">
                    <input type="hidden" name="intent" value="password" />

                    <div className="grid">
                        <label htmlFor="currentPassword">
                            current password
                        </label>
                        <input
                            className="bg-white text-black"
                            type="password"
                            name="currentPassword"
                            id="currentPassword"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <div className="grid">
                        <label htmlFor="newPassword">new password</label>
                        <input
                            className="bg-white text-black"
                            type="password"
                            name="newPassword"
                            id="newPassword"
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />
                    </div>

                    <div className="grid">
                        <label htmlFor="passwordConfirmation">
                            confirm new password
                        </label>
                        <input
                            className="bg-white text-black"
                            type="password"
                            name="passwordConfirmation"
                            id="passwordConfirmation"
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />
                    </div>

                    <button type="submit" className="justify-self-end">
                        Change password
                    </button>

                    {actionData &&
                    "intent" in actionData &&
                    actionData.intent === "password" ? (
                        <p role="status">{actionData.message}</p>
                    ) : null}
                </Form>
            </section>
        </main>
    )
}

export default Account
