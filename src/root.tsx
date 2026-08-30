import {Links, Meta, Outlet, Scripts, ScrollRestoration} from "react-router"

import Footer from "~/components/Footer/Footer"
import Header from "~/components/Header/Header"
import tailwindStyles from "~/styles/tailwind.css?url"
import {getSession} from "~/utils/session.server"

import type {Route} from "./+types/root"

const meta: Route.MetaFunction = () => {
    return [
        {charset: "utf-8"},
        {title: "🏈 super bowl squares"},
        {viewport: "width=device-width,initial-scale=1"},
    ]
}

const links: Route.LinksFunction = () => {
    const links = [
        {
            rel: "stylesheet",
            href: tailwindStyles,
        },
    ]

    return links
}

export const loader = async ({request}: Route.LoaderArgs) => {
    const session = await getSession(request.headers.get("Cookie"))
    const user = session.get("user")

    return {user}
}

const App = () => {
    return (
        <html lang="en">
            <head>
                <Meta />
                <Links />
            </head>

            <body className="bg-green-800 text-white">
                <div className="grid min-h-screen grid-rows-[auto_1fr_auto]">
                    <Header />

                    <div className="p-8">
                        <Outlet />
                    </div>

                    <Footer />
                </div>

                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    )
}

export default App
export {links, meta}
