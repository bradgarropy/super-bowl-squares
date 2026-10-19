import {expect, test, vi} from "vitest"

import type {Database} from "~/db/client.server"
import {player} from "~/db/schema"
import {
    createToken,
    getInvitedPlayer,
    hashToken,
    invitePlayer,
} from "~/utils/invites.server"

test("creates a URL-safe token with 256 bits of randomness", () => {
    expect(createToken()).toMatch(/^[0-9a-f]{64}$/)
})

test("hashes invitation tokens with SHA-256", async () => {
    expect(await hashToken("test")).toBe(
        "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    )
})

test("stores the token hash on the unclaimed board player", async () => {
    const get = vi.fn().mockResolvedValue({id: "player-1"})
    const returning = vi.fn(() => ({get}))
    const where = vi.fn(() => ({returning}))
    const set = vi.fn(() => ({where}))
    const update = vi.fn(() => ({set}))

    const token = await invitePlayer({update} as never, "board-1", "player-1")

    expect(token).not.toBeNull()

    if (!token) {
        throw new Error("Expected an invitation token")
    }

    expect(update).toHaveBeenCalledExactlyOnceWith(player)
    expect(set).toHaveBeenCalledExactlyOnceWith({
        inviteTokenHash: await hashToken(token),
    })
    expect(where).toHaveBeenCalledTimes(1)
    expect(returning).toHaveBeenCalledExactlyOnceWith({id: player.id})
    expect(get).toHaveBeenCalledTimes(1)
})

test("does not return a token when the player was not updated", async () => {
    const get = vi.fn().mockResolvedValue(undefined)
    const returning = vi.fn(() => ({get}))
    const where = vi.fn(() => ({returning}))
    const set = vi.fn(() => ({where}))
    const update = vi.fn(() => ({set}))

    const token = await invitePlayer({update} as never, "board-1", "player-1")

    expect(token).toBeNull()
})

test("loads the unclaimed player and board for an invitation token", async () => {
    const invitedPlayer = {id: "player-1"}
    const findFirst = vi.fn().mockResolvedValue(invitedPlayer)
    const db = {
        query: {player: {findFirst}},
    } as unknown as Database

    const result = await getInvitedPlayer(db, "invite-token")

    expect(result).toBe(invitedPlayer)
    expect(findFirst).toHaveBeenCalledExactlyOnceWith({
        where: expect.any(Function),
        with: {
            board: {
                with: {owner: true},
            },
        },
    })
})

test("returns undefined when an invitation does not match an unclaimed player", async () => {
    const findFirst = vi.fn().mockResolvedValue(undefined)
    const db = {
        query: {player: {findFirst}},
    } as unknown as Database

    expect(await getInvitedPlayer(db, "invalid-token")).toBeUndefined()
})
