import {cleanup, render, screen} from "@testing-library/react"
import {
    createMemoryRouter,
    RouterContextProvider,
    RouterProvider,
} from "react-router"
import {afterEach, beforeEach, expect, test, vi} from "vitest"

import {createDb, dbCtx} from "~/db/client.server"
import BoardWelcome, {loader} from "~/routes/boards.$id.welcome"
import {getUser} from "~/utils/auth.server"
import {getBoard} from "~/utils/boards.server"
import type {GameDetails} from "~/utils/games"
import {getGame} from "~/utils/games"

import type {Route} from "./+types/boards.$id.welcome"

vi.mock("~/utils/auth.server", () => ({getUser: vi.fn()}))
vi.mock("~/utils/boards.server", () => ({getBoard: vi.fn()}))
vi.mock("~/utils/games", () => ({getGame: vi.fn()}))

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
            name: "Brad",
            createdAt: "2026-09-02 12:00:00",
            updatedAt: "2026-09-02 12:00:00",
        },
    ],
    squares: [],
}

const game: GameDetails = {
    id: "game-1",
    name: "Buffalo Bills at Dallas Cowboys",
    date: "2026-09-20T00:00:00Z",
    state: "pre",
    quarter: 0,
    clock: "0:00",
    score: {away: 0, home: 0},
    quarterScores: [],
    teams: {
        away: {
            id: "buf",
            name: "Buffalo Bills",
            abbreviation: "BUF",
            color: "00338D",
            logo: "https://example.com/buf.png",
        },
        home: {
            id: "dal",
            name: "Dallas Cowboys",
            abbreviation: "DAL",
            color: "041E42",
            logo: "https://example.com/dal.png",
        },
    },
}

const loadWelcome = () =>
    loader({
        context,
        params: {id: board.id},
        request: new Request(`https://example.com/boards/${board.id}/welcome`),
        url: new URL(`https://example.com/boards/${board.id}/welcome`),
        pattern: "/boards/:id/welcome",
    })

beforeEach(() => {
    vi.mocked(getUser).mockResolvedValue(null)
    vi.mocked(getBoard).mockResolvedValue(board)
    vi.mocked(getGame).mockResolvedValue(game)
})

test("loads the inviter and game for signed-out visitors", async () => {
    const result = await loadWelcome()

    expect(getBoard).toHaveBeenCalledExactlyOnceWith(db, board.id)
    expect(getGame).toHaveBeenCalledExactlyOnceWith(board.gameId)
    expect(result).toEqual({
        boardPath: `/boards/${board.id}`,
        game,
        inviterName: "Brad",
    })
})

test.each([
    {...board, players: []},
    {...board, ownerId: null},
])("uses a generic inviter when the owner is unavailable", async savedBoard => {
    vi.mocked(getBoard).mockResolvedValueOnce(savedBoard)

    expect(await loadWelcome()).toMatchObject({inviterName: "Someone"})
})

test("returns 404 when the board does not exist", async () => {
    vi.mocked(getBoard).mockResolvedValueOnce(undefined)

    await expect(loadWelcome()).rejects.toMatchObject({init: {status: 404}})
    expect(getGame).not.toHaveBeenCalled()
})

test("redirects signed-in visitors to the board", async () => {
    vi.mocked(getUser).mockResolvedValueOnce({
        id: "user-1",
        name: "User",
        email: "user@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    await expect(loadWelcome()).rejects.toMatchObject({
        status: 302,
        headers: expect.objectContaining({}),
    })
    expect(getBoard).not.toHaveBeenCalled()
})

test("presents the game and all three ways to continue", () => {
    const props = {
        loaderData: {
            boardPath: `/boards/${board.id}`,
            game,
            inviterName: "Brad",
        },
    } as Route.ComponentProps
    const router = createMemoryRouter(
        [
            {
                path: "/boards/:id/welcome",
                element: <BoardWelcome {...props} />,
            },
        ],
        {initialEntries: [`/boards/${board.id}/welcome`]},
    )

    render(<RouterProvider router={router} />)

    expect(
        screen.getByRole("heading", {name: "Brad invited you to a board"}),
    ).toBeInTheDocument()
    expect(screen.getByText(game.name)).toBeInTheDocument()
    expect(screen.getByText("BUF")).toBeInTheDocument()
    expect(screen.getByText("DAL")).toBeInTheDocument()
    expect(screen.getByRole("link", {name: "Create account"})).toHaveAttribute(
        "href",
        `/signup?redirectTo=%2Fboards%2F${board.id}`,
    )
    expect(screen.getByRole("link", {name: "Sign in"})).toHaveAttribute(
        "href",
        `/login?redirectTo=%2Fboards%2F${board.id}`,
    )
    expect(
        screen.getByRole("link", {name: "Continue as guest"}),
    ).toHaveAttribute("href", `/boards/${board.id}`)
})
