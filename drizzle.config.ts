import "dotenv/config"

import {defineConfig} from "drizzle-kit"

const config = defineConfig({
    dialect: "postgresql",
    out: "drizzle",
    schema: "src/db/schema.ts",
    dbCredentials: {
        url: process.env.DATABASE_URL_UNPOOLED!,
    },
})

export default config
