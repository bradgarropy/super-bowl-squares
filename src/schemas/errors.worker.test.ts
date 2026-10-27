import {expect, test} from "vitest"
import {z, ZodError} from "zod"

import {getErrorMessage} from "~/schemas/errors"

test("returns the first validation issue", () => {
    const result = z
        .object({name: z.string().min(1, "Name is required.")})
        .safeParse({name: ""})

    if (result.success) {
        throw new Error("Expected validation to fail")
    }

    expect(getErrorMessage(result.error)).toBe("Name is required.")
})

test("returns a fallback when the error has no issues", () => {
    expect(getErrorMessage(new ZodError([]))).toBe("Invalid form data.")
})
