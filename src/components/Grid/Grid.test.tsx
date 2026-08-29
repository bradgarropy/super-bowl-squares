import {render, screen} from "@testing-library/react"
import {expect, test} from "vitest"

import Grid from "~/components/Grid"
import type {Game} from "~/utils/games"

const mockTeams: Game["teams"] = {
    home: {
        id: "dal",
        name: "Dallas Cowboys",
        abbreviation: "DAL",
        color: "abcdef",
        logo: "https://nfl.com/cowboys/logo.jpg",
    },
    away: {
        id: "buf",
        name: "Buffalo Bills",
        abbreviation: "BUF",
        color: "123456",
        logo: "https://nfl.com/bills/logo.jpg",
    },
}

const mockSquares = ["Brad", "Gaby", "Matt", "Yarib"]

test("renders", () => {
    render(<Grid teams={mockTeams} squares={mockSquares} />)
    expect(screen.getByText("Dallas Cowboys"))
    expect(screen.getByText("Buffalo Bills"))
})
