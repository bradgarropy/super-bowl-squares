import {
    pgTable,
    serial,
    text,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core"

const users = pgTable(
    "User",
    {
        id: serial("id").primaryKey(),
        firstName: text("firstName").notNull(),
        lastName: text("lastName").notNull(),
        email: text("email").notNull(),
        password: text("password").notNull(),
        createdAt: timestamp("createdAt", {
            mode: "date",
            precision: 3,
        })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updatedAt", {
            mode: "date",
            precision: 3,
        })
            .$defaultFn(() => new Date())
            .$onUpdate(() => new Date())
            .notNull(),
    },
    table => [uniqueIndex("User_email_key").on(table.email)],
)

export {users}
