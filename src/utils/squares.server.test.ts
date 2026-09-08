import {beforeEach, describe, expect, test, vi} from "vitest"

import {createDb} from "~/db/client.server"
import {shuffleBoard} from "~/utils/squares.server"

const db = createDb({} as Env["DB"])
const batch = vi.spyOn(db, "batch")

const getSql = (query: unknown) => {
    return (
        query as {
            toSQL: () => {sql: string; params: unknown[]}
        }
    ).toSQL()
}

beforeEach(() => {
    batch.mockReset().mockResolvedValue([])
})

describe("shuffleBoard", () => {
    test("replaces the board squares atomically", async () => {
        await shuffleBoard(db, "board-1", ["player-1", "player-2"])

        expect(batch).toHaveBeenCalledTimes(1)

        const queries = batch.mock.calls[0][0]
        const [deleteQuery, ...insertQueries] = queries.map(getSql)

        expect(queries).toHaveLength(5)
        expect(deleteQuery.sql).toContain('delete from "square"')
        expect(deleteQuery.params).toEqual(["board-1"])
        expect(insertQueries).toHaveLength(4)

        const assignments = insertQueries.flatMap(query => {
            expect(query.sql).toContain('insert into "square"')

            return Array.from({length: query.params.length / 4}, (_, index) => {
                const offset = index * 4

                return {
                    boardId: query.params[offset],
                    playerId: query.params[offset + 1],
                    row: query.params[offset + 2],
                    column: query.params[offset + 3],
                }
            })
        })

        expect(assignments).toHaveLength(100)
        expect(assignments.every(({boardId}) => boardId === "board-1")).toBe(
            true,
        )
        expect(
            assignments.filter(({playerId}) => playerId === "player-1"),
        ).toHaveLength(50)
        expect(
            assignments.filter(({playerId}) => playerId === "player-2"),
        ).toHaveLength(50)

        const positions = assignments.map(({row, column}) => `${row}:${column}`)
        expect(new Set(positions)).toHaveLength(100)
    })

    test("clears the board when there are no players", async () => {
        await shuffleBoard(db, "board-1", [])

        expect(batch).toHaveBeenCalledTimes(1)

        const queries = batch.mock.calls[0][0]
        const [deleteQuery] = queries.map(getSql)

        expect(queries).toHaveLength(1)
        expect(deleteQuery.sql).toContain('delete from "square"')
        expect(deleteQuery.params).toEqual(["board-1"])
    })

    test("surfaces database failures", async () => {
        batch.mockRejectedValueOnce(new Error("Square insert failed"))

        await expect(shuffleBoard(db, "board-1", ["player-1"])).rejects.toThrow(
            "Square insert failed",
        )
    })
})
