import {cleanup, render, screen, within} from "@testing-library/react"
import {MemoryRouter, RouterContextProvider} from "react-router"
import {afterEach, beforeEach, expect, test, vi} from "vitest"

import {createDb, dbCtx} from "~/db/client.server"
import BoardRoute, {loader} from "~/routes/boards.$id"
import {requireUser} from "~/utils/auth.server"
import {getUserBoard} from "~/utils/boards.server"
import {getGame} from "~/utils/games"

import type {Route} from "./+types/boards.$id"

vi.mock("~/utils/auth.server", () => ({requireUser: vi.fn()}))
vi.mock("~/utils/boards.server", () => ({getUserBoard: vi.fn()}))
vi.mock("~/utils/games", () => ({getGame: vi.fn()}))
vi.mock("~/components/Board", () => ({default: () => <div>Game board</div>}))

afterEach(cleanup)

const db = createDb({} as Env["DB"])
const context = new RouterContextProvider()
context.set(dbCtx, db)

const board = {
    id: "board-1",
    gameId: "game-1",
    ownerId: "owner-1",
    createdAt: "2026-09-02 12:00:00",
    updatedAt: "2026-09-02 12:00:00",
    players: [
        {
            id: "player-1",
            boardId: "board-1",
            userId: "owner-1",
            name: "Owner",
            createdAt: "2026-09-02 12:00:00",
            updatedAt: "2026-09-02 12:00:00",
        },
        {
            id: "player-2",
            boardId: "board-1",
            userId: null,
            name: "Alex",
            createdAt: "2026-09-02 12:00:00",
            updatedAt: "2026-09-02 12:00:00",
        },
    ],
}

const loadBoard = () =>
    loader({
        context,
        params: {id: board.id},
        request: new Request(`https://example.com/boards/${board.id}`),
        url: new URL(`https://example.com/boards/${board.id}`),
        pattern: "/boards/:id",
    })

beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue({
        id: "owner-1",
        name: "Owner",
        email: "owner@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    })
    vi.mocked(getUserBoard).mockResolvedValue(board)
})

test("loads players using the authenticated owner's board query", async () => {
    const result = await loadBoard()

    expect(getUserBoard).toHaveBeenCalledExactlyOnceWith(
        db,
        board.id,
        board.ownerId,
    )
    expect(result.board.players).toEqual(board.players)
    expect(getGame).toHaveBeenCalledExactlyOnceWith(board.gameId)
})

test("returns 404 when the board is missing or not owned by the user", async () => {
    vi.mocked(getUserBoard).mockResolvedValueOnce(undefined)

    await expect(loadBoard()).rejects.toMatchObject({init: {status: 404}})
    expect(getGame).not.toHaveBeenCalled()
})

test("requires authentication before loading players", async () => {
    const redirect = new Response(null, {status: 302})
    vi.mocked(requireUser).mockRejectedValueOnce(redirect)

    await expect(loadBoard()).rejects.toBe(redirect)
    expect(getUserBoard).not.toHaveBeenCalled()
})

const renderBoard = (players = board.players) => {
    const props = {
        loaderData: {board: {...board, players}, game: {id: board.gameId}},
    } as Route.ComponentProps

    render(
        <MemoryRouter>
            <BoardRoute {...props} />
        </MemoryRouter>,
    )
}

test("shows names for both account holders and guests", () => {
    renderBoard()

    const players = screen.getByRole("region", {name: "Players"})
    expect(within(players).getAllByRole("listitem")).toHaveLength(2)
    expect(within(players).getByText("Owner")).toBeInTheDocument()
    expect(within(players).getByText("Alex")).toBeInTheDocument()
})

test("shows an empty state for boards without players", () => {
    renderBoard([])

    expect(screen.getByText("No players yet.")).toBeInTheDocument()
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
})
