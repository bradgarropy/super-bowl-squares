import {cleanup, render, screen} from "@testing-library/react"
import {afterEach, expect, test} from "vitest"

import Scoreboard from "~/components/Scoreboard"
import type {GameDetails} from "~/utils/games"

afterEach(cleanup)

const game: GameDetails = {
    id: "game",
    name: "Buffalo Bills at Dallas Cowboys",
    date: "2026-08-29T01:00:00Z",
    state: "in",
    quarter: 2,
    clock: "2:53",
    score: {away: 17, home: 24},
    quarterScores: [],
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

test("renders the teams, scores, and live status", () => {
    render(<Scoreboard game={game} />)

    expect(
        screen.getByRole("heading", {
            name: "Buffalo Bills at Dallas Cowboys",
        }),
    ).toBeTruthy()
    expect(screen.getByText("BUF")).toBeTruthy()
    expect(screen.getByText("17")).toBeTruthy()
    expect(screen.getByText("24")).toBeTruthy()
    expect(screen.getByText("DAL")).toBeTruthy()
    expect(screen.getByText("Live")).toBeTruthy()
    expect(screen.getByText("Q2 · 2:53")).toBeTruthy()
})

test("renders scheduled and final statuses", () => {
    const {rerender} = render(<Scoreboard game={{...game, state: "pre"}} />)

    expect(screen.getByText("Scheduled")).toBeTruthy()

    rerender(<Scoreboard game={{...game, state: "post"}} />)

    expect(screen.getByText("Final")).toBeTruthy()
})
