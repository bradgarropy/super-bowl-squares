import {and, eq} from "drizzle-orm"

import type {createDb} from "~/db/client.server"
import {player} from "~/db/schema"
import {createShuffleQueries} from "~/utils/squares.server"

type Database = ReturnType<typeof createDb>
type Board = {
    id: string
    players: {id: string}[]
}

const addPlayer = (db: Database, board: Board, name: string) => {
    const playerId = crypto.randomUUID()
    const insertPlayer = db
        .insert(player)
        .values({id: playerId, boardId: board.id, name})
    const playerIds = board.players.map(player => player.id)

    return db.batch([
        insertPlayer,
        ...createShuffleQueries(db, board.id, [...playerIds, playerId]),
    ])
}

const removePlayer = (db: Database, board: Board, playerId: string) => {
    const deletePlayer = db
        .delete(player)
        .where(and(eq(player.id, playerId), eq(player.boardId, board.id)))
    const playerIds = board.players.map(player => player.id)

    return db.batch([
        deletePlayer,
        ...createShuffleQueries(
            db,
            board.id,
            playerIds.filter(id => id !== playerId),
        ),
    ])
}

export {addPlayer, removePlayer}
