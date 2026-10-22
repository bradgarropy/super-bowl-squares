import {Link} from "react-router"

import DateTime from "~/components/DateTime"
import {dbCtx} from "~/db/client.server"
import {requireUser} from "~/utils/auth.server"
import {getJoinedBoards, getUserBoards} from "~/utils/boards.server"
import {getGame} from "~/utils/games"

import type {Route} from "./+types/boards"

export const loader = async ({context, request}: Route.LoaderArgs) => {
    const user = await requireUser(request)
    const db = context.get(dbCtx)
    const [userBoards, joinedUserBoards] = await Promise.all([
        getUserBoards(db, user.id),
        getJoinedBoards(db, user.id),
    ])

    const [boards, joinedBoards] = await Promise.all([
        Promise.all(
            userBoards.map(async board => ({
                board,
                game: await getGame(board.gameId),
            })),
        ),
        Promise.all(
            joinedUserBoards.map(async board => ({
                board,
                game: await getGame(board.gameId),
            })),
        ),
    ])

    return {boards, joinedBoards}
}

export const meta: Route.MetaFunction = () => {
    return [{title: "🏈 squares | boards"}]
}

const Boards = ({loaderData}: Route.ComponentProps) => {
    const {boards, joinedBoards} = loaderData

    return (
        <main className="space-y-6">
            <h1 className="text-2xl font-bold">Boards</h1>

            <div className="grid gap-8 md:grid-cols-2">
                <section className="space-y-4">
                    <h2 className="text-xl font-bold">Your boards</h2>

                    {boards.length === 0 ? (
                        <p>
                            You don&apos;t own any boards yet.{" "}
                            <Link
                                to="/games"
                                className="underline underline-offset-4"
                            >
                                Choose a game
                            </Link>{" "}
                            to create one.
                        </p>
                    ) : (
                        <ul className="space-y-4">
                            {boards.map(({board, game}) => (
                                <li key={board.id}>
                                    <h3 className="font-semibold">
                                        <Link
                                            to={`/boards/${board.id}`}
                                            className="underline underline-offset-4"
                                        >
                                            {game.name}
                                        </Link>
                                    </h3>

                                    <DateTime date={game.date} />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold">
                        Boards you&apos;ve joined
                    </h2>

                    {joinedBoards.length === 0 ? (
                        <p>You haven&apos;t joined any boards yet.</p>
                    ) : (
                        <ul className="space-y-4">
                            {joinedBoards.map(({board, game}) => (
                                <li key={board.id}>
                                    <h3 className="font-semibold">
                                        <Link
                                            to={`/boards/${board.id}`}
                                            className="underline underline-offset-4"
                                        >
                                            {game.name}
                                        </Link>
                                    </h3>

                                    <DateTime date={game.date} />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    )
}

export default Boards
