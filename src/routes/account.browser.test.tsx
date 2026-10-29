import {cleanup, render, screen} from "@testing-library/react"
import {
    createMemoryRouter,
    RouterContextProvider,
    RouterProvider,
} from "react-router"
import {afterEach, beforeEach, expect, test, vi} from "vitest"

import Account, {action} from "~/routes/account"

import type {Route} from "./+types/account"

const changePassword = vi.hoisted(() => vi.fn())
const requireUser = vi.hoisted(() => vi.fn())
const updateUser = vi.hoisted(() => vi.fn())

vi.mock("~/utils/auth.server", () => ({
    auth: {api: {changePassword, updateUser}},
    requireUser,
}))

afterEach(cleanup)

beforeEach(() => {
    changePassword.mockResolvedValue({})
    requireUser.mockResolvedValue({id: "user-1"})
    updateUser.mockResolvedValue({headers: new Headers()})
})

const submitAccount = (body: URLSearchParams) =>
    action({
        context: new RouterContextProvider(),
        params: {},
        request: new Request("https://example.com/account", {
            body,
            method: "POST",
        }),
        url: new URL("https://example.com/account"),
        pattern: "/account",
    } as Route.ActionArgs)

test("updates the user's name", async () => {
    await submitAccount(
        new URLSearchParams({intent: "profile", name: " Brad Garropy "}),
    )

    expect(updateUser).toHaveBeenCalledExactlyOnceWith({
        body: {name: "Brad Garropy"},
        headers: expect.any(Headers),
        returnHeaders: true,
    })
})

test("changes the user's password", async () => {
    await submitAccount(
        new URLSearchParams({
            intent: "password",
            currentPassword: "password",
            newPassword: "new-password",
            passwordConfirmation: "new-password",
        }),
    )

    expect(changePassword).toHaveBeenCalledExactlyOnceWith({
        body: {
            currentPassword: "password",
            newPassword: "new-password",
        },
        headers: expect.any(Headers),
    })
})

test("rejects invalid account data", async () => {
    expect(
        await submitAccount(new URLSearchParams({intent: "profile", name: ""})),
    ).toMatchObject({
        data: {error: "Name is required."},
        init: {status: 400},
    })
    expect(updateUser).not.toHaveBeenCalled()
})

test("renders the account information and password form", () => {
    const loaderData = {
        user: {
            id: "user-1",
            name: "Brad Garropy",
            email: "brad@example.com",
            emailVerified: false,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    }
    const props = {loaderData} as Route.ComponentProps
    const router = createMemoryRouter(
        [{path: "/account", element: <Account {...props} />}],
        {initialEntries: ["/account"]},
    )

    render(<RouterProvider router={router} />)

    expect(screen.getByRole("heading", {name: "Account"})).toBeTruthy()
    expect(screen.getByLabelText("name")).toHaveValue("Brad Garropy")
    expect(screen.getByLabelText("email")).toHaveValue("brad@example.com")
    expect(screen.getByLabelText("email")).toBeDisabled()
    expect(screen.getByRole("button", {name: "Change password"})).toBeTruthy()
})
