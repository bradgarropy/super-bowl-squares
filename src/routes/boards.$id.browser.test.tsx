import {cleanup, render, screen, within} from "@testing-library/react"
import {
    createMemoryRouter,
    RouterContextProvider,
    RouterProvider,
} from "react-router"
import {afterEach, beforeEach, expect, test, vi} from "vitest"

import {createDb, dbCtx} from "~/db/client.server"
import type {Invite, Player} from "~/db/schema"
import BoardRoute, {action, loader} from "~/routes/boards.$id"
import {getUser, requireUser} from "~/utils/auth.server"
import {getBoard, getUserBoard} from "~/utils/boards.server"
import type {GameDetails} from "~/utils/games"
import {getGame} from "~/utils/games"
import {invitePlayer} from "~/utils/invites.server"
import {
    addPlayer as addPlayerRecord,
    removePlayer as removePlayerRecord,
} from "~/utils/players.server"
import {shuffleBoard as shuffleBoardRecord} from "~/utils/squares.server"

import type {Route} from "./+types/boards.$id"

vi.mock("~/utils/auth.server", () => ({
    getUser: vi.fn(),
    requireUser: vi.fn(),
}))
vi.mock("~/utils/boards.server", () => ({
    getBoard: vi.fn(),
    getUserBoard: vi.fn(),
}))
vi.mock("~/utils/games", () => ({getGame: vi.fn()}))
vi.mock("~/utils/invites.server", () => ({invitePlayer: vi.fn()}))
vi.mock("~/utils/players.server", () => ({
    addPlayer: vi.fn(),
    removePlayer: vi.fn(),
}))
vi.mock("~/utils/squares.server", () => ({shuffleBoard: vi.fn()}))
vi.mock("~/components/Board", () => ({default: () => <div>Game board</div>}))

afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
})

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
            invite: null,
            createdAt: "2026-09-02 12:00:00",
            updatedAt: "2026-09-02 12:00:00",
        },
        {
            id: "player-2",
            boardId: "board-1",
            userId: null,
            name: "Alex",
            invite: null,
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
                invite: null,
                createdAt: "2026-09-02 12:00:00",
                updatedAt: "2026-09-02 12:00:00",
            },
        },
    ],
}

const serializePlayer = ({
    invite,
    ...player
}: Player & {invite: Invite | null}) => ({
    ...player,
    isInvited: invite?.claimedAt === null,
})

const visibleBoard = {
    ...board,
    players: board.players.map(serializePlayer),
    squares: board.squares.map(square => ({
        ...square,
        player: serializePlayer(square.player),
    })),
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
    const owner = {
        id: "owner-1",
        name: "Owner",
        email: "owner@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    vi.mocked(getUser).mockResolvedValue(owner)
    vi.mocked(requireUser).mockResolvedValue(owner)
    vi.mocked(getBoard).mockResolvedValue(board)
    vi.mocked(getUserBoard).mockResolvedValue(board)
    vi.mocked(getGame).mockResolvedValue(game)
    vi.mocked(invitePlayer).mockResolvedValue("invite-token")
    vi.mocked(addPlayerRecord).mockResolvedValue([
        {} as D1Result,
        {} as D1Result,
    ])
    vi.mocked(removePlayerRecord).mockResolvedValue([
        {} as D1Result,
        {} as D1Result,
    ])
    vi.mocked(shuffleBoardRecord).mockResolvedValue([{} as D1Result])
})

test("loads players and squares and identifies the owner", async () => {
    const result = await loadBoard()

    expect(getBoard).toHaveBeenCalledExactlyOnceWith(db, board.id)
    expect(result.board.players).toEqual(visibleBoard.players)
    expect(result.board.squares).toEqual(visibleBoard.squares)
    expect(result.isOwner).toBe(true)
    expect(getGame).toHaveBeenCalledExactlyOnceWith(board.gameId)
})

test("returns 404 when the board is missing", async () => {
    vi.mocked(getBoard).mockResolvedValueOnce(undefined)

    await expect(loadBoard()).rejects.toMatchObject({init: {status: 404}})
    expect(getGame).not.toHaveBeenCalled()
})

test("allows signed-out visitors to load a board as a non-owner", async () => {
    vi.mocked(getUser).mockResolvedValueOnce(null)

    const result = await loadBoard()

    expect(result.board).toEqual(visibleBoard)
    expect(result.isOwner).toBe(false)
    expect(requireUser).not.toHaveBeenCalled()
})

test("allows other users to load a board as a non-owner", async () => {
    vi.mocked(getUser).mockResolvedValueOnce({
        id: "user-2",
        name: "Viewer",
        email: "viewer@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    const result = await loadBoard()

    expect(result.board).toEqual(visibleBoard)
    expect(result.isOwner).toBe(false)
})

const renderBoard = (
    players = visibleBoard.players,
    state: GameDetails["state"] = "pre",
    error?: string,
    isOwner = true,
) => {
    const props = {
        loaderData: {
            board: {...visibleBoard, players},
            game: {...game, state},
            isOwner,
        },
        actionData: error ? {error} : undefined,
    } as Route.ComponentProps

    const router = createMemoryRouter(
        [
            {
                path: "/boards/:id",
                element: <BoardRoute {...props} />,
            },
        ],
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

test("shows the board and players without management controls to non-owners", () => {
    renderBoard(visibleBoard.players, "pre", undefined, false)

    expect(screen.getByText("Game board")).toBeInTheDocument()
    expect(screen.getByText("Owner")).toBeInTheDocument()
    expect(screen.getByText("Alex")).toBeInTheDocument()
    expect(
        screen.queryByRole("button", {name: "Shuffle squares"}),
    ).not.toBeInTheDocument()
    expect(
        screen.queryByRole("button", {name: "Share board"}),
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Player name")).not.toBeInTheDocument()
    expect(
        screen.queryByRole("button", {name: "Add player"}),
    ).not.toBeInTheDocument()
    expect(
        screen.queryByRole("button", {name: "Remove Alex"}),
    ).not.toBeInTheDocument()
    expect(
        screen.queryByRole("button", {name: "Invite"}),
    ).not.toBeInTheDocument()
})

test("shows an empty state for boards without players", () => {
    renderBoard([])

    expect(screen.getByText("No players yet.")).toBeInTheDocument()
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
})

test("enables the add-player form before kickoff", () => {
    renderBoard()
    expect(screen.getByRole("button", {name: "Share board"})).toBeEnabled()
    expect(screen.getByRole("button", {name: "Shuffle squares"})).toBeEnabled()
    expect(screen.getByLabelText("Player name")).toBeEnabled()
    expect(screen.getByRole("button", {name: "Add player"})).toBeEnabled()
    expect(screen.getByRole("button", {name: "Remove Alex"})).toBeEnabled()
    expect(screen.getByRole("button", {name: "Invite"})).toBeEnabled()
    expect(
        screen.queryByRole("button", {name: "Remove Owner"}),
    ).not.toBeInTheDocument()
})

test.each(["in", "post"] as const)("disables the form for %s games", state => {
    renderBoard(visibleBoard.players, state)
    expect(
        screen.queryByRole("button", {name: "Shuffle squares"}),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText("Player name")).toBeDisabled()
    expect(screen.getByRole("button", {name: "Add player"})).toBeDisabled()
    expect(screen.getByRole("button", {name: "Remove Alex"})).toBeDisabled()
    expect(
        screen.queryByRole("button", {name: "Remove Owner"}),
    ).not.toBeInTheDocument()
    expect(
        screen.getByText("Players are locked because the game has started."),
    ).toBeInTheDocument()
})

test("displays action errors", () => {
    renderBoard(visibleBoard.players, "pre", "Player name is required.")
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

const invite = (playerId = "player-2") =>
    addPlayer(new URLSearchParams({intent: "invite", playerId}))

test("creates an invitation for an unclaimed player", async () => {
    expect(await invite()).toEqual({
        inviteUrl: "https://example.com/invites/invite-token",
    })
    expect(invitePlayer).toHaveBeenCalledExactlyOnceWith(
        db,
        board.id,
        "player-2",
    )
})

test("rejects an invitation when the guarded update no longer matches", async () => {
    vi.mocked(invitePlayer).mockResolvedValueOnce(null)

    expect(await invite()).toMatchObject({
        data: {error: "This player is no longer available to invite."},
        init: {status: 409},
    })
})

test("rejects invitations for missing or claimed players", async () => {
    expect(await invite("missing-player")).toMatchObject({
        init: {status: 404},
    })
    expect(await invite("player-1")).toMatchObject({
        init: {status: 409},
    })
    expect(invitePlayer).not.toHaveBeenCalled()
})

test("rejects invitations without a player ID", async () => {
    expect(await invite("")).toMatchObject({init: {status: 400}})
    expect(invitePlayer).not.toHaveBeenCalled()
})

test("shuffles every player on the owned board and redirects", async () => {
    const response = await addPlayer(new URLSearchParams({intent: "shuffle"}))

    expect(shuffleBoardRecord).toHaveBeenCalledExactlyOnceWith(db, board.id, [
        "player-1",
        "player-2",
    ])
    expect((response as Response).headers.get("Location")).toBe(
        `/boards/${board.id}`,
    )
})

test.each(["in", "post"] as const)(
    "rejects shuffling for %s games",
    async state => {
        vi.mocked(getGame).mockResolvedValueOnce({...game, state})

        expect(
            await addPlayer(new URLSearchParams({intent: "shuffle"})),
        ).toMatchObject({init: {status: 409}})
        expect(shuffleBoardRecord).not.toHaveBeenCalled()
    },
)

const removePlayer = (playerId = "player-2") =>
    addPlayer(new URLSearchParams({intent: "remove", playerId}))

test("removes a guest from the owned board", async () => {
    const response = await removePlayer("player-2")

    expect(getUserBoard).toHaveBeenCalledExactlyOnceWith(
        db,
        board.id,
        board.ownerId,
    )
    expect(removePlayerRecord).toHaveBeenCalledExactlyOnceWith(
        db,
        board,
        "player-2",
    )
    expect((response as Response).headers.get("Location")).toBe(
        `/boards/${board.id}`,
    )
})

test("rejects removal of the board owner", async () => {
    expect(await removePlayer("player-1")).toMatchObject({
        data: {error: "The board owner cannot be removed."},
        init: {status: 409},
    })
    expect(removePlayerRecord).not.toHaveBeenCalled()
})

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
