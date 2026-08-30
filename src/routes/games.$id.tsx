import {Link} from "react-router"

import Board from "~/components/Board"
import {getGame} from "~/utils/games"

import type {Route} from "./+types/games.$id"

export const loader = async ({params}: Route.LoaderArgs) => {
    return getGame(params.id)
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
