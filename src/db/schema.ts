import {sql} from "drizzle-orm"
import {integer, sqliteTable, text, uniqueIndex} from "drizzle-orm/sqlite-core"

const users = sqliteTable(
    "legacy_user",
    {
        id: integer("id").primaryKey({autoIncrement: true}),
        firstName: text("firstName").notNull(),
        lastName: text("lastName").notNull(),
        email: text("email").notNull(),
        password: text("password").notNull(),
        createdAt: text("createdAt")
            .default(sql`(current_timestamp)`)
            .notNull(),
        updatedAt: text("updatedAt")
            .default(sql`(current_timestamp)`)
            .$onUpdate(() => sql`(current_timestamp)`)
            .notNull(),
    },
    table => [uniqueIndex("User_email_key").on(table.email)],
)

export * from "~/db/auth"
export {users}
