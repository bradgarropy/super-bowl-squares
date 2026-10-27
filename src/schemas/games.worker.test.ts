import {expect, test} from "vitest"

import {createBoardSchema} from "~/schemas/games"

test("parses and trims a game ID", () => {
    expect(createBoardSchema.parse({gameId: " game-1 "})).toEqual({
        gameId: "game-1",
    })
})

test.each([undefined, null, "", new File([], "game.txt")])(
    "rejects an invalid game ID",
    gameId => {
        expect(createBoardSchema.safeParse({gameId}).success).toBe(false)
    },
)
