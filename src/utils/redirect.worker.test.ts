import {expect, test} from "vitest"

import {getRedirectTo} from "~/utils/redirect"

test("returns an internal redirect path", () => {
    expect(getRedirectTo("/boards/board-1")).toBe("/boards/board-1")
})

test.each([null, "", "boards/board-1", "https://example.com", "//example.com"])(
    "falls back to the boards page for %j",
    value => {
        expect(getRedirectTo(value)).toBe("/boards")
    },
)

test("falls back when the form value is a file", () => {
    expect(getRedirectTo(new File([], "redirect.txt"))).toBe("/boards")
})
