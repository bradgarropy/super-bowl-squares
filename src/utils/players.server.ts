import {and, eq} from "drizzle-orm"

import type {Database} from "~/db/client.server"
import {type Board, type NewPlayer, type Player, player} from "~/db/schema"
import {createShuffleQueries} from "~/utils/squares.server"

type BoardWithPlayers = Pick<Board, "id"> & {
    players: Pick<Player, "id">[]
}

const addPlayer = (
    db: Database,
    board: BoardWithPlayers,
    name: NewPlayer["name"],
) => {
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

const removePlayer = (
    db: Database,
    board: BoardWithPlayers,
    playerId: Player["id"],
) => {
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
