import {drizzle} from "drizzle-orm/node-postgres"
import {Pool} from "pg"

import * as schema from "~/db/schema"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

const db = drizzle(pool, {schema})

export {db}
