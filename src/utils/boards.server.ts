import type {createDb} from "~/db/client.server"

type Database = ReturnType<typeof createDb>

const getUserBoard = (db: Database, boardId: string, userId: string) => {
    const board = db.query.board.findFirst({
        where: (board, {and, eq}) =>
            and(eq(board.id, boardId), eq(board.ownerId, userId)),
    })

    return board
}

export {getUserBoard}
