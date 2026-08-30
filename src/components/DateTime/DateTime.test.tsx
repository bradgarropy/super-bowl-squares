import {cleanup, render, screen} from "@testing-library/react"
import {afterEach, expect, test} from "vitest"

import DateTime from "~/components/DateTime"
import {formatDateTime} from "~/utils/date"

afterEach(cleanup)

test("renders a localized date and time", async () => {
    const date = "2026-08-29T01:00:00Z"
    const {container} = render(<DateTime date={date} className="custom" />)
    const time = container.querySelector("time")

    expect(time?.getAttribute("datetime")).toBe(date)
    expect(time?.getAttribute("class")).toContain("custom")
    expect(await screen.findByText(formatDateTime(new Date(date)))).toBeTruthy()
})
