import {z} from "zod"

import {redirectToSchema} from "~/schemas/redirect"

const loginFormSchema = z.object({
    email: z.email({error: "A valid email is required."}),
    password: z
        .string({error: "Password is required."})
        .min(1, "Password is required."),
    redirectTo: redirectToSchema,
})

const signupFormSchema = z
    .object({
        name: z
            .string({error: "Name is required."})
            .trim()
            .min(1, "Name is required.")
            .max(100, "Name must be 100 characters or fewer."),
        email: z.email({error: "A valid email is required."}),
        password: z
            .string({error: "Password is required."})
            .min(1, "Password is required."),
        passwordConfirmation: z
            .string({error: "Password confirmation is required."})
            .min(1, "Password confirmation is required."),
        redirectTo: redirectToSchema,
    })
    .refine(data => data.password === data.passwordConfirmation, {
        error: "Passwords do not match.",
        path: ["passwordConfirmation"],
    })

const updateProfileSchema = z.object({
    intent: z.literal("profile"),
    name: z
        .string({error: "Name is required."})
        .trim()
        .min(1, "Name is required.")
        .max(100, "Name must be 100 characters or fewer."),
})

const changePasswordSchema = z
    .object({
        intent: z.literal("password"),
        currentPassword: z
            .string({error: "Current password is required."})
            .min(1, "Current password is required."),
        newPassword: z
            .string({error: "New password is required."})
            .min(8, "New password must be at least 8 characters."),
        passwordConfirmation: z
            .string({error: "Password confirmation is required."})
            .min(1, "Password confirmation is required."),
    })
    .refine(data => data.newPassword === data.passwordConfirmation, {
        error: "Passwords do not match.",
        path: ["passwordConfirmation"],
    })

const accountActionSchema = z.discriminatedUnion("intent", [
    updateProfileSchema,
    changePasswordSchema,
])

type LoginForm = z.infer<typeof loginFormSchema>
type SignupForm = z.infer<typeof signupFormSchema>
type AccountAction = z.infer<typeof accountActionSchema>

export {accountActionSchema, loginFormSchema, signupFormSchema}
export type {AccountAction, LoginForm, SignupForm}
