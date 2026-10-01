import react from "@vitejs/plugin-react"
import {defineProject} from "vitest/config"

const config = defineProject({
    plugins: [react()],
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        clearMocks: true,
        environment: "jsdom",
        globals: false,
        include: ["src/**/*.browser.test.{ts,tsx}"],
        name: "browser",
        setupFiles: ["./src/tests/setup.ts"],
    },
})

export default config
