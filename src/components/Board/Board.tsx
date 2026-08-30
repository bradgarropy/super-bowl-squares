import {useState} from "react"

import Grid from "~/components/Grid"
import QuarterSelector from "~/components/QuarterSelector"
import Scoreboard from "~/components/Scoreboard"
import type {GameDetails} from "~/utils/games"

type BoardProps = {
    game: GameDetails
}

const getWinningDigit = (score: number) => Math.abs(score) % 10

const Board = ({game}: BoardProps) => {
    const [selectedQuarter, setSelectedQuarter] = useState(
        () => game.quarterScores.at(-1)?.quarter ?? null,
    )

    const selectedScore = game.quarterScores.find(
        score => score.quarter === selectedQuarter,
    )
    const displayedScore = selectedScore ?? game.score
    const displayedGame = {...game, score: displayedScore}
    const winner = selectedScore
        ? {
              row: getWinningDigit(selectedScore.away),
              column: getWinningDigit(selectedScore.home),
          }
        : null

    return (
        <section className="flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-4">
                <Scoreboard game={displayedGame} />
                <QuarterSelector
                    quarters={game.quarterScores.map(score => score.quarter)}
                    selectedQuarter={selectedQuarter}
                    onSelect={setSelectedQuarter}
                />
            </div>

            <Grid teams={game.teams} winner={winner} />
        </section>
    )
}

export default Board
