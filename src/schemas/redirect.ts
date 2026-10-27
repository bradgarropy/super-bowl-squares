import {z} from "zod"

const redirectToSchema = z
    .string()
    .refine(value => value.startsWith("/") && !value.startsWith("//"), {
        error: "Redirect must be a local path.",
    })
    .catch("/boards")

type RedirectTo = z.infer<typeof redirectToSchema>

export {redirectToSchema}
export type {RedirectTo}
