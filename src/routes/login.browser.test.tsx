import {cleanup, render, screen} from "@testing-library/react"
import {
    createMemoryRouter,
    RouterContextProvider,
    RouterProvider,
} from "react-router"
import {afterEach, beforeEach, expect, test, vi} from "vitest"

import Login, {action} from "~/routes/login"

import type {Route} from "./+types/login"

const signInEmail = vi.hoisted(() => vi.fn())

vi.mock("~/utils/auth.server", () => ({
    auth: {api: {signInEmail}},
}))

afterEach(cleanup)

beforeEach(() => {
    signInEmail.mockResolvedValue({headers: new Headers()})
})

const submitLogin = (body: URLSearchParams) =>
    action({
        context: new RouterContextProvider(),
        params: {},
        request: new Request("https://example.com/login", {
            body,
            method: "POST",
        }),
        url: new URL("https://example.com/login"),
        pattern: "/login",
    } as Route.ActionArgs)

const renderLogin = (url: string) => {
    const router = createMemoryRouter([{path: "/login", element: <Login />}], {
        initialEntries: [url],
    })

    return render(<RouterProvider router={router} />)
}

test("signs in with validated form data", async () => {
    const response = await submitLogin(
        new URLSearchParams({
            email: "brad@example.com",
            password: "password",
            redirectTo: "/boards/board-1",
        }),
    )

    expect(signInEmail).toHaveBeenCalledExactlyOnceWith({
        body: {email: "brad@example.com", password: "password"},
        headers: expect.any(Headers),
        returnHeaders: true,
    })
    expect((response as Response).headers.get("Location")).toBe(
        "/boards/board-1",
    )
})

test.each([
    {
        body: new URLSearchParams({email: "invalid", password: "password"}),
        error: "A valid email is required.",
    },
    {
        body: new URLSearchParams({email: "brad@example.com"}),
        error: "Password is required.",
    },
])("rejects invalid login form data", async ({body, error}) => {
    expect(await submitLogin(body)).toMatchObject({
        data: {error},
        init: {status: 400},
    })
    expect(signInEmail).not.toHaveBeenCalled()
})

test("defaults an unsafe submitted redirect path", async () => {
    const response = await submitLogin(
        new URLSearchParams({
            email: "brad@example.com",
            password: "password",
            redirectTo: "//example.com",
        }),
    )

    expect((response as Response).headers.get("Location")).toBe("/boards")
})

test("preserves a local redirect path", () => {
    const {container} = renderLogin("/login?redirectTo=%2Fboards%2Fboard-1")

    expect(container.querySelector('input[name="redirectTo"]')).toHaveValue(
        "/boards/board-1",
    )
    expect(screen.getByRole("link", {name: "sign up"})).toHaveAttribute(
        "href",
        "/signup?redirectTo=%2Fboards%2Fboard-1",
    )
})

test.each([
    "/login",
    "/login?redirectTo=https%3A%2F%2Fexample.com",
    "/login?redirectTo=%2F%2Fexample.com",
])("defaults an unsafe or missing redirect path", url => {
    const {container} = renderLogin(url)

    expect(container.querySelector('input[name="redirectTo"]')).toHaveValue(
        "/boards",
    )
    expect(screen.getByRole("link", {name: "sign up"})).toHaveAttribute(
        "href",
        "/signup?redirectTo=%2Fboards",
    )
})
