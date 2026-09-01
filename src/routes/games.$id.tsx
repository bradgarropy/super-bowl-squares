import {data, Link, redirect} from "react-router"

import Board from "~/components/Board"
import {dbCtx} from "~/db/client.server"
import {board} from "~/db/schema"
import {requireUser} from "~/utils/auth.server"
import {getGame} from "~/utils/games"

import type {Route} from "./+types/games.$id"

export const loader = async ({params}: Route.LoaderArgs) => {
    return getGame(params.id)
}

export const action = async ({context, params, request}: Route.ActionArgs) => {
    const user = await requireUser(request)
    const game = await getGame(params.id)

    if (game.state !== "pre") {
        return data(
            {error: "Boards cannot be created after a game has started."},
            {status: 409},
        )
    }

    const db = context.get(dbCtx)

    const createdBoard = await db
        .insert(board)
        .values({gameId: game.id, ownerId: user.id})
        .returning({id: board.id})
        .get()

    return redirect(`/boards/${createdBoard.id}`)
}

export const meta: Route.MetaFunction = ({params}) => {
    return [{title: `🏈 super bowl squares | game ${params.id}`}]
}

const Game = ({loaderData: game}: Route.ComponentProps) => {
    return (
        <main className="space-y-6">
            <Link to="/games" className="underline underline-offset-4">
                Back to games
            </Link>

            <Board key={game.id} game={game} />
        </main>
    )
}

export default Game
