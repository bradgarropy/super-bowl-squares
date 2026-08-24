import {Link} from "react-router"

import {requireUser} from "~/utils/auth.server"
import {getBoards} from "~/utils/boards"

import type {Route} from "./+types/boards._index"

export const loader = async ({request}: Route.LoaderArgs) => {
    const user = await requireUser(request)
    const boards = getBoards(user.id)

    return {boards}
}

const Boards = ({loaderData}: Route.ComponentProps) => {
    const {boards} = loaderData
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

export default Boards
