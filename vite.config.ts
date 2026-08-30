import {cloudflare} from "@cloudflare/vite-plugin"
import {reactRouter} from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import {defineConfig} from "vite"
import devtoolsJson from "vite-plugin-devtools-json"

const config = defineConfig({
    plugins: [
        devtoolsJson(),
        tailwindcss(),
        cloudflare({viteEnvironment: {name: "ssr"}}),
        reactRouter(),
    ],
    resolve: {
        tsconfigPaths: true,
    },
})

export default config
