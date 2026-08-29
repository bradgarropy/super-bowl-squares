import {Link} from "react-router"

import {getRecentGames, getUpcomingGames} from "~/utils/espn"

import type {Route} from "./+types/games"

export const loader = async () => {
    const [recentGames, upcomingGames] = await Promise.all([
        getRecentGames(),
        getUpcomingGames(),
    ])

    return {recentGames, upcomingGames}
}

export const meta: Route.MetaFunction = () => {
    return [{title: "🏈 super bowl squares | games"}]
}

const Games = ({loaderData}: Route.ComponentProps) => {
    const {recentGames, upcomingGames} = loaderData

    return (
        <main className="space-y-6">
            <h1 className="text-2xl font-bold">Games</h1>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <section aria-labelledby="recent-games" className="space-y-4">
                    <h2 id="recent-games" className="text-xl font-bold">
                        Recent games
                    </h2>

                    {recentGames.length === 0 ? (
                        <p>No NFL games completed in the past seven days.</p>
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
                                    <time dateTime={game.date}>
                                        {new Date(game.date).toUTCString()}
                                    </time>
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
                        <p>No NFL games scheduled in the next seven days.</p>
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
                                    <time dateTime={game.date}>
                                        {new Date(game.date).toUTCString()}
                                    </time>
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
