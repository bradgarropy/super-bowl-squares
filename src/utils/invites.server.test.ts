import {expect, test, vi} from "vitest"

import {player} from "~/db/schema"
import {createToken, hashToken, invitePlayer} from "~/utils/invites.server"

test("creates a URL-safe token with 256 bits of randomness", () => {
    expect(createToken()).toMatch(/^[0-9a-f]{64}$/)
})

test("hashes invitation tokens with SHA-256", async () => {
    expect(await hashToken("test")).toBe(
        "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    )
})

test("stores the token hash on the unclaimed board player", async () => {
    const run = vi.fn().mockResolvedValue({})
    const where = vi.fn(() => ({run}))
    const set = vi.fn(() => ({where}))
    const update = vi.fn(() => ({set}))

    const token = await invitePlayer({update} as never, "board-1", "player-1")

    expect(update).toHaveBeenCalledExactlyOnceWith(player)
    expect(set).toHaveBeenCalledExactlyOnceWith({
        inviteTokenHash: await hashToken(token),
    })
    expect(where).toHaveBeenCalledTimes(1)
    expect(run).toHaveBeenCalledTimes(1)
})
