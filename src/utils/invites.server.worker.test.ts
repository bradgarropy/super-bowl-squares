import {expect, test, vi} from "vitest"

import {signToken, verifyToken} from "~/utils/invites.server"

const workerEnv = vi.hoisted(() => ({
    INVITE_TOKEN_SECRET: "test-invite-secret",
}))

vi.mock("cloudflare:workers", () => ({env: workerEnv}))

const payload = {boardId: "board-1", playerId: "player-1"}

test("signs and verifies an invitation token", async () => {
    const token = await signToken(payload)

    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
    expect(await verifyToken(token)).toEqual(payload)
})

test("creates the same signature for the same invitation", async () => {
    expect(await signToken(payload)).toBe(await signToken(payload))
})

test("rejects an invitation signed with another secret", async () => {
    const token = await signToken(payload)
    workerEnv.INVITE_TOKEN_SECRET = "another-secret"

    expect(await verifyToken(token)).toBeNull()

    workerEnv.INVITE_TOKEN_SECRET = "test-invite-secret"
})

test("rejects a modified invitation", async () => {
    const token = await signToken(payload)
    const [header, encodedPayload, signature] = token.split(".")
    const modifiedPayload = `${encodedPayload.slice(0, -1)}A`

    expect(
        await verifyToken(`${header}.${modifiedPayload}.${signature}`),
    ).toBeNull()
})

test.each([
    "not-a-token",
    "one.two.three.four",
    "payload.invalid!",
    "bnVsbA.signature",
])("rejects the malformed invitation token %s", async token => {
    expect(await verifyToken(token)).toBeNull()
})

test("rejects an invitation token when its secret is missing", async () => {
    const token = await signToken(payload)
    workerEnv.INVITE_TOKEN_SECRET = ""

    expect(await verifyToken(token)).toBeNull()

    workerEnv.INVITE_TOKEN_SECRET = "test-invite-secret"
})

test("requires a secret when signing an invitation", async () => {
    workerEnv.INVITE_TOKEN_SECRET = ""

    await expect(signToken(payload)).rejects.toThrow(
        "Invite token secret is required",
    )

    workerEnv.INVITE_TOKEN_SECRET = "test-invite-secret"
})
