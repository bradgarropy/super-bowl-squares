import {cleanup, render, screen} from "@testing-library/react"
import {afterEach, expect, test} from "vitest"

import Grid from "~/components/Grid"

afterEach(cleanup)

const teams = {
    away: {
        id: "buf",
        name: "Buffalo Bills",
        abbreviation: "BUF",
        color: "00338D",
        logo: "https://nfl.com/bills.png",
    },
    home: {
        id: "dal",
        name: "Dallas Cowboys",
        abbreviation: "DAL",
        color: "041E42",
        logo: "https://nfl.com/cowboys.png",
    },
}

test("renders a blank 10 by 10 grid", () => {
    render(<Grid teams={teams} winner={null} />)

    expect(
        screen.getByRole("table", {
            name: "Buffalo Bills at Dallas Cowboys squares board",
        }),
    ).toBeTruthy()
    expect(screen.getAllByRole("cell")).toHaveLength(100)
    expect(screen.getByRole("img", {name: "Buffalo Bills"})).toBeTruthy()
    expect(screen.getByRole("img", {name: "Dallas Cowboys"})).toBeTruthy()
    expect(screen.queryByLabelText(/Winning square/)).toBeNull()
})

test("highlights the winning square", () => {
    render(<Grid teams={teams} winner={{row: 7, column: 4}} />)

    expect(
        screen
            .getByLabelText("Winning square: row 7, column 4")
            .getAttribute("class"),
    ).toContain("ring-yellow-400")
})
