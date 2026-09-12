import {RouterContextProvider} from "react-router"
import {beforeEach, expect, test, vi} from "vitest"

import {createDb, dbCtx} from "~/db/client.server"
import {action} from "~/routes/games"
import {requireUser} from "~/utils/auth.server"
import {getGame} from "~/utils/games"

vi.mock("~/utils/auth.server", () => ({requireUser: vi.fn()}))
vi.mock("~/utils/games", () => ({getGame: vi.fn()}))

const db = createDb({} as Env["DB"])
const batch = vi.spyOn(db, "batch")
const context = new RouterContextProvider()
context.set(dbCtx, db)

const user = {
    id: "owner-1",
    name: "Brad Garropy",
    email: "brad@example.com",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
}

const team = {
    id: "team-1",
    name: "Team",
    abbreviation: "TEAM",
    color: "000000",
    logo: "",
}

const game = {
    id: "game-1",
    name: "Away at Home",
    date: "2026-09-09T23:00:00Z",
    state: "pre" as const,
    quarter: 0,
    clock: "0:00",
    score: {home: 0, away: 0},
    quarterScores: [],
    teams: {home: team, away: team},
}

const submit = (gameId = game.id) =>
    action({
        request: new Request("https://example.com/games", {
            method: "POST",
            body: new URLSearchParams(gameId ? {gameId} : {}),
        }),
        context,
        params: {},
        url: new URL("https://example.com/games"),
        pattern: "/games",
    })

beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue(user)
    vi.mocked(getGame).mockResolvedValue(game)
    batch.mockResolvedValue([])
})

test("creates the board, owner player, and square assignments in one batch", async () => {
    const response = await submit()

    expect(response).toBeInstanceOf(Response)
    const location = (response as Response).headers.get("Location")
    expect(location).toMatch(/^\/boards\/[\da-f-]{36}$/)
    const boardId = location?.split("/").at(-1)

    expect(batch).toHaveBeenCalledTimes(1)
    const queries = batch.mock.calls[0][0]
    expect(queries).toHaveLength(7)
    const [boardQuery, playerQuery, deleteSquaresQuery, ...squareQueries] =
        queries.map(query =>
            (
                query as unknown as {
                    toSQL: () => {sql: string; params: unknown[]}
                }
            ).toSQL(),
        )
    const playerId = playerQuery.params[0]

    expect(boardQuery.sql).toContain('insert into "board"')
    expect(boardQuery.params).toEqual([boardId, game.id, user.id])
    expect(playerQuery.sql).toContain('insert into "player"')
    expect(playerQuery.params).toEqual([playerId, boardId, user.id, user.name])
    expect(deleteSquaresQuery.sql).toContain('delete from "square"')
    expect(deleteSquaresQuery.params).toEqual([boardId])
    expect(squareQueries).toHaveLength(4)

    for (const squareQuery of squareQueries) {
        expect(squareQuery.sql).toContain('insert into "square"')
        expect(squareQuery.params).toHaveLength(100)

        for (let index = 0; index < squareQuery.params.length; index += 4) {
            expect(squareQuery.params.slice(index, index + 2)).toEqual([
                boardId,
                playerId,
            ])
        }
    }
})

test("does not redirect when the batch fails", async () => {
    batch.mockRejectedValueOnce(new Error("Player insert failed"))
    await expect(submit()).rejects.toThrow("Player insert failed")
})

test("requires authentication before creating anything", async () => {
    const redirect = new Response(null, {status: 302})
    vi.mocked(requireUser).mockRejectedValueOnce(redirect)

    await expect(submit()).rejects.toBe(redirect)
    expect(getGame).not.toHaveBeenCalled()
    expect(batch).not.toHaveBeenCalled()
})

test("rejects a missing game ID without writing records", async () => {
    expect(await submit("")).toMatchObject({
        data: {error: "Game is required."},
        init: {status: 400},
    })
    expect(batch).not.toHaveBeenCalled()
})

test.each(["in", "post"] as const)(
    "rejects a game in the %s state without writing records",
    async state => {
        vi.mocked(getGame).mockResolvedValueOnce({...game, state})

        expect(await submit()).toMatchObject({init: {status: 409}})
        expect(batch).not.toHaveBeenCalled()
    },
)
