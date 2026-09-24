import {eq} from "drizzle-orm"
import type {BatchItem} from "drizzle-orm/batch"

import type {Database} from "~/db/client.server"
import {type Board, type Player, square} from "~/db/schema"
import {assignSquares} from "~/utils/assign"

type Query = BatchItem<"sqlite">

const createShuffleQueries = (
    db: Database,
    boardId: Board["id"],
    playerIds: Player["id"][],
): [Query, ...Query[]] => {
    const assignments = assignSquares(playerIds)
    const deleteSquares = db.delete(square).where(eq(square.boardId, boardId))

    if (assignments.length === 0) {
        return [deleteSquares]
    }

    const squares = assignments.map(assignment => ({
        ...assignment,
        boardId,
    }))

    return [
        deleteSquares,
        db.insert(square).values(squares.slice(0, 25)),
        db.insert(square).values(squares.slice(25, 50)),
        db.insert(square).values(squares.slice(50, 75)),
        db.insert(square).values(squares.slice(75, 100)),
    ]
}

const shuffleBoard = (
    db: Database,
    boardId: Board["id"],
    playerIds: Player["id"][],
) => {
    return db.batch(createShuffleQueries(db, boardId, playerIds))
}

export {createShuffleQueries, shuffleBoard}
