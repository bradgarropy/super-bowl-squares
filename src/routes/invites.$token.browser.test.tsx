import {cleanup, render, screen} from "@testing-library/react"
import {
    createMemoryRouter,
    RouterContextProvider,
    RouterProvider,
} from "react-router"
import {afterEach, beforeEach, expect, test, vi} from "vitest"

import {createDb, dbCtx} from "~/db/client.server"
import Invite, {action, loader} from "~/routes/invites.$token"
import {getUser, requireUser} from "~/utils/auth.server"
import type {GameDetails} from "~/utils/games"
import {getGame} from "~/utils/games"
import {claimPlayer, getInvitedPlayer} from "~/utils/invites.server"

import type {Route} from "./+types/invites.$token"

vi.mock("~/utils/auth.server", () => ({
    getUser: vi.fn(),
    requireUser: vi.fn(),
}))
vi.mock("~/utils/games", () => ({getGame: vi.fn()}))
vi.mock("~/utils/invites.server", () => ({
    claimPlayer: vi.fn(),
    getInvitedPlayer: vi.fn(),
}))

afterEach(cleanup)

const db = createDb({} as Env["DB"])
const context = new RouterContextProvider()
context.set(dbCtx, db)

const owner = {
    id: "owner-1",
    name: "Brad",
    email: "brad@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date("2026-09-01T12:00:00Z"),
    updatedAt: new Date("2026-09-01T12:00:00Z"),
}

const invitedPlayer = {
    id: "player-1",
    boardId: "board-1",
    userId: null,
    name: "Alex",
    inviteTokenHash: "stored-hash",
    createdAt: "2026-09-02 12:00:00",
    updatedAt: "2026-09-02 12:00:00",
    board: {
        id: "board-1",
        gameId: "game-1",
        ownerId: owner.id,
        createdAt: "2026-09-02 12:00:00",
        updatedAt: "2026-09-02 12:00:00",
        owner,
    },
}

const team = {
    id: "team-1",
    name: "Team",
    abbreviation: "TEAM",
    color: "000000",
    logo: "",
}

const game: GameDetails = {
    id: invitedPlayer.board.gameId,
    name: "Away at Home",
    date: "2026-09-09T23:00:00Z",
    state: "pre",
    quarter: 0,
    clock: "0:00",
    score: {home: 0, away: 0},
    quarterScores: [],
    teams: {home: team, away: team},
}

const loadInvite = () =>
    loader({
        context,
        params: {token: "raw-token"},
        request: new Request("https://example.com/invites/raw-token"),
        url: new URL("https://example.com/invites/raw-token"),
        pattern: "/invites/:token",
    })

beforeEach(() => {
    vi.mocked(getInvitedPlayer).mockResolvedValue(invitedPlayer)
    vi.mocked(getUser).mockResolvedValue(null)
    vi.mocked(requireUser).mockResolvedValue(owner)
    vi.mocked(getGame).mockResolvedValue(game)
    vi.mocked(claimPlayer).mockResolvedValue({
        boardId: "board-1",
        status: "claimed",
    })
})

test("loads a valid invitation without requiring authentication", async () => {
    expect(await loadInvite()).toEqual({
        boardPath: "/boards/board-1",
        game,
        inviterName: "Brad",
        isSignedIn: false,
        playerName: "Alex",
    })
    expect(getInvitedPlayer).toHaveBeenCalledExactlyOnceWith(db, "raw-token")
    expect(getGame).toHaveBeenCalledExactlyOnceWith("game-1")
})

test("identifies signed-in visitors", async () => {
    vi.mocked(getUser).mockResolvedValueOnce(owner)

    expect(await loadInvite()).toMatchObject({isSignedIn: true})
})

test("uses a generic inviter when the board owner is unavailable", async () => {
    vi.mocked(getInvitedPlayer).mockResolvedValueOnce({
        ...invitedPlayer,
        board: {...invitedPlayer.board, owner: null},
    })

    expect(await loadInvite()).toMatchObject({inviterName: "Someone"})
})

test("returns a generic 404 for an invalid invitation", async () => {
    vi.mocked(getInvitedPlayer).mockResolvedValueOnce(undefined)

    await expect(loadInvite()).rejects.toMatchObject({init: {status: 404}})
    expect(getGame).not.toHaveBeenCalled()
})

const claimInvite = () =>
    action({
        context,
        params: {token: "raw-token"},
        request: new Request("https://example.com/invites/raw-token", {
            method: "POST",
        }),
        url: new URL("https://example.com/invites/raw-token"),
        pattern: "/invites/:token",
    })

test("claims the invited player for the signed-in user", async () => {
    const response = await claimInvite()

    expect(requireUser).toHaveBeenCalledTimes(1)
    expect(claimPlayer).toHaveBeenCalledExactlyOnceWith(
        db,
        "raw-token",
        owner.id,
    )
    expect(response).toMatchObject({
        headers: expect.objectContaining({}),
        status: 302,
    })
    expect((response as Response).headers.get("Location")).toBe(
        "/boards/board-1",
    )
})

test("rejects an invalid or already claimed invitation", async () => {
    vi.mocked(claimPlayer).mockResolvedValueOnce({status: "invalid"})
    await expect(claimInvite()).rejects.toMatchObject({init: {status: 404}})

    vi.mocked(claimPlayer).mockResolvedValueOnce({status: "already-claimed"})
    await expect(claimInvite()).resolves.toMatchObject({init: {status: 409}})
})

const renderInvite = (isSignedIn = false) => {
    const props = {
        loaderData: {
            boardPath: "/boards/board-1",
            game,
            inviterName: "Brad",
            isSignedIn,
            playerName: "Alex",
        },
        params: {token: "raw-token"},
    } as Route.ComponentProps
    const router = createMemoryRouter(
        [
            {
                path: "/invites/:token",
                element: <Invite {...props} />,
            },
        ],
        {initialEntries: ["/invites/raw-token"]},
    )

    render(<RouterProvider router={router} />)
}

test("presents a signed-out visitor with authentication options", () => {
    renderInvite()

    expect(
        screen.getByRole("heading", {
            name: "Brad invited you to play as Alex",
        }),
    ).toBeInTheDocument()
    expect(screen.getByText(game.name)).toBeInTheDocument()
    expect(screen.getByRole("link", {name: "Create account"})).toHaveAttribute(
        "href",
        "/signup?redirectTo=%2Finvites%2Fraw-token",
    )
    expect(screen.getByRole("link", {name: "Sign in"})).toHaveAttribute(
        "href",
        "/login?redirectTo=%2Finvites%2Fraw-token",
    )
    expect(
        screen.queryByRole("link", {name: "Continue as guest"}),
    ).not.toBeInTheDocument()
})

test("presents signed-in visitors with the claim action", () => {
    renderInvite(true)

    expect(
        screen.queryByRole("link", {name: "Create account"}),
    ).not.toBeInTheDocument()
    expect(
        screen.queryByRole("link", {name: "Sign in"}),
    ).not.toBeInTheDocument()
    expect(
        screen.queryByRole("link", {name: "Continue as guest"}),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("button", {name: "Claim Alex"})).toBeInTheDocument()
    expect(
        screen.getByText(
            "Claim Alex to connect these squares to your account.",
        ),
    ).toBeInTheDocument()
})
