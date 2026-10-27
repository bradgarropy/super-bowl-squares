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
        firstName: z.string().trim().min(1, "First name is required."),
        lastName: z.string().trim().min(1, "Last name is required."),
        email: z.email({error: "A valid email is required."}),
        password: z.string().min(1, "Password is required."),
        passwordConfirmation: z
            .string()
            .min(1, "Password confirmation is required."),
        redirectTo: redirectToSchema,
    })
    .refine(data => data.password === data.passwordConfirmation, {
        error: "Passwords do not match.",
        path: ["passwordConfirmation"],
    })

type LoginForm = z.infer<typeof loginFormSchema>
type SignupForm = z.infer<typeof signupFormSchema>

export {loginFormSchema, signupFormSchema}
export type {LoginForm, SignupForm}
