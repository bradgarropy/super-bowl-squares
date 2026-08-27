import {drizzle} from "drizzle-orm/d1"
import {createContext} from "react-router"

import * as schema from "~/db/schema"

const createDb = (binding: Env["DB"]) => drizzle(binding, {schema})

const dbCtx = createContext<ReturnType<typeof createDb>>()

export {createDb, dbCtx}
