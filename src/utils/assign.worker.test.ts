import {describe, expect, test} from "vitest"

import {assignSquares} from "~/utils/assign"

describe("assignSquares", () => {
    test("returns no assignments when there are no players", () => {
        expect(assignSquares([])).toEqual([])
    })

    test("assigns every square to the only player", () => {
        const assignments = assignSquares(["player-1"])

        expect(assignments).toHaveLength(100)
        expect(assignments.every(({playerId}) => playerId === "player-1")).toBe(
            true,
        )
    })

    test("distributes squares as evenly as possible", () => {
        const assignments = assignSquares(["player-1", "player-2", "player-3"])
        const counts = Object.groupBy(
            assignments,
            assignment => assignment.playerId,
        )

        expect(
            Object.values(counts)
                .map(assignments => assignments?.length ?? 0)
                .sort(),
        ).toEqual([33, 33, 34])
    })

    test("does not change the player list", () => {
        const playerIds = ["player-1", "player-2", "player-3"]

        assignSquares(playerIds)

        expect(playerIds).toEqual(["player-1", "player-2", "player-3"])
    })

    test("returns every board position exactly once", () => {
        const assignments = assignSquares(["player-1", "player-2"])
        const positions = assignments.map(({row, column}) => `${row}:${column}`)

        expect(new Set(positions)).toHaveLength(100)
        expect(assignments).toContainEqual({
            playerId: expect.any(String),
            row: 0,
            column: 0,
        })
        expect(assignments).toContainEqual({
            playerId: expect.any(String),
            row: 9,
            column: 9,
        })
    })

    test("rejects more players than available squares", () => {
        const playerIds = Array.from(
            {length: 101},
            (_, index) => `player-${index}`,
        )

        expect(() => assignSquares(playerIds)).toThrow(
            "A board cannot have more than 100 players",
        )
    })
})
