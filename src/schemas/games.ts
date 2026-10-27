import {z} from "zod"

const createBoardSchema = z.object({
    gameId: z.string().trim().min(1, "Game is required."),
})

type CreateBoardForm = z.infer<typeof createBoardSchema>

export {createBoardSchema}
export type {CreateBoardForm}
