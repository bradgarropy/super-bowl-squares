import {Link} from "react-router"

import DateTime from "~/components/DateTime"
import {dbCtx} from "~/db/client.server"
import {requireUser} from "~/utils/auth.server"
import {getUserBoards} from "~/utils/boards.server"
import {getGame} from "~/utils/games"

import type {Route} from "./+types/boards"

export const loader = async ({context, request}: Route.LoaderArgs) => {
    const user = await requireUser(request)
    const db = context.get(dbCtx)
    const userBoards = await getUserBoards(db, user.id)

    const boards = await Promise.all(
        userBoards.map(async board => ({
            board,
            game: await getGame(board.gameId),
        })),
    )

    return {boards}
}

export const meta: Route.MetaFunction = () => {
    return [{title: "🏈 super bowl squares | boards"}]
}

const Boards = ({loaderData}: Route.ComponentProps) => {
    const {boards} = loaderData

    return (
        <main className="space-y-6">
            <h1 className="text-2xl font-bold">Boards</h1>

            {boards.length === 0 ? (
                <p>
                    You don&apos;t own any boards yet.{" "}
                    <Link to="/games" className="underline underline-offset-4">
                        Choose a game
                    </Link>{" "}
                    to create one.
                </p>
            ) : (
                <ul className="space-y-4">
                    {boards.map(({board, game}) => (
                        <li key={board.id}>
                            <h2 className="font-semibold">
                                <Link
                                    to={`/boards/${board.id}`}
                                    className="underline underline-offset-4"
                                >
                                    {game.name}
                                </Link>
                            </h2>

                            <DateTime date={game.date} />
                        </li>
                    ))}
                </ul>
            )}
        </main>
    )
}

export default Boards
