import {and, eq, exists, isNull, sql} from "drizzle-orm"

import type {Database} from "~/db/client.server"
import {type Board, invite, type Player, player} from "~/db/schema"

const toHex = (bytes: Uint8Array) => {
    const hex = Array.from(bytes, byte =>
        byte.toString(16).padStart(2, "0"),
    ).join("")

    return hex
}

const createToken = () => {
    const token = toHex(crypto.getRandomValues(new Uint8Array(32)))
    return token
}

const hashToken = async (token: string) => {
    const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(token),
    )

    const hashedToken = toHex(new Uint8Array(digest))
    return hashedToken
}

const invitePlayer = async (
    db: Database,
    boardId: Board["id"],
    playerId: Player["id"],
) => {
    const token = createToken()
    const hashedToken = await hashToken(token)

    const invitedPlayer = await db.query.player.findFirst({
        columns: {id: true},
        where: (player, {and, eq, isNull}) =>
            and(
                eq(player.id, playerId),
                eq(player.boardId, boardId),
                isNull(player.userId),
            ),
    })

    if (!invitedPlayer) {
        return null
    }

    await db
        .insert(invite)
        .values({playerId: invitedPlayer.id, tokenHash: hashedToken})
        .onConflictDoUpdate({
            target: invite.playerId,
            set: {
                claimedAt: null,
                tokenHash: hashedToken,
                updatedAt: sql`(current_timestamp)`,
            },
        })
        .run()

    return token
}

const getInvitation = async (db: Database, token: string) => {
    const hashedToken = await hashToken(token)

    const invitation = await db.query.invite.findFirst({
        where: (invite, {eq}) => eq(invite.tokenHash, hashedToken),
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

    if (!invitation) {
        return null
    }

    return invitation
}

const revokeInvitation = async (
    db: Database,
    boardId: Board["id"],
    playerId: Player["id"],
) => {
    const unclaimedPlayer = db
        .select({id: player.id})
        .from(player)
        .where(
            and(
                eq(player.id, playerId),
                eq(player.boardId, boardId),
                isNull(player.userId),
            ),
        )

    const revokedInvitation = await db
        .delete(invite)
        .where(and(eq(invite.playerId, playerId), exists(unclaimedPlayer)))
        .returning({id: invite.id})
        .get()

    return Boolean(revokedInvitation)
}

const claimPlayer = async (
    db: Database,
    token: string,
    userId: NonNullable<Player["userId"]>,
) => {
    const hashedToken = await hashToken(token)

    const invitation = await db.query.invite.findFirst({
        columns: {id: true, playerId: true},
        where: (invite, {and, eq, isNull}) =>
            and(eq(invite.tokenHash, hashedToken), isNull(invite.claimedAt)),
        with: {
            player: {
                columns: {boardId: true, userId: true},
            },
        },
    })

    if (!invitation || invitation.player.userId) {
        return {status: "invalid"} as const
    }

    const existingPlayer = await db.query.player.findFirst({
        columns: {id: true},
        where: (player, {and, eq}) =>
            and(
                eq(player.boardId, invitation.player.boardId),
                eq(player.userId, userId),
            ),
    })

    if (existingPlayer) {
        return {status: "already-claimed"} as const
    }

    const activeInvitation = db
        .select({id: invite.id})
        .from(invite)
        .where(
            and(
                eq(invite.id, invitation.id),
                eq(invite.tokenHash, hashedToken),
                isNull(invite.claimedAt),
            ),
        )

    const claimPlayerQuery = db
        .update(player)
        .set({userId})
        .where(
            and(
                eq(player.id, invitation.playerId),
                isNull(player.userId),
                exists(activeInvitation),
            ),
        )
        .returning({boardId: player.boardId})

    const claimInviteQuery = db
        .update(invite)
        .set({claimedAt: sql`(current_timestamp)`})
        .where(
            and(
                eq(invite.id, invitation.id),
                eq(invite.tokenHash, hashedToken),
                isNull(invite.claimedAt),
            ),
        )
        .returning({id: invite.id})

    const [claimedPlayers, claimedInvites] = await db.batch([
        claimPlayerQuery,
        claimInviteQuery,
    ])

    const claimedPlayer = claimedPlayers[0]
    const claimedInvite = claimedInvites[0]

    if (!claimedPlayer || !claimedInvite) {
        return {status: "invalid"} as const
    }

    return {boardId: claimedPlayer.boardId, status: "claimed"} as const
}

export {
    claimPlayer,
    createToken,
    getInvitation,
    hashToken,
    invitePlayer,
    revokeInvitation,
}
