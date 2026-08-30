import {Link} from "react-router"

import DateTime from "~/components/DateTime"
import {getLiveGames, getRecentGames, getUpcomingGames} from "~/utils/games"

import type {Route} from "./+types/games"

export const loader = async () => {
    const [recentGames, liveGames, upcomingGames] = await Promise.all([
        getRecentGames(),
        getLiveGames(),
        getUpcomingGames(),
    ])

    return {recentGames, liveGames, upcomingGames}
}

export const meta: Route.MetaFunction = () => {
    return [{title: "🏈 super bowl squares | games"}]
}

const Games = ({loaderData}: Route.ComponentProps) => {
    const {recentGames, liveGames, upcomingGames} = loaderData

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
                                        <Link
                                            to={`/games/${game.id}`}
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
                                        <Link
                                            to={`/games/${game.id}`}
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

                <section aria-labelledby="upcoming-games" className="space-y-4">
                    <h2 id="upcoming-games" className="text-xl font-bold">
                        Upcoming games
                    </h2>

                    {upcomingGames.length === 0 ? (
                        <p>No upcoming NFL games in the next seven days.</p>
                    ) : (
                        <ul className="space-y-4">
                            {upcomingGames.map(game => (
                                <li key={game.id}>
                                    <h3 className="font-semibold">
                                        <Link
                                            to={`/games/${game.id}`}
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

export default Games
