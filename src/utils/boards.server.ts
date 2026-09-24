import type {Database} from "~/db/client.server"
import type {Board} from "~/db/schema"

const getBoard = (db: Database, boardId: Board["id"]) => {
    const board = db.query.board.findFirst({
        where: (board, {eq}) => eq(board.id, boardId),
        with: {
            players: {
                orderBy: (player, {asc}) => [
                    asc(player.createdAt),
                    asc(player.id),
                ],
            },
            squares: {
                orderBy: (square, {asc}) => [
                    asc(square.row),
                    asc(square.column),
                ],
                with: {player: true},
            },
        },
    })

    return board
}

const getUserBoard = (
    db: Database,
    boardId: Board["id"],
    userId: NonNullable<Board["ownerId"]>,
) => {
    const board = db.query.board.findFirst({
        where: (board, {and, eq}) =>
            and(eq(board.id, boardId), eq(board.ownerId, userId)),
        with: {
            players: {
                orderBy: (player, {asc}) => [
                    asc(player.createdAt),
                    asc(player.id),
                ],
            },
            squares: {
                orderBy: (square, {asc}) => [
                    asc(square.row),
                    asc(square.column),
                ],
                with: {player: true},
            },
        },
    })

    return board
}

const getUserBoards = (db: Database, userId: NonNullable<Board["ownerId"]>) => {
    const boards = db.query.board.findMany({
        where: (board, {eq}) => eq(board.ownerId, userId),
        orderBy: (board, {desc}) => desc(board.createdAt),
    })

    return boards
}

export {getBoard, getUserBoard, getUserBoards}
