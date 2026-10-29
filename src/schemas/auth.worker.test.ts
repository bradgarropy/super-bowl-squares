import {expect, test} from "vitest"

import {
    accountActionSchema,
    loginFormSchema,
    signupFormSchema,
} from "~/schemas/auth"

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
            name: " Brad Garropy ",
            email: "brad@example.com",
            password: "password",
            passwordConfirmation: "password",
            redirectTo: "/boards",
        }),
    ).toEqual({
        name: "Brad Garropy",
        email: "brad@example.com",
        password: "password",
        passwordConfirmation: "password",
        redirectTo: "/boards",
    })
})

test("rejects mismatched signup passwords", () => {
    const result = signupFormSchema.safeParse({
        name: "Brad Garropy",
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

test("parses and trims a profile update", () => {
    expect(
        accountActionSchema.parse({intent: "profile", name: " Brad Garropy "}),
    ).toEqual({intent: "profile", name: "Brad Garropy"})
})

test("parses a password change", () => {
    const passwordChange = {
        intent: "password",
        currentPassword: "password",
        newPassword: "new-password",
        passwordConfirmation: "new-password",
    }

    expect(accountActionSchema.parse(passwordChange)).toEqual(passwordChange)
})

test.each([
    {intent: "profile", name: ""},
    {intent: "profile", name: "a".repeat(101)},
    {
        intent: "password",
        currentPassword: "",
        newPassword: "new-password",
        passwordConfirmation: "new-password",
    },
    {
        intent: "password",
        currentPassword: "password",
        newPassword: "short",
        passwordConfirmation: "short",
    },
    {
        intent: "password",
        currentPassword: "password",
        newPassword: "new-password",
        passwordConfirmation: "different-password",
    },
])("rejects invalid account action data", action => {
    expect(accountActionSchema.safeParse(action).success).toBe(false)
})
