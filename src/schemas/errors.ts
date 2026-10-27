import type {ZodError} from "zod"

const getErrorMessage = (error: ZodError) => {
    return error.issues[0]?.message ?? "Invalid form data."
}

export {getErrorMessage}
