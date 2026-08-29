import {Link} from "react-router"

import {getGame} from "~/utils/games"

import type {Route} from "./+types/games.$id"

export const loader = async ({params}: Route.LoaderArgs) => {
    return getGame(params.id)
}

export const meta: Route.MetaFunction = ({params}) => {
    return [{title: `🏈 super bowl squares | game ${params.id}`}]
}

const Game = ({loaderData: game}: Route.ComponentProps) => {
    const status = {
        pre: "Scheduled",
        in: "Live",
        post: "Final",
    }[game.state]

    return (
        <main className="space-y-6">
            <Link to="/games" className="underline underline-offset-4">
                Back to games
            </Link>

            <header className="space-y-2">
                <h1 className="text-2xl font-bold">{game.name}</h1>
                <p>
                    {status}
                    {game.state === "in" &&
                        ` · Q${game.quarter} · ${game.clock}`}
                </p>
                <time dateTime={game.date}>
                    {new Date(game.date).toUTCString()}
                </time>
            </header>

            <section
                aria-label="Score"
                className="grid max-w-2xl grid-cols-2 gap-8"
            >
                {[game.teams.away, game.teams.home].map(team => {
                    const homeAway =
                        team.id === game.teams.home.id ? "home" : "away"

                    return (
                        <div key={team.id} className="space-y-2">
                            <img
                                src={team.logo}
                                alt=""
                                className="size-16 object-contain"
                            />
                            <h2 className="font-semibold">{team.name}</h2>
                            <p className="text-4xl font-bold">
                                {game.score[homeAway]}
                            </p>
                        </div>
                    )
                })}
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold">Quarter scores</h2>

                {game.quarterScores.length === 0 ? (
                    <p>No quarters have been completed.</p>
                ) : (
                    <ul className="space-y-2">
                        {game.quarterScores.map(score => (
                            <li key={score.quarter}>
                                End Q{score.quarter}:{" "}
                                {game.teams.away.abbreviation} {score.away}–
                                {game.teams.home.abbreviation} {score.home}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    )
}

export default Game
