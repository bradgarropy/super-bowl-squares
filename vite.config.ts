import {cloudflare} from "@cloudflare/vite-plugin"
import {reactRouter} from "@react-router/dev/vite"
import {defineConfig} from "vite"

const config = defineConfig({
    plugins: [cloudflare({viteEnvironment: {name: "ssr"}}), reactRouter()],
    resolve: {
        tsconfigPaths: true,
    },
})

export default config
