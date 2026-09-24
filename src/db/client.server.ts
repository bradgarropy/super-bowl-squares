import {drizzle} from "drizzle-orm/d1"
import {createContext} from "react-router"

import * as schema from "~/db/schema"

const createDb = (binding: Env["DB"]) => drizzle(binding, {schema})

type Database = ReturnType<typeof createDb>

const dbCtx = createContext<Database>()

export {createDb, dbCtx}
export type {Database}
