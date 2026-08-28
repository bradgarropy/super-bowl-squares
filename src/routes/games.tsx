import {getUpcomingGames} from "~/utils/espn"

import type {Route} from "./+types/games"

export const loader = async () => {
    const games = await getUpcomingGames()

    return {games}
}

export const meta: Route.MetaFunction = () => {
    return [{title: "🏈 super bowl squares | games"}]
}

const Games = ({loaderData}: Route.ComponentProps) => {
    const {games} = loaderData

    return (
        <main className="space-y-6">
            <h1 className="text-2xl font-bold">Upcoming games</h1>

            {games.length === 0 ? (
                <p>No NFL games scheduled in the next seven days.</p>
            ) : (
                <ul className="space-y-4">
                    {games.map(game => (
                        <li key={game.id}>
                            <h2 className="font-semibold">{game.name}</h2>
                            <time dateTime={game.date}>
                                {new Date(game.date).toUTCString()}
                            </time>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    )
}

export default Games
