import {relations, sql} from "drizzle-orm"
import {index, sqliteTable, text} from "drizzle-orm/sqlite-core"

import {user} from "~/db/auth"

const board = sqliteTable(
    "board",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        gameId: text("game_id").notNull(),
        ownerId: text("owner_id").references(() => user.id, {
            onDelete: "set null",
        }),
        createdAt: text("created_at")
            .default(sql`(current_timestamp)`)
            .notNull(),
        updatedAt: text("updated_at")
            .default(sql`(current_timestamp)`)
            .$onUpdate(() => sql`(current_timestamp)`)
            .notNull(),
    },
    table => [
        index("board_game_id_idx").on(table.gameId),
        index("board_owner_id_idx").on(table.ownerId),
    ],
)

const boardRelations = relations(board, ({one}) => ({
    owner: one(user, {
        fields: [board.ownerId],
        references: [user.id],
    }),
}))

export * from "~/db/auth"
export {board, boardRelations}
