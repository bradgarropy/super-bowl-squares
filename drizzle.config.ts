import {defineConfig} from "drizzle-kit"

const config = defineConfig({
    dialect: "sqlite",
    out: "drizzle",
    schema: "src/db/schema.ts",
})

export default config
