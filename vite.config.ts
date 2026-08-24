import {reactRouter} from "@react-router/dev/vite"
import {defineConfig} from "vite"

const config = defineConfig({
    plugins: [reactRouter()],
    resolve: {
        tsconfigPaths: true,
    },
})

export default config
