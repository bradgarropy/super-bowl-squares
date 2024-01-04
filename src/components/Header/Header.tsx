import {Form, Link, useLoaderData} from "@remix-run/react"

import type {loader} from "~/root"

const Header = () => {
    const {user} = useLoaderData<typeof loader>()

    return (
        <header className="flex justify-between items-center px-8 py-12">
            <h1 className="text-3xl font-bold">Super Bowl Squares</h1>

            {user ? (
                <Form method="post" action="/logout">
                    <button type="submit">logout</button>
                </Form>
            ) : (
                <Link to="/login">login</Link>
            )}
        </header>
    )
}

export default Header
