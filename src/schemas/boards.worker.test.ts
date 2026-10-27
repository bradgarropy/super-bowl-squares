import {expect, test} from "vitest"

import {boardActionSchema} from "~/schemas/boards"

test.each([
    {intent: "invite", playerId: "player-1"},
    {intent: "revoke-invite", playerId: "player-1"},
    {intent: "shuffle"},
    {intent: "add", name: "Alex"},
    {intent: "remove", playerId: "player-1"},
])("parses a $intent board action", action => {
    expect(boardActionSchema.parse(action)).toEqual(action)
})

test("trims an added player's name", () => {
    expect(boardActionSchema.parse({intent: "add", name: " Alex "})).toEqual({
        intent: "add",
        name: "Alex",
    })
})

test.each([
    {intent: "invite", playerId: ""},
    {intent: "revoke-invite", playerId: ""},
    {intent: "add", name: ""},
    {intent: "add", name: "a".repeat(101)},
    {intent: "remove", playerId: ""},
    {intent: "unknown"},
    {},
])("rejects invalid board action data", action => {
    expect(boardActionSchema.safeParse(action).success).toBe(false)
})
