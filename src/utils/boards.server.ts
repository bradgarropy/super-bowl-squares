import type {Database} from "~/db/client.server"
import type {Board, User} from "~/db/schema"

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
    userId: User["id"],
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

const getUserBoards = (db: Database, userId: User["id"]) => {
    const boards = db.query.board.findMany({
        where: (board, {eq}) => eq(board.ownerId, userId),
        orderBy: (board, {desc}) => desc(board.createdAt),
    })

    return boards
}

const getJoinedBoards = async (db: Database, userId: User["id"]) => {
    const memberships = await db.query.player.findMany({
        where: (player, {eq}) => eq(player.userId, userId),
        with: {board: true},
    })

    const boards = memberships
        .map(membership => membership.board)
        .filter(board => board.ownerId !== userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    return boards
}

export {getBoard, getJoinedBoards, getUserBoard, getUserBoards}
