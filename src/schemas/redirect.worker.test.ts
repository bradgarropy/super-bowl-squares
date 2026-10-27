import {expect, test} from "vitest"

import {redirectToSchema} from "~/schemas/redirect"

test("accepts local redirect paths", () => {
    expect(redirectToSchema.parse("/boards/board-1")).toBe("/boards/board-1")
})

test.each([
    undefined,
    null,
    "",
    "boards",
    "//example.com",
    new File([], "redirect.txt"),
])("defaults an invalid redirect value to the boards page", value => {
    expect(redirectToSchema.parse(value)).toBe("/boards")
})
