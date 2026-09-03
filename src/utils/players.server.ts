import {and, eq} from "drizzle-orm"

import type {createDb} from "~/db/client.server"
import {player} from "~/db/schema"

type Database = ReturnType<typeof createDb>

const addPlayer = (db: Database, boardId: string, name: string) => {
    return db.insert(player).values({boardId, name}).run()
}

const removePlayer = (db: Database, boardId: string, playerId: string) => {
    return db
        .delete(player)
        .where(and(eq(player.id, playerId), eq(player.boardId, boardId)))
        .run()
}

export {addPlayer, removePlayer}
