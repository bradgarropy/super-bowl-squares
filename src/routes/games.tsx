import {data, Form, redirect, useActionData} from "react-router"

import DateTime from "~/components/DateTime"
import {dbCtx} from "~/db/client.server"
import {board, player} from "~/db/schema"
import {requireUser} from "~/utils/auth.server"
import {getGame, getGames} from "~/utils/games"
import {createShuffleQueries} from "~/utils/squares.server"

import type {Route} from "./+types/games"

export const loader = async () => {
    const games = await getGames()

    const completedGames = games.filter(game => game.state === "post").reverse()
    const liveGames = games.filter(game => game.state === "in")
    const upcomingGames = games.filter(game => game.state === "pre")

    return {completedGames, liveGames, upcomingGames}
}

export const action = async ({context, request}: Route.ActionArgs) => {
    const user = await requireUser(request)
    const formData = await request.formData()
    const gameId = String(formData.get("gameId") ?? "")

    if (!gameId) {
        return data({error: "Game is required."}, {status: 400})
    }

    const game = await getGame(gameId)

    if (game.state !== "pre") {
        return data(
            {error: "Boards cannot be created after a game has started."},
            {status: 409},
        )
    }

    const db = context.get(dbCtx)
    const boardId = crypto.randomUUID()
    const playerId = crypto.randomUUID()

    await db.batch([
        db
            .insert(board)
            .values({id: boardId, gameId: game.id, ownerId: user.id}),
        db.insert(player).values({
            id: playerId,
            boardId,
            userId: user.id,
            name: user.name,
        }),
        ...createShuffleQueries(db, boardId, [playerId]),
    ])

    return redirect(`/boards/${boardId}`)
}

export const meta: Route.MetaFunction = () => {
    return [{title: "🏈 squares | games"}]
}

const Games = ({loaderData}: Route.ComponentProps) => {
    const {completedGames, liveGames, upcomingGames} = loaderData
    const actionData = useActionData<typeof action>()

    return (
        <main className="space-y-6">
            <h1 className="text-2xl font-bold">Games</h1>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <section
                    aria-labelledby="completed-games"
                    className="space-y-4"
                >
                    <h2 id="completed-games" className="text-xl font-bold">
                        Completed games
                    </h2>

                    {completedGames.length === 0 ? (
                        <p>No completed NFL games this season.</p>
                    ) : (
                        <ul className="space-y-4">
                            {completedGames.map(game => (
                                <li key={game.id}>
                                    <h3 className="font-semibold">
                                        {game.name}
                                    </h3>

                                    <DateTime date={game.date} />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section aria-labelledby="live-games" className="space-y-4">
                    <h2 id="live-games" className="text-xl font-bold">
                        Live games
                    </h2>

                    {liveGames.length === 0 ? (
                        <p>No NFL games are live right now.</p>
                    ) : (
                        <ul className="space-y-4">
                            {liveGames.map(game => (
                                <li key={game.id}>
                                    <h3 className="font-semibold">
                                        {game.name}
                                    </h3>

                                    <DateTime date={game.date} />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section aria-labelledby="upcoming-games" className="space-y-4">
                    <h2 id="upcoming-games" className="text-xl font-bold">
                        Upcoming games
                    </h2>

                    {actionData?.error ? (
                        <p role="alert">{actionData.error}</p>
                    ) : null}

                    {upcomingGames.length === 0 ? (
                        <p>No upcoming NFL games found.</p>
                    ) : (
                        <ul className="space-y-4">
                            {upcomingGames.map(game => (
                                <li key={game.id} className="space-y-2">
                                    <h3 className="font-semibold">
                                        {game.name}
                                    </h3>

                                    <DateTime date={game.date} />

                                    <Form method="post">
                                        <input
                                            type="hidden"
                                            name="gameId"
                                            value={game.id}
                                        />

                                        <button type="submit">
                                            Create board
                                        </button>
                                    </Form>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    )
}

export default Games
