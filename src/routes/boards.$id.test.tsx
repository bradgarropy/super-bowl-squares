import {cleanup, render, screen, within} from "@testing-library/react"
import {
    createMemoryRouter,
    RouterContextProvider,
    RouterProvider,
} from "react-router"
import {afterEach, beforeEach, expect, test, vi} from "vitest"

import {createDb, dbCtx} from "~/db/client.server"
import BoardRoute, {action, loader} from "~/routes/boards.$id"
import {requireUser} from "~/utils/auth.server"
import {getUserBoard} from "~/utils/boards.server"
import type {GameDetails} from "~/utils/games"
import {getGame} from "~/utils/games"
import {
    addPlayer as addPlayerRecord,
    removePlayer as removePlayerRecord,
} from "~/utils/players.server"

import type {Route} from "./+types/boards.$id"

vi.mock("~/utils/auth.server", () => ({requireUser: vi.fn()}))
vi.mock("~/utils/boards.server", () => ({getUserBoard: vi.fn()}))
vi.mock("~/utils/games", () => ({getGame: vi.fn()}))
vi.mock("~/utils/players.server", () => ({
    addPlayer: vi.fn(),
    removePlayer: vi.fn(),
}))
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
    squares: [
        {
            boardId: "board-1",
            playerId: "player-1",
            row: 0,
            column: 0,
            player: {
                id: "player-1",
                boardId: "board-1",
                userId: "owner-1",
                name: "Owner",
                createdAt: "2026-09-02 12:00:00",
                updatedAt: "2026-09-02 12:00:00",
            },
        },
    ],
}

const team = {
    id: "team-1",
    name: "Team",
    abbreviation: "TEAM",
    color: "000000",
    logo: "",
}
const game: GameDetails = {
    id: board.gameId,
    name: "Away at Home",
    date: "2026-09-09T23:00:00Z",
    state: "pre",
    quarter: 0,
    clock: "0:00",
    score: {home: 0, away: 0},
    quarterScores: [],
    teams: {home: team, away: team},
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
    vi.mocked(getGame).mockResolvedValue(game)
    vi.mocked(addPlayerRecord).mockResolvedValue([
        {} as D1Result,
        {} as D1Result,
    ])
    vi.mocked(removePlayerRecord).mockResolvedValue([
        {} as D1Result,
        {} as D1Result,
    ])
})

test("loads players and squares using the authenticated owner's board query", async () => {
    const result = await loadBoard()

    expect(getUserBoard).toHaveBeenCalledExactlyOnceWith(
        db,
        board.id,
        board.ownerId,
    )
    expect(result.board.players).toEqual(board.players)
    expect(result.board.squares).toEqual(board.squares)
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

const renderBoard = (
    players = board.players,
    state: GameDetails["state"] = "pre",
    error?: string,
) => {
    const props = {
        loaderData: {board: {...board, players}, game: {...game, state}},
        actionData: error ? {error} : undefined,
    } as Route.ComponentProps

    const router = createMemoryRouter(
        [{path: "/boards/:id", element: <BoardRoute {...props} />}],
        {initialEntries: [`/boards/${board.id}`]},
    )
    render(<RouterProvider router={router} />)
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

test("enables the add-player form before kickoff", () => {
    renderBoard()
    expect(screen.getByLabelText("Player name")).toBeEnabled()
    expect(screen.getByRole("button", {name: "Add player"})).toBeEnabled()
    expect(screen.getByRole("button", {name: "Remove Alex"})).toBeEnabled()
    expect(screen.getByRole("button", {name: "Remove Owner"})).toBeEnabled()
})

test.each(["in", "post"] as const)("disables the form for %s games", state => {
    renderBoard(board.players, state)
    expect(screen.getByLabelText("Player name")).toBeDisabled()
    expect(screen.getByRole("button", {name: "Add player"})).toBeDisabled()
    expect(screen.getByRole("button", {name: "Remove Alex"})).toBeDisabled()
    expect(screen.getByRole("button", {name: "Remove Owner"})).toBeDisabled()
    expect(
        screen.getByText("Players are locked because the game has started."),
    ).toBeInTheDocument()
})

test("displays action errors", () => {
    renderBoard(board.players, "pre", "Player name is required.")
    expect(screen.getByRole("alert")).toHaveTextContent(
        "Player name is required.",
    )
})

const addPlayer = (
    body: BodyInit = new URLSearchParams({intent: "add", name: "  Alex  "}),
) =>
    action({
        context,
        params: {id: board.id},
        request: new Request(`https://example.com/boards/${board.id}`, {
            method: "POST",
            body,
        }),
        url: new URL(`https://example.com/boards/${board.id}`),
        pattern: "/boards/:id",
    })

test("adds a trimmed guest name to the owned board and redirects", async () => {
    const response = await addPlayer()
    expect(getUserBoard).toHaveBeenCalledExactlyOnceWith(
        db,
        board.id,
        board.ownerId,
    )
    expect(addPlayerRecord).toHaveBeenCalledExactlyOnceWith(db, board, "Alex")
    expect(response).toBeInstanceOf(Response)
    expect((response as Response).headers.get("Location")).toBe(
        `/boards/${board.id}`,
    )
})

test.each(["in", "post"] as const)(
    "rejects adding a player when the game is %s",
    async state => {
        vi.mocked(getGame).mockResolvedValueOnce({...game, state})
        expect(await addPlayer()).toMatchObject({init: {status: 409}})
        expect(addPlayerRecord).not.toHaveBeenCalled()
    },
)

test("checks authentication on direct submissions", async () => {
    const redirect = new Response(null, {status: 302})
    vi.mocked(requireUser).mockRejectedValueOnce(redirect)
    await expect(addPlayer()).rejects.toBe(redirect)
    expect(getUserBoard).not.toHaveBeenCalled()
    expect(addPlayerRecord).not.toHaveBeenCalled()
})

test("rejects submissions for missing or unowned boards", async () => {
    vi.mocked(getUserBoard).mockResolvedValueOnce(undefined)
    await expect(addPlayer()).rejects.toMatchObject({init: {status: 404}})
    expect(addPlayerRecord).not.toHaveBeenCalled()
})

test.each(["", "   ", "a".repeat(101)])(
    "rejects invalid player name %j",
    async name => {
        expect(
            await addPlayer(new URLSearchParams({intent: "add", name})),
        ).toMatchObject({
            init: {status: 400},
        })
        expect(addPlayerRecord).not.toHaveBeenCalled()
    },
)

test("rejects a missing name", async () => {
    expect(await addPlayer(new URLSearchParams({intent: "add"}))).toMatchObject(
        {
            init: {status: 400},
        },
    )
    expect(addPlayerRecord).not.toHaveBeenCalled()
})

test("rejects adding more than 100 players", async () => {
    vi.mocked(getUserBoard).mockResolvedValueOnce({
        ...board,
        players: Array.from({length: 100}, (_, index) => ({
            ...board.players[0],
            id: `player-${index}`,
        })),
    })

    expect(await addPlayer()).toMatchObject({
        data: {error: "A board cannot have more than 100 players."},
        init: {status: 409},
    })
    expect(addPlayerRecord).not.toHaveBeenCalled()
})

test("does not redirect when the insert fails", async () => {
    vi.mocked(addPlayerRecord).mockRejectedValueOnce(
        new Error("Database unavailable"),
    )
    await expect(addPlayer()).rejects.toThrow()
})

const removePlayer = (playerId = "player-2") =>
    addPlayer(new URLSearchParams({intent: "remove", playerId}))

test.each(["player-1", "player-2"])(
    "removes %s only from the owned board",
    async playerId => {
        const response = await removePlayer(playerId)

        expect(getUserBoard).toHaveBeenCalledExactlyOnceWith(
            db,
            board.id,
            board.ownerId,
        )
        expect(removePlayerRecord).toHaveBeenCalledExactlyOnceWith(
            db,
            board,
            playerId,
        )
        expect((response as Response).headers.get("Location")).toBe(
            `/boards/${board.id}`,
        )
    },
)

test("rejects removal of a missing player or a player from another board", async () => {
    expect(await removePlayer("other-board-player")).toMatchObject({
        init: {status: 404},
    })
    expect(removePlayerRecord).not.toHaveBeenCalled()
})

test("rejects removal without a player ID", async () => {
    expect(await removePlayer("")).toMatchObject({init: {status: 400}})
    expect(removePlayerRecord).not.toHaveBeenCalled()
})

test.each(["in", "post"] as const)(
    "rejects player removal for %s games",
    async state => {
        vi.mocked(getGame).mockResolvedValueOnce({...game, state})
        expect(await removePlayer()).toMatchObject({init: {status: 409}})
        expect(removePlayerRecord).not.toHaveBeenCalled()
    },
)

test("requires authentication to remove players", async () => {
    const redirect = new Response(null, {status: 302})
    vi.mocked(requireUser).mockRejectedValueOnce(redirect)
    await expect(removePlayer()).rejects.toBe(redirect)
    expect(getUserBoard).not.toHaveBeenCalled()
    expect(removePlayerRecord).not.toHaveBeenCalled()
})

test("rejects removal from an unowned board", async () => {
    vi.mocked(getUserBoard).mockResolvedValueOnce(undefined)
    await expect(removePlayer()).rejects.toMatchObject({init: {status: 404}})
    expect(removePlayerRecord).not.toHaveBeenCalled()
})

test("does not redirect when deleting fails", async () => {
    vi.mocked(removePlayerRecord).mockRejectedValueOnce(
        new Error("Database unavailable"),
    )
    await expect(removePlayer()).rejects.toThrow()
})

test("rejects unknown actions without writing", async () => {
    expect(
        await addPlayer(new URLSearchParams({intent: "unknown"})),
    ).toMatchObject({init: {status: 400}})
    expect(addPlayerRecord).not.toHaveBeenCalled()
    expect(removePlayerRecord).not.toHaveBeenCalled()
})

test("rejects a missing intent without writing", async () => {
    expect(await addPlayer(new URLSearchParams({name: "Alex"}))).toMatchObject({
        data: {error: "Invalid action."},
        init: {status: 400},
    })
    expect(addPlayerRecord).not.toHaveBeenCalled()
    expect(removePlayerRecord).not.toHaveBeenCalled()
})
