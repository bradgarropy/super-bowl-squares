import {data, Link, redirect} from "react-router"

import Scoreboard from "~/components/Scoreboard"
import {dbCtx} from "~/db/client.server"
import {getUser} from "~/utils/auth.server"
import {getBoard} from "~/utils/boards.server"
import {getGame} from "~/utils/games"

import type {Route} from "./+types/boards.$id.welcome"

export const loader = async ({context, params, request}: Route.LoaderArgs) => {
    const boardPath = `/boards/${params.id}`
    const user = await getUser(request)

    if (user) {
        throw redirect(boardPath)
    }

    const db = context.get(dbCtx)
    const board = await getBoard(db, params.id)

    if (!board) {
        throw data("Board not found", {status: 404})
    }

    const game = await getGame(board.gameId)

    const inviter = board.ownerId
        ? board.players.find(player => player.userId === board.ownerId)
        : undefined

    const inviterName = inviter?.name ?? "Someone"

    return {
        boardPath,
        game,
        inviterName,
    }
}

export const meta: Route.MetaFunction = () => {
    return [{title: "🏈 squares | welcome"}]
}

const BoardWelcome = ({loaderData}: Route.ComponentProps) => {
    const {boardPath, game, inviterName} = loaderData
    const redirectTo = encodeURIComponent(boardPath)

    return (
        <main className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
            <header className="space-y-3">
                <p className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
                    You&apos;ve been invited
                </p>

                <h1 className="text-3xl font-bold">
                    {inviterName} invited you to a board
                </h1>

                <p className="text-gray-300">
                    Follow the game, find your squares, and see who wins each
                    quarter.
                </p>
            </header>

            <section
                aria-label="Game"
                className="flex flex-col items-center gap-4"
            >
                <Scoreboard game={game} />
            </section>

            <div className="flex flex-wrap justify-center gap-3">
                <Link
                    to={`/signup?redirectTo=${redirectTo}`}
                    className="rounded bg-white px-4 py-2 font-semibold text-green-800"
                >
                    Create account
                </Link>

                <Link
                    to={`/login?redirectTo=${redirectTo}`}
                    className="rounded bg-white/20 px-4 py-2 font-semibold"
                >
                    Sign in
                </Link>

                <Link
                    to={boardPath}
                    className="rounded px-4 py-2 underline underline-offset-4"
                >
                    Continue as guest
                </Link>
            </div>
        </main>
    )
}

export default BoardWelcome
