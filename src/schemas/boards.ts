import {z} from "zod"

const playerIdSchema = z
    .string({error: "Player is required."})
    .min(1, "Player is required.")

const invitePlayerSchema = z.object({
    intent: z.literal("invite"),
    playerId: playerIdSchema,
})

const revokeInvitationSchema = z.object({
    intent: z.literal("revoke-invite"),
    playerId: playerIdSchema,
})

const shuffleBoardSchema = z.object({
    intent: z.literal("shuffle"),
})

const addPlayerSchema = z.object({
    intent: z.literal("add"),
    name: z
        .string({error: "Player name is required."})
        .trim()
        .min(1, "Player name is required.")
        .max(100, "Player name must be 100 characters or fewer."),
})

const removePlayerSchema = z.object({
    intent: z.literal("remove"),
    playerId: playerIdSchema,
})

const boardActionSchema = z.discriminatedUnion(
    "intent",
    [
        invitePlayerSchema,
        revokeInvitationSchema,
        shuffleBoardSchema,
        addPlayerSchema,
        removePlayerSchema,
    ],
    {error: "Invalid action."},
)

type BoardAction = z.infer<typeof boardActionSchema>

export {boardActionSchema}
export type {BoardAction}
