import {cleanup, fireEvent, render, screen} from "@testing-library/react"
import {afterEach, expect, test, vi} from "vitest"

import QuarterSelector from "~/components/QuarterSelector"

afterEach(cleanup)

test("shows a message when no quarters are available", () => {
    render(
        <QuarterSelector
            quarters={[]}
            selectedQuarter={null}
            onSelect={() => undefined}
        />,
    )

    expect(screen.getByText("No completed quarters yet.")).toBeTruthy()
})

test("shows the selected quarter and handles another selection", () => {
    const onSelect = vi.fn()

    render(
        <QuarterSelector
            quarters={[1, 2, 3]}
            selectedQuarter={2}
            onSelect={onSelect}
        />,
    )

    expect(
        screen.getByRole("button", {name: "Q2"}).getAttribute("aria-pressed"),
    ).toBe("true")

    fireEvent.click(screen.getByRole("button", {name: "Q1"}))

    expect(onSelect).toHaveBeenCalledWith(1)
})
