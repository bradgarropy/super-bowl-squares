import {expect, test, vi} from "vitest"

import type {Database} from "~/db/client.server"
import {getBoard, getJoinedBoards, getUserBoard} from "~/utils/boards.server"

test("loads a board with its players and assigned squares", () => {
    const findFirst = vi.fn()
    const db = {
        query: {board: {findFirst}},
    } as unknown as Database

    getUserBoard(db, "board-1", "user-1")

    expect(findFirst).toHaveBeenCalledExactlyOnceWith({
        where: expect.any(Function),
        with: {
            players: {orderBy: expect.any(Function)},
            squares: {
                orderBy: expect.any(Function),
                with: {player: true},
            },
        },
    })
})

test("loads a board without restricting it to an owner", () => {
    const findFirst = vi.fn()
    const db = {
        query: {board: {findFirst}},
    } as unknown as Database

    getBoard(db, "board-1")

    expect(findFirst).toHaveBeenCalledExactlyOnceWith({
        where: expect.any(Function),
        with: {
            players: {orderBy: expect.any(Function)},
            squares: {
                orderBy: expect.any(Function),
                with: {player: true},
            },
        },
    })
})

test("loads boards joined by a player without returning owned boards", async () => {
    const findMany = vi.fn().mockResolvedValue([
        {
            board: {
                id: "joined-board",
                ownerId: "owner-1",
                createdAt: "2026-10-02 12:00:00",
            },
        },
        {
            board: {
                id: "owned-board",
                ownerId: "user-1",
                createdAt: "2026-10-03 12:00:00",
            },
        },
        {
            board: {
                id: "older-joined-board",
                ownerId: "owner-2",
                createdAt: "2026-10-01 12:00:00",
            },
        },
    ])
    const db = {
        query: {player: {findMany}},
    } as unknown as Database

    await expect(getJoinedBoards(db, "user-1")).resolves.toEqual([
        expect.objectContaining({id: "joined-board"}),
        expect.objectContaining({id: "older-joined-board"}),
    ])
    expect(findMany).toHaveBeenCalledExactlyOnceWith({
        where: expect.any(Function),
        with: {board: true},
    })
})
