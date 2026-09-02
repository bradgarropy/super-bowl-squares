import DateTime from "~/components/DateTime"
import type {GameDetails} from "~/utils/games"

type ScoreboardProps = {
    game: GameDetails
}

const Scoreboard = ({game}: ScoreboardProps) => {
    let status = "Final"

    if (game.state === "pre") {
        status = "vs"
    }

    if (game.state === "in") {
        status = "Live"
    }

    return (
        <>
            <header className="space-y-2 text-center">
                <h1 className="text-2xl font-bold">{game.name}</h1>
                <DateTime date={game.date} className="text-gray-300" />
            </header>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <img
                        src={game.teams.away.logo}
                        alt=""
                        className="size-12 object-contain"
                    />

                    <span className="font-bold">
                        {game.teams.away.abbreviation}
                    </span>

                    {game.state === "pre" ? null : (
                        <span className="w-[2ch] flex-none text-center text-4xl font-bold tabular-nums">
                            {game.score.away}
                        </span>
                    )}
                </div>

                <div className="flex min-w-24 flex-col items-center text-sm text-gray-300">
                    <span className="font-semibold text-white">{status}</span>

                    {game.state === "in" ? (
                        <span>
                            Q{game.quarter} · {game.clock}
                        </span>
                    ) : null}
                </div>

                <div className="flex items-center gap-3">
                    {game.state === "pre" ? null : (
                        <span className="w-[2ch] flex-none text-center text-4xl font-bold tabular-nums">
                            {game.score.home}
                        </span>
                    )}

                    <span className="font-bold">
                        {game.teams.home.abbreviation}
                    </span>

                    <img
                        src={game.teams.home.logo}
                        alt=""
                        className="size-12 object-contain"
                    />
                </div>
            </div>
        </>
    )
}

export default Scoreboard
