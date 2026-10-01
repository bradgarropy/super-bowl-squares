import {expect, test} from "vitest"

import {cn} from "~/utils/cn"

test("combines conditional classes and resolves Tailwind conflicts", () => {
    expect(cn("px-2", "block", false, "px-4")).toBe("block px-4")
})
