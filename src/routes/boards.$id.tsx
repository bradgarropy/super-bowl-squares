import {data, Link} from "react-router"

import Board from "~/components/Board"
import {dbCtx} from "~/db/client.server"
import {requireUser} from "~/utils/auth.server"
import {getUserBoard} from "~/utils/boards.server"
import {getGame} from "~/utils/games"

import type {Route} from "./+types/boards.$id"

export const loader = async ({context, params, request}: Route.LoaderArgs) => {
    const user = await requireUser(request)
    const db = context.get(dbCtx)

    const board = await getUserBoard(db, params.id, user.id)

    if (!board) {
        throw data("Board not found", {status: 404})
    }

    const game = await getGame(board.gameId)

    return {board, game}
}

export const meta: Route.MetaFunction = ({params}) => {
    return [{title: `🏈 super bowl squares | board ${params.id}`}]
}

const BoardRoute = ({loaderData}: Route.ComponentProps) => {
    const {game} = loaderData

    return (
        <main className="space-y-6">
            <Link
                to={`/games/${game.id}`}
                className="underline underline-offset-4"
            >
                Back to game
            </Link>

            <Board key={game.id} game={game} />
        </main>
    )
}

export default BoardRoute
