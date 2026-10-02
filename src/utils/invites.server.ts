import {env} from "cloudflare:workers"
import type {JWTPayload} from "jose"
import {jwtVerify, SignJWT} from "jose"

import type {Board, Player} from "~/db/schema"

type InviteTokenPayload = JWTPayload & {
    boardId: Board["id"]
    playerId: Player["id"]
}

const getSecret = () => {
    const secret = env.INVITE_TOKEN_SECRET

    if (!secret) {
        throw new Error("Invite token secret is required")
    }

    return new TextEncoder().encode(secret)
}

const signToken = async (payload: InviteTokenPayload) => {
    const signedToken = new SignJWT(payload)
        .setProtectedHeader({alg: "HS256"})
        .sign(getSecret())

    return signedToken
}

const verifyToken = async (
    token: string,
): Promise<InviteTokenPayload | null> => {
    try {
        const {payload} = await jwtVerify<InviteTokenPayload>(
            token,
            getSecret(),
            {algorithms: ["HS256"]},
        )

        return payload
    } catch {
        return null
    }
}

export {signToken, verifyToken}
export type {InviteTokenPayload}
