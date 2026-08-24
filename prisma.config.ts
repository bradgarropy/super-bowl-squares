import "dotenv/config"

import {defineConfig, env} from "prisma/config"

const config = defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: env("DATABASE_URL_UNPOOLED"),
    },
})

export default config
