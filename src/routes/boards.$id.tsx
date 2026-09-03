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
    const {board, game} = loaderData

    return (
        <main className="space-y-6">
            <Link to="/games" className="underline underline-offset-4">
                Back to games
            </Link>

            <Board key={game.id} game={game} />

            <section
                aria-labelledby="members-heading"
                className="mx-auto max-w-3xl space-y-4"
            >
                <h2 id="members-heading" className="text-xl font-bold">
                    Members
                </h2>

                {board.members.length === 0 ? (
                    <p>No members yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {board.members.map(member => (
                            <li key={member.id} className="break-words">
                                {member.email}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    )
}

export default BoardRoute
