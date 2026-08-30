import {cn} from "~/utils/cn"
import type {Game} from "~/utils/games"

const digits = Array.from({length: 10}, (_, digit) => digit)

type GridProps = {
    teams: Game["teams"]
    winner: {
        row: number
        column: number
    } | null
}

const Grid = ({teams, winner}: GridProps) => {
    const isWinningSquare = (row: number, column: number) => {
        return row === winner?.row && column === winner.column
    }

    return (
        <div className="max-w-full overflow-x-auto pb-4">
            <div className="w-max min-w-full">
                <div className="mx-auto grid w-fit grid-cols-[5rem_auto_5rem] grid-rows-[5rem_auto]">
                    <div className="col-start-2 flex items-center justify-center">
                        <img
                            src={teams.home.logo}
                            alt={teams.home.name}
                            className="size-14 object-contain"
                        />
                    </div>

                    <div className="col-start-1 row-start-2 flex translate-y-8 items-center justify-center self-center">
                        <img
                            src={teams.away.logo}
                            alt={teams.away.name}
                            className="size-14 object-contain"
                        />
                    </div>

                    <div className="col-start-2 row-start-2">
                        <table className="border-separate border-spacing-px">
                            <caption className="sr-only">
                                {teams.away.name} at {teams.home.name} squares
                                board
                            </caption>
                            <tbody>
                                <tr>
                                    <th
                                        aria-label="Board corner"
                                        className="size-16 bg-black/30"
                                    />
                                    {digits.map(column => (
                                        <th
                                            key={column}
                                            scope="col"
                                            style={{
                                                backgroundColor: `#${teams.home.color}`,
                                            }}
                                            className={cn(
                                                "size-16 p-2 text-sm transition-all",
                                                winner?.column === column
                                                    ? "brightness-150"
                                                    : "",
                                            )}
                                        >
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                                {digits.map(row => (
                                    <tr key={row}>
                                        <th
                                            scope="row"
                                            style={{
                                                backgroundColor: `#${teams.away.color}`,
                                            }}
                                            className={cn(
                                                "size-16 p-2 text-sm transition-all",
                                                winner?.row === row
                                                    ? "brightness-150"
                                                    : "",
                                            )}
                                        >
                                            {row}
                                        </th>

                                        {digits.map(column => {
                                            const isWinner = isWinningSquare(
                                                row,
                                                column,
                                            )

                                            return (
                                                <td
                                                    key={column}
                                                    aria-label={
                                                        isWinner
                                                            ? `Winning square: row ${row}, column ${column}`
                                                            : `Row ${row}, column ${column}`
                                                    }
                                                    className={cn(
                                                        "size-16 bg-black/10",
                                                        isWinner
                                                            ? "relative z-10 scale-105 bg-yellow-400/30 ring-4 ring-inset ring-yellow-400"
                                                            : "",
                                                    )}
                                                />
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div
                        aria-hidden="true"
                        className="col-start-3 row-start-2"
                    />
                </div>
            </div>
        </div>
    )
}

export default Grid
