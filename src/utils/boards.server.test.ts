import {expect, test, vi} from "vitest"

import type {createDb} from "~/db/client.server"
import {getUserBoard} from "~/utils/boards.server"

type Database = ReturnType<typeof createDb>

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
