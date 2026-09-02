import {Form, Link, useRouteLoaderData} from "react-router"

import type {loader} from "~/root"

const Header = () => {
    const data = useRouteLoaderData<typeof loader>("root")
    const user = data?.user

    return (
        <header className="flex justify-between items-center px-8 py-12">
            <h1 className="text-3xl font-bold">Super Bowl Squares</h1>

            <nav className="flex items-center gap-4">
                <Link to="/games">games</Link>

                {user ? (
                    <>
                        <Link to="/boards">boards</Link>

                        <Form method="post" action="/logout">
                            <button type="submit">logout</button>
                        </Form>
                    </>
                ) : (
                    <Link to="/login">login</Link>
                )}
            </nav>
        </header>
    )
}

export default Header
