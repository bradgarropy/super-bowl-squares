import type {createDb} from "~/db/client.server"

type Database = ReturnType<typeof createDb>

const getUserBoard = (db: Database, boardId: string, userId: string) => {
    const board = db.query.board.findFirst({
        where: (board, {and, eq}) =>
            and(eq(board.id, boardId), eq(board.ownerId, userId)),
        with: {
            members: {
                orderBy: (member, {asc}) => [
                    asc(member.createdAt),
                    asc(member.id),
                ],
            },
        },
    })

    return board
}

const getUserBoards = (db: Database, userId: string) => {
    const boards = db.query.board.findMany({
        where: (board, {eq}) => eq(board.ownerId, userId),
        orderBy: (board, {desc}) => desc(board.createdAt),
    })

    return boards
}

export {getUserBoard, getUserBoards}
