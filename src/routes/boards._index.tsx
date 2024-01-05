import type {LoaderFunctionArgs} from "@remix-run/node"
import {json} from "@remix-run/node"
import {Link, useLoaderData} from "@remix-run/react"

import {requireUser} from "~/utils/auth.server"
import {getBoards} from "~/utils/boards"

export const loader = async ({request}: LoaderFunctionArgs) => {
    const user = await requireUser(request)
    const boards = getBoards(user.id)

    return json({boards})
}

const Route = () => {
    const {boards} = useLoaderData<typeof loader>()

    return (
        <>
            <Link to="/boards/new">Create a new board</Link>

            <h1>boards</h1>

            {boards.map(board => {
                return (
                    <div key={board.id}>
                        <Link to={`/boards/${board.id}`}>{board.id}</Link>
                    </div>
                )
            })}
        </>
    )
}

export default Route
