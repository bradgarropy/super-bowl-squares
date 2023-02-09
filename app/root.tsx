import type {LinksFunction, MetaFunction} from "@remix-run/node"
import {
    Links,
    LiveReload,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from "@remix-run/react"

import Footer from "~/components/Footer/Footer"
import Header from "~/components/Header/Header"
import tailwindStyles from "~/styles/tailwind.css"

const meta: MetaFunction = () => ({
    charset: "utf-8",
    title: "🏈 super bowl squares",
    viewport: "width=device-width,initial-scale=1",
})

const links: LinksFunction = () => {
    const links = [
        {
            rel: "stylesheet",
            href: tailwindStyles,
        },
    ]

    return links
}

const App = () => {
    return (
        <html lang="en">
            <head>
                <Meta />
                <Links />
            </head>

            <body className="bg-green-800 text-white">
                <div className="min-h-screen grid grid-rows-layout">
                    <Header />

                    <div className="p-8">
                        <Outlet />
                    </div>

                    <Footer />
                </div>

                <ScrollRestoration />
                <Scripts />
                <LiveReload />
            </body>
        </html>
    )
}

export default App
export {links, meta}
