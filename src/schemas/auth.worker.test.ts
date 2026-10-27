import {expect, test} from "vitest"

import {loginFormSchema, signupFormSchema} from "~/schemas/auth"

test("parses login form data", () => {
    expect(
        loginFormSchema.parse({
            email: "brad@example.com",
            password: "password",
            redirectTo: "/boards/board-1",
        }),
    ).toEqual({
        email: "brad@example.com",
        password: "password",
        redirectTo: "/boards/board-1",
    })
})

test("rejects invalid login form data", () => {
    expect(
        loginFormSchema.safeParse({
            email: "invalid",
            password: "",
            redirectTo: "/boards",
        }).success,
    ).toBe(false)
})

test("parses signup form data and trims names", () => {
    expect(
        signupFormSchema.parse({
            firstName: " Brad ",
            lastName: " Garropy ",
            email: "brad@example.com",
            password: "password",
            passwordConfirmation: "password",
            redirectTo: "/boards",
        }),
    ).toEqual({
        firstName: "Brad",
        lastName: "Garropy",
        email: "brad@example.com",
        password: "password",
        passwordConfirmation: "password",
        redirectTo: "/boards",
    })
})

test("rejects mismatched signup passwords", () => {
    const result = signupFormSchema.safeParse({
        firstName: "Brad",
        lastName: "Garropy",
        email: "brad@example.com",
        password: "password",
        passwordConfirmation: "different",
        redirectTo: "/boards",
    })

    expect(result.error?.issues[0]).toMatchObject({
        message: "Passwords do not match.",
        path: ["passwordConfirmation"],
    })
})
