import {data, Form, redirect, useActionData} from "react-router"

import DateTime from "~/components/DateTime"
import {dbCtx} from "~/db/client.server"
import {board, boardMember} from "~/db/schema"
import {requireUser} from "~/utils/auth.server"
import {
    getGame,
    getLiveGames,
    getRecentGames,
    getUpcomingGames,
} from "~/utils/games"

import type {Route} from "./+types/games"

export const loader = async () => {
    const [recentGames, liveGames, upcomingGames] = await Promise.all([
        getRecentGames(),
        getLiveGames(),
        getUpcomingGames(),
    ])

    return {recentGames, liveGames, upcomingGames}
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

    await db.batch([
        db
            .insert(board)
            .values({id: boardId, gameId: game.id, ownerId: user.id}),
        db.insert(boardMember).values({
            boardId,
            userId: user.id,
            email: user.email,
        }),
    ])

    return redirect(`/boards/${boardId}`)
}

export const meta: Route.MetaFunction = () => {
    return [{title: "🏈 super bowl squares | games"}]
}

const Games = ({loaderData}: Route.ComponentProps) => {
    const {recentGames, liveGames, upcomingGames} = loaderData
    const actionData = useActionData<typeof action>()

    return (
        <main className="space-y-6">
            <h1 className="text-2xl font-bold">Games</h1>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <section aria-labelledby="recent-games" className="space-y-4">
                    <h2 id="recent-games" className="text-xl font-bold">
                        Recent games
                    </h2>

                    {recentGames.length === 0 ? (
                        <p>No recent NFL games in the past seven days.</p>
                    ) : (
                        <ul className="space-y-4">
                            {recentGames.map(game => (
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
