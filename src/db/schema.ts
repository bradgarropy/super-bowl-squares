import {relations, sql} from "drizzle-orm"
import {
    check,
    index,
    integer,
    primaryKey,
    sqliteTable,
    text,
    uniqueIndex,
} from "drizzle-orm/sqlite-core"

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

const player = sqliteTable(
    "player",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        boardId: text("board_id")
            .notNull()
            .references(() => board.id, {onDelete: "cascade"}),
        userId: text("user_id").references(() => user.id, {
            onDelete: "set null",
        }),
        name: text("name").notNull(),
        createdAt: text("created_at")
            .default(sql`(current_timestamp)`)
            .notNull(),
        updatedAt: text("updated_at")
            .default(sql`(current_timestamp)`)
            .$onUpdate(() => sql`(current_timestamp)`)
            .notNull(),
    },
    table => [
        uniqueIndex("player_board_id_user_id_idx").on(
            table.boardId,
            table.userId,
        ),
        index("player_user_id_idx").on(table.userId),
    ],
)

const square = sqliteTable(
    "square",
    {
        boardId: text("board_id")
            .notNull()
            .references(() => board.id, {onDelete: "cascade"}),
        playerId: text("player_id")
            .notNull()
            .references(() => player.id, {onDelete: "cascade"}),
        row: integer("row").notNull(),
        column: integer("column").notNull(),
    },
    table => [
        primaryKey({columns: [table.boardId, table.row, table.column]}),
        index("square_player_id_idx").on(table.playerId),
        check("square_row_check", sql`${table.row} between 0 and 9`),
        check("square_column_check", sql`${table.column} between 0 and 9`),
    ],
)

const boardRelations = relations(board, ({one, many}) => ({
    owner: one(user, {
        fields: [board.ownerId],
        references: [user.id],
    }),
    players: many(player),
    squares: many(square),
}))

const playerRelations = relations(player, ({one, many}) => ({
    board: one(board, {
        fields: [player.boardId],
        references: [board.id],
    }),
    user: one(user, {
        fields: [player.userId],
        references: [user.id],
    }),
    squares: many(square),
}))

const squareRelations = relations(square, ({one}) => ({
    board: one(board, {
        fields: [square.boardId],
        references: [board.id],
    }),
    player: one(player, {
        fields: [square.playerId],
        references: [player.id],
    }),
}))

export * from "~/db/auth"
export {board, boardRelations, player, playerRelations, square, squareRelations}
