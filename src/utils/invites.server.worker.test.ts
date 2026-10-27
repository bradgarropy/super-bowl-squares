import {expect, test, vi} from "vitest"

import type {Database} from "~/db/client.server"
import {invite, player} from "~/db/schema"
import {
    claimPlayer,
    createToken,
    getInvitedPlayer,
    hashToken,
    invitePlayer,
} from "~/utils/invites.server"

const createInviteDb = ({
    invitedPlayer = {id: "player-1"},
}: {
    invitedPlayer?: {id: string} | null
} = {}) => {
    const findFirst = vi.fn().mockResolvedValue(invitedPlayer)
    const run = vi.fn().mockResolvedValue(undefined)
    const onConflictDoUpdate = vi.fn(() => ({run}))
    const values = vi.fn(() => ({onConflictDoUpdate}))
    const insert = vi.fn(() => ({values}))
    const db = {
        insert,
        query: {player: {findFirst}},
    } as unknown as Database

    return {
        db,
        findFirst,
        insert,
        onConflictDoUpdate,
        run,
        values,
    }
}

const createClaimDb = ({
    claimedInvite = {id: "invite-1"},
    claimedPlayer = {boardId: "board-1"},
    existingPlayer,
    invitation = {
        id: "invite-1",
        playerId: "player-1",
        player: {boardId: "board-1", userId: null},
    },
}: {
    claimedInvite?: {id: string} | null
    claimedPlayer?: {boardId: string} | null
    existingPlayer?: {id: string}
    invitation?: {
        id: string
        playerId: string
        player: {boardId: string; userId: string | null}
    } | null
} = {}) => {
    const findInvite = vi.fn().mockResolvedValue(invitation)
    const findPlayer = vi.fn().mockResolvedValue(existingPlayer)

    const activeInvitation = {type: "active-invitation"}
    const selectWhere = vi.fn(() => activeInvitation)
    const from = vi.fn(() => ({where: selectWhere}))
    const select = vi.fn(() => ({from}))

    const playerQuery = {type: "claim-player"}
    const inviteQuery = {type: "claim-invite"}
    const returning = vi
        .fn()
        .mockReturnValueOnce(playerQuery)
        .mockReturnValueOnce(inviteQuery)
    const where = vi.fn(() => ({returning}))
    const set = vi.fn(() => ({where}))
    const update = vi.fn(() => ({set}))
    const batch = vi
        .fn()
        .mockResolvedValue([
            claimedPlayer ? [claimedPlayer] : [],
            claimedInvite ? [claimedInvite] : [],
        ])

    const db = {
        batch,
        query: {
            invite: {findFirst: findInvite},
            player: {findFirst: findPlayer},
        },
        select,
        update,
    } as unknown as Database

    return {batch, db, findInvite, findPlayer, set, update}
}

test("creates a URL-safe token with 256 bits of randomness", () => {
    expect(createToken()).toMatch(/^[0-9a-f]{64}$/)
})

test("hashes invitation tokens with SHA-256", async () => {
    expect(await hashToken("test")).toBe(
        "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    )
})

test("stores the token hash for an unclaimed board player", async () => {
    const {db, findFirst, insert, onConflictDoUpdate, run, values} =
        createInviteDb()

    const token = await invitePlayer(db, "board-1", "player-1")

    expect(token).not.toBeNull()

    if (!token) {
        throw new Error("Expected an invitation token")
    }

    const hashedToken = await hashToken(token)

    expect(findFirst).toHaveBeenCalledExactlyOnceWith({
        columns: {id: true},
        where: expect.any(Function),
    })
    expect(insert).toHaveBeenCalledExactlyOnceWith(invite)
    expect(values).toHaveBeenCalledExactlyOnceWith({
        playerId: "player-1",
        tokenHash: hashedToken,
    })
    expect(onConflictDoUpdate).toHaveBeenCalledExactlyOnceWith({
        target: invite.playerId,
        set: {
            claimedAt: null,
            tokenHash: hashedToken,
            updatedAt: expect.anything(),
        },
    })
    expect(run).toHaveBeenCalledTimes(1)
})

test("does not create an invitation for an unavailable player", async () => {
    const {db, insert} = createInviteDb({invitedPlayer: null})

    await expect(invitePlayer(db, "board-1", "player-1")).resolves.toBeNull()
    expect(insert).not.toHaveBeenCalled()
})

test("loads the unclaimed player and board for an invitation token", async () => {
    const invitedPlayer = {
        board: {id: "board-1"},
        id: "player-1",
        userId: null,
    }
    const findFirst = vi.fn().mockResolvedValue({player: invitedPlayer})
    const db = {
        query: {invite: {findFirst}},
    } as unknown as Database

    const result = await getInvitedPlayer(db, "invite-token")

    expect(result).toBe(invitedPlayer)
    expect(findFirst).toHaveBeenCalledExactlyOnceWith({
        where: expect.any(Function),
        with: {
            player: {
                with: {
                    board: {
                        with: {owner: true},
                    },
                },
            },
        },
    })
})

test("returns null when an invitation is missing or its player is claimed", async () => {
    const findFirst = vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({player: {userId: "user-1"}})
    const db = {
        query: {invite: {findFirst}},
    } as unknown as Database

    await expect(getInvitedPlayer(db, "missing-token")).resolves.toBeNull()
    await expect(getInvitedPlayer(db, "claimed-token")).resolves.toBeNull()
})

test("claims the invited player and invitation atomically", async () => {
    const {batch, db, findInvite, findPlayer, set, update} = createClaimDb()

    await expect(claimPlayer(db, "invite-token", "user-1")).resolves.toEqual({
        boardId: "board-1",
        status: "claimed",
    })
    expect(findInvite).toHaveBeenCalledTimes(1)
    expect(findPlayer).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenNthCalledWith(1, player)
    expect(update).toHaveBeenNthCalledWith(2, invite)
    expect(set).toHaveBeenNthCalledWith(1, {userId: "user-1"})
    expect(set).toHaveBeenNthCalledWith(2, {
        claimedAt: expect.anything(),
    })
    expect(batch).toHaveBeenCalledTimes(1)
})

test("does not claim an invalid invitation", async () => {
    const {batch, db, findPlayer, update} = createClaimDb({invitation: null})

    await expect(claimPlayer(db, "invalid-token", "user-1")).resolves.toEqual({
        status: "invalid",
    })
    expect(findPlayer).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
    expect(batch).not.toHaveBeenCalled()
})

test("does not claim an invitation whose player is already claimed", async () => {
    const {batch, db, findPlayer} = createClaimDb({
        invitation: {
            id: "invite-1",
            playerId: "player-1",
            player: {boardId: "board-1", userId: "user-2"},
        },
    })

    await expect(claimPlayer(db, "invite-token", "user-1")).resolves.toEqual({
        status: "invalid",
    })
    expect(findPlayer).not.toHaveBeenCalled()
    expect(batch).not.toHaveBeenCalled()
})

test("does not let a user claim two players on one board", async () => {
    const {batch, db} = createClaimDb({
        existingPlayer: {id: "player-2"},
    })

    await expect(claimPlayer(db, "invite-token", "user-1")).resolves.toEqual({
        status: "already-claimed",
    })
    expect(batch).not.toHaveBeenCalled()
})

test("handles an invitation claimed during the request", async () => {
    const {db} = createClaimDb({claimedInvite: null, claimedPlayer: null})

    await expect(claimPlayer(db, "invite-token", "user-1")).resolves.toEqual({
        status: "invalid",
    })
})
