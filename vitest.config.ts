import react from "@vitejs/plugin-react"
import {defineConfig} from "vitest/config"

const config = defineConfig({
    plugins: [react()],
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        clearMocks: true,
        coverage: {
            clean: true,
            cleanOnRerun: true,
            enabled: true,
            provider: "v8",
            reporter: ["text", "lcov"],
            reportOnFailure: false,
        },
        environment: "jsdom",
        globals: false,
        passWithNoTests: true,
        setupFiles: [],
        watch: false,
    },
})

export default config
