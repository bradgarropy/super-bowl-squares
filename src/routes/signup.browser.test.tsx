import {cleanup, render} from "@testing-library/react"
import {
    createMemoryRouter,
    RouterContextProvider,
    RouterProvider,
} from "react-router"
import {afterEach, beforeEach, expect, test, vi} from "vitest"

import Signup, {action} from "~/routes/signup"

import type {Route} from "./+types/signup"

const signUpEmail = vi.hoisted(() => vi.fn())

vi.mock("~/utils/auth.server", () => ({
    auth: {api: {signUpEmail}},
}))

afterEach(cleanup)

beforeEach(() => {
    signUpEmail.mockResolvedValue({headers: new Headers()})
})

const submitSignup = (body: URLSearchParams) =>
    action({
        context: new RouterContextProvider(),
        params: {},
        request: new Request("https://example.com/signup", {
            body,
            method: "POST",
        }),
        url: new URL("https://example.com/signup"),
        pattern: "/signup",
    } as Route.ActionArgs)

const renderSignup = (url: string) => {
    const router = createMemoryRouter(
        [{path: "/signup", element: <Signup />}],
        {
            initialEntries: [url],
        },
    )

    return render(<RouterProvider router={router} />)
}

const validSignup = {
    email: "brad@example.com",
    name: " Brad Garropy ",
    password: "password",
    passwordConfirmation: "password",
    redirectTo: "/boards/board-1",
}

test("signs up with validated form data", async () => {
    const response = await submitSignup(new URLSearchParams(validSignup))

    expect(signUpEmail).toHaveBeenCalledExactlyOnceWith({
        body: {
            email: "brad@example.com",
            name: "Brad Garropy",
            password: "password",
        },
        headers: expect.any(Headers),
        returnHeaders: true,
    })
    expect((response as Response).headers.get("Location")).toBe(
        "/boards/board-1",
    )
})

test.each([
    {field: "name", error: "Name is required."},
    {field: "password", error: "Password is required."},
    {
        field: "passwordConfirmation",
        error: "Password confirmation is required.",
    },
])("rejects signup data without $field", async ({field, error}) => {
    const body = new URLSearchParams(validSignup)
    body.delete(field)

    expect(await submitSignup(body)).toMatchObject({
        data: {error},
        init: {status: 400},
    })
    expect(signUpEmail).not.toHaveBeenCalled()
})

test("rejects an invalid email", async () => {
    const body = new URLSearchParams({...validSignup, email: "invalid"})

    expect(await submitSignup(body)).toMatchObject({
        data: {error: "A valid email is required."},
        init: {status: 400},
    })
    expect(signUpEmail).not.toHaveBeenCalled()
})

test("rejects mismatched passwords", async () => {
    const body = new URLSearchParams({
        ...validSignup,
        passwordConfirmation: "different",
    })

    expect(await submitSignup(body)).toMatchObject({
        data: {error: "Passwords do not match."},
        init: {status: 400},
    })
    expect(signUpEmail).not.toHaveBeenCalled()
})

test("defaults an unsafe submitted redirect path", async () => {
    const response = await submitSignup(
        new URLSearchParams({...validSignup, redirectTo: "//example.com"}),
    )

    expect((response as Response).headers.get("Location")).toBe("/boards")
})

test("preserves a local redirect path", () => {
    const {container} = renderSignup("/signup?redirectTo=%2Fboards%2Fboard-1")

    expect(container.querySelector('input[name="redirectTo"]')).toHaveValue(
        "/boards/board-1",
    )
})

test.each([
    "/signup",
    "/signup?redirectTo=https%3A%2F%2Fexample.com",
    "/signup?redirectTo=%2F%2Fexample.com",
])("defaults an unsafe or missing redirect path", url => {
    const {container} = renderSignup(url)

    expect(container.querySelector('input[name="redirectTo"]')).toHaveValue(
        "/boards",
    )
})
