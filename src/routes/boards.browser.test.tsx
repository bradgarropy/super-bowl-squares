import {cleanup, render, screen} from "@testing-library/react"
import {
    createMemoryRouter,
    RouterContextProvider,
    RouterProvider,
} from "react-router"
import {afterEach, beforeEach, expect, test, vi} from "vitest"

import {createDb, dbCtx} from "~/db/client.server"
import type {Board} from "~/db/schema"
import Boards, {loader} from "~/routes/boards"
import {requireUser} from "~/utils/auth.server"
import {getJoinedBoards, getUserBoards} from "~/utils/boards.server"
import type {GameDetails} from "~/utils/games"
import {getGame} from "~/utils/games"

import type {Route} from "./+types/boards"

vi.mock("~/utils/auth.server", () => ({requireUser: vi.fn()}))
vi.mock("~/utils/boards.server", () => ({
    getJoinedBoards: vi.fn(),
    getUserBoards: vi.fn(),
}))
vi.mock("~/utils/games", () => ({getGame: vi.fn()}))

afterEach(cleanup)

const db = createDb({} as Env["DB"])
const context = new RouterContextProvider()
context.set(dbCtx, db)

const user = {
    id: "user-1",
    name: "Gaby",
    email: "gaby@gmail.com",
    emailVerified: true,
    image: null,
    createdAt: new Date("2026-10-01T12:00:00Z"),
    updatedAt: new Date("2026-10-01T12:00:00Z"),
}

const createBoard = (id: string, gameId: string, ownerId: string): Board => ({
    id,
    gameId,
    ownerId,
    createdAt: "2026-10-01 12:00:00",
    updatedAt: "2026-10-01 12:00:00",
})

const ownedBoard = createBoard("owned-board", "owned-game", user.id)
const joinedBoard = createBoard("joined-board", "joined-game", "owner-1")

const team = {
    id: "team-1",
    name: "Team",
    abbreviation: "TEAM",
    color: "000000",
    logo: "",
}

const createGame = (id: string, name: string): GameDetails => ({
    id,
    name,
    date: "2026-10-25T18:00:00Z",
    state: "pre",
    quarter: 0,
    clock: "0:00",
    score: {away: 0, home: 0},
    quarterScores: [],
    teams: {away: team, home: team},
})

const ownedGame = createGame(ownedBoard.gameId, "Owned game")
const joinedGame = createGame(joinedBoard.gameId, "Joined game")

beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue(user)
    vi.mocked(getUserBoards).mockResolvedValue([ownedBoard])
    vi.mocked(getJoinedBoards).mockResolvedValue([joinedBoard])
    vi.mocked(getGame).mockImplementation(async gameId =>
        gameId === ownedGame.id ? ownedGame : joinedGame,
    )
})

test("loads owned and joined boards separately", async () => {
    await expect(
        loader({
            context,
            params: {},
            request: new Request("https://example.com/boards"),
            url: new URL("https://example.com/boards"),
            pattern: "/boards",
        }),
    ).resolves.toEqual({
        boards: [{board: ownedBoard, game: ownedGame}],
        joinedBoards: [{board: joinedBoard, game: joinedGame}],
    })
    expect(getUserBoards).toHaveBeenCalledExactlyOnceWith(db, user.id)
    expect(getJoinedBoards).toHaveBeenCalledExactlyOnceWith(db, user.id)
    expect(getGame).toHaveBeenCalledTimes(2)
})

const renderBoards = (
    boards: Route.ComponentProps["loaderData"]["boards"] = [
        {board: ownedBoard, game: ownedGame},
    ],
    joinedBoards: Route.ComponentProps["loaderData"]["joinedBoards"] = [
        {board: joinedBoard, game: joinedGame},
    ],
) => {
    const props = {loaderData: {boards, joinedBoards}} as Route.ComponentProps
    const router = createMemoryRouter(
        [{path: "/boards", element: <Boards {...props} />}],
        {initialEntries: ["/boards"]},
    )

    render(<RouterProvider router={router} />)
}

test("shows owned and joined boards in separate sections", () => {
    renderBoards()

    expect(
        screen.getByRole("heading", {name: "Your boards"}),
    ).toBeInTheDocument()
    expect(
        screen.getByRole("heading", {name: "Boards you've joined"}),
    ).toBeInTheDocument()
    expect(screen.getByRole("link", {name: ownedGame.name})).toHaveAttribute(
        "href",
        `/boards/${ownedBoard.id}`,
    )
    expect(screen.getByRole("link", {name: joinedGame.name})).toHaveAttribute(
        "href",
        `/boards/${joinedBoard.id}`,
    )
})

test("shows independent empty states", () => {
    renderBoards([], [])

    expect(
        screen.getByText("You don't own any boards yet.", {exact: false}),
    ).toBeInTheDocument()
    expect(
        screen.getByText("You haven't joined any boards yet."),
    ).toBeInTheDocument()
})
