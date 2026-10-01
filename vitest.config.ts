import {defineConfig} from "vitest/config"

const config = defineConfig({
    test: {
        coverage: {
            clean: true,
            cleanOnRerun: true,
            enabled: true,
            provider: "istanbul",
            reporter: ["text", "lcov"],
            reportOnFailure: false,
        },
        passWithNoTests: true,
        projects: ["./vitest.browser.config.ts", "./vitest.worker.config.ts"],
        watch: false,
    },
})

export default config
