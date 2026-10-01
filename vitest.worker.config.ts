import {cloudflareTest} from "@cloudflare/vitest-plugin"
import {defineConfig} from "vitest/config"

const config = defineConfig({
    plugins: [
        cloudflareTest({
            wrangler: {configPath: "./wrangler.jsonc"},
        }),
    ],
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        clearMocks: true,
        globals: false,
        include: ["src/**/*.worker.test.{ts,tsx}"],
        name: "worker",
    },
})

export default config
