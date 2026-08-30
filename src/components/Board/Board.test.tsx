import {cleanup, fireEvent, render, screen} from "@testing-library/react"
import {afterEach, expect, test} from "vitest"

import Board from "~/components/Board"
import type {GameDetails} from "~/utils/games"

afterEach(cleanup)

const game: GameDetails = {
    id: "game",
    name: "Buffalo Bills at Dallas Cowboys",
    date: "2026-08-29T00:00:00Z",
    state: "post",
    quarter: 4,
    clock: "0:00",
    score: {away: 17, home: 24},
    quarterScores: [
        {quarter: 1, away: 7, home: 10},
        {quarter: 2, away: 17, home: 24},
    ],
    teams: {
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
    },
}

test("selects the latest quarter and highlights its winning square", () => {
    render(<Board game={game} />)

    expect(
        screen.getByRole("button", {name: "Q2"}).getAttribute("aria-pressed"),
    ).toBe("true")
    expect(
        screen
            .getByLabelText("Winning square: row 7, column 4")
            .getAttribute("class"),
    ).toContain("ring-yellow-400")
})

test("selects another quarter", () => {
    render(<Board game={game} />)

    fireEvent.click(screen.getByRole("button", {name: "Q1"}))

    expect(
        screen.getByRole("button", {name: "Q1"}).getAttribute("aria-pressed"),
    ).toBe("true")
    expect(
        screen.getByLabelText("Winning square: row 7, column 0"),
    ).toBeTruthy()
})

test("shows a blank board before a quarter is completed", () => {
    render(
        <Board
            game={{
                ...game,
                state: "pre",
                quarter: 0,
                score: {away: 0, home: 0},
                quarterScores: [],
            }}
        />,
    )

    expect(screen.getByText("No completed quarters yet.")).toBeTruthy()
    expect(screen.getAllByRole("cell")).toHaveLength(100)
})

test("shows live game status between the scores", () => {
    render(
        <Board
            game={{
                ...game,
                state: "in",
                quarter: 2,
                clock: "2:53",
            }}
        />,
    )

    expect(screen.getByText("Live")).toBeTruthy()
    expect(screen.getByText("Q2 · 2:53")).toBeTruthy()
})
