import {and, eq, isNull} from "drizzle-orm"

import type {Database} from "~/db/client.server"
import {type Board, type Player, player} from "~/db/schema"

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

    const invitedPlayer = await db
        .update(player)
        .set({inviteTokenHash: hashedToken})
        .where(
            and(
                eq(player.id, playerId),
                eq(player.boardId, boardId),
                isNull(player.userId),
            ),
        )
        .returning({id: player.id})
        .get()

    return invitedPlayer ? token : null
}

const getInvitedPlayer = async (db: Database, token: string) => {
    const inviteTokenHash = await hashToken(token)

    const invitedPlayer = db.query.player.findFirst({
        where: (player, {and, eq, isNull}) =>
            and(
                eq(player.inviteTokenHash, inviteTokenHash),
                isNull(player.userId),
            ),
        with: {
            board: {
                with: {owner: true},
            },
        },
    })

    return invitedPlayer
}

export {createToken, getInvitedPlayer, hashToken, invitePlayer}
