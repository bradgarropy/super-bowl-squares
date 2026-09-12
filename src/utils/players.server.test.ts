import {beforeEach, describe, expect, test, vi} from "vitest"

import {createDb} from "~/db/client.server"
import {addPlayer, removePlayer} from "~/utils/players.server"

const db = createDb({} as Env["DB"])
const batch = vi.spyOn(db, "batch")
const board = {
    id: "board-1",
    players: [{id: "player-1"}, {id: "player-2"}],
}

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

describe("addPlayer", () => {
    test("adds the player and reshuffles in one batch", async () => {
        await addPlayer(db, board, "Alex")

        expect(batch).toHaveBeenCalledTimes(1)

        const queries = batch.mock.calls[0][0].map(getSql)
        const [insertPlayer, deleteSquares, ...insertSquares] = queries
        const newPlayerId = insertPlayer.params[0]

        expect(queries).toHaveLength(6)
        expect(insertPlayer.sql).toContain('insert into "player"')
        expect(insertPlayer.params).toEqual([newPlayerId, "board-1", "Alex"])
        expect(newPlayerId).toEqual(expect.any(String))
        expect(deleteSquares.sql).toContain('delete from "square"')
        expect(deleteSquares.params).toEqual(["board-1"])
        expect(insertSquares).toHaveLength(4)

        const playerIds = insertSquares.flatMap(query =>
            query.params.filter((_, index) => index % 4 === 1),
        )
        const counts = ["player-1", "player-2", newPlayerId]
            .map(playerId => playerIds.filter(id => id === playerId).length)
            .sort()

        expect(playerIds).toHaveLength(100)
        expect(counts).toEqual([33, 33, 34])
    })

    test("surfaces database failures", async () => {
        batch.mockRejectedValueOnce(new Error("Player insert failed"))

        await expect(addPlayer(db, board, "Alex")).rejects.toThrow(
            "Player insert failed",
        )
    })
})

describe("removePlayer", () => {
    test("removes the player and reshuffles in one batch", async () => {
        await removePlayer(db, board, "player-2")

        expect(batch).toHaveBeenCalledTimes(1)

        const queries = batch.mock.calls[0][0].map(getSql)
        const [deletePlayer, deleteSquares, ...insertSquares] = queries

        expect(queries).toHaveLength(6)
        expect(deletePlayer.sql).toContain('delete from "player"')
        expect(deletePlayer.params).toEqual(["player-2", "board-1"])
        expect(deleteSquares.sql).toContain('delete from "square"')
        expect(deleteSquares.params).toEqual(["board-1"])
        expect(insertSquares).toHaveLength(4)

        const playerIds = insertSquares.flatMap(query =>
            query.params.filter((_, index) => index % 4 === 1),
        )

        expect(playerIds).toHaveLength(100)
        expect(playerIds.every(id => id === "player-1")).toBe(true)
    })

    test("clears the squares when removing the last player", async () => {
        await removePlayer(
            db,
            {id: "board-1", players: [{id: "player-1"}]},
            "player-1",
        )

        const queries = batch.mock.calls[0][0].map(getSql)

        expect(queries).toHaveLength(2)
        expect(queries[0].sql).toContain('delete from "player"')
        expect(queries[1].sql).toContain('delete from "square"')
    })

    test("surfaces database failures", async () => {
        batch.mockRejectedValueOnce(new Error("Player deletion failed"))

        await expect(removePlayer(db, board, "player-1")).rejects.toThrow(
            "Player deletion failed",
        )
    })
})
