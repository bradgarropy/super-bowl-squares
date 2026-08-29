import {Link} from "react-router"

import type {Route} from "./+types/games.$id"

export const meta: Route.MetaFunction = ({params}) => {
    return [{title: `🏈 super bowl squares | game ${params.id}`}]
}

const Game = ({params}: Route.ComponentProps) => {
    return (
        <main className="space-y-6">
            <Link to="/games" className="underline underline-offset-4">
                Back to games
            </Link>

            <h1 className="text-2xl font-bold">Game {params.id}</h1>
            <p>Game details and the board are coming next.</p>
        </main>
    )
}

export default Game
