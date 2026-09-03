import {relations, sql} from "drizzle-orm"
import {index, sqliteTable, text, uniqueIndex} from "drizzle-orm/sqlite-core"

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

const boardMember = sqliteTable(
    "board_member",
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
        email: text("email").notNull(),
        createdAt: text("created_at")
            .default(sql`(current_timestamp)`)
            .notNull(),
        updatedAt: text("updated_at")
            .default(sql`(current_timestamp)`)
            .$onUpdate(() => sql`(current_timestamp)`)
            .notNull(),
    },
    table => [
        uniqueIndex("board_member_board_id_email_idx").on(
            table.boardId,
            table.email,
        ),
        uniqueIndex("board_member_board_id_user_id_idx").on(
            table.boardId,
            table.userId,
        ),
        index("board_member_user_id_idx").on(table.userId),
    ],
)

const boardRelations = relations(board, ({one, many}) => ({
    owner: one(user, {
        fields: [board.ownerId],
        references: [user.id],
    }),
    members: many(boardMember),
}))

const boardMemberRelations = relations(boardMember, ({one}) => ({
    board: one(board, {
        fields: [boardMember.boardId],
        references: [board.id],
    }),
    user: one(user, {
        fields: [boardMember.userId],
        references: [user.id],
    }),
}))

export * from "~/db/auth"
export {board, boardMember, boardMemberRelations, boardRelations}
