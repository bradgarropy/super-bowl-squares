import {render, screen} from "@testing-library/react"
import {expect, test} from "vitest"

import Grid from "~/components/Grid"
import type {SuperBowl} from "~/utils/espn"

const mockTeams: SuperBowl["teams"] = {
    home: {
        name: "Dallas Cowboys",
        color: "abcdef",
        logo: "https://nfl.com/cowboys/logo.jpg",
    },
    away: {
        name: "Buffalo Bills",
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
