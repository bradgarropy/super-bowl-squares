import type {FC} from "react"

import type {SuperBowl, Team} from "~/utils/espn"

type GridProps = {
    teams: SuperBowl["teams"]
    squares: string[]
}

type CornerProps = {
    teams: SuperBowl["teams"]
}

type TeamProps = {
    team: Team
}

const Corner: FC<CornerProps> = ({teams}) => {
    return (
        <span
            style={{
                background: `linear-gradient(45deg, #${teams.away.color} 50%, #${teams.home.color} 50%)`,
            }}
            className="col-start-1 row-start-1"
        />
    )
}

const SubCorner: FC = () => {
    return <span className="col-start-2 row-start-2 bg-gray-400"></span>
}

const HomeTeam: FC<TeamProps> = ({team}) => {
    return (
        <div
            style={{backgroundColor: `#${team.color}`}}
            className={
                "col-start-2 row-start-1 col-span-11 p-4 font-extrabold grid grid-flow-col gap-x-2 justify-center items-center"
            }
        >
            <img
                src={team.logo}
                alt={team.name}
                width="500"
                height="500"
                className="w-10"
            />

            <span>{team.name}</span>
        </div>
    )
}

const AwayTeam: FC<TeamProps> = ({team}) => {
    return (
        <div
            style={{backgroundColor: `#${team.color}`}}
            className="col-start-1 row-start-2 row-span-11 p-4 font-extrabold [writing-mode:_vertical-lr] bg-gray-600 grid grid-flow-col gap-x-2 justify-center items-center"
        >
            <span className="rotate-180">{team.name}</span>

            <img
                src={team.logo}
                alt={team.name}
                width="500"
                height="500"
                className="w-10 -rotate-90"
            />
        </div>
    )
}

const Grid: FC<GridProps> = ({teams, squares}) => {
    return (
        <div className="justify-center w-fit m-auto grid grid-cols-squares grid-rows-squares border-white border-4 tabular-nums bg-white text-center mt-12">
            {/* corners */}
            <Corner teams={teams} />
            <SubCorner />

            {/* teams */}
            <HomeTeam team={teams.home} />
            <AwayTeam team={teams.away} />

            <span className="col-start-3 row-start-2 bg-gray-400 text-black p-2 font-bold">
                0
            </span>
            <span className="col-start-4 row-start-2 bg-gray-400 text-black p-2 font-bold">
                1
            </span>
            <span className="col-start-5 row-start-2 bg-gray-400 text-black p-2 font-bold">
                2
            </span>
            <span className="col-start-6 row-start-2 bg-gray-400 text-black p-2 font-bold">
                3
            </span>
            <span className="col-start-7 row-start-2 bg-gray-400 text-black p-2 font-bold">
                4
            </span>
            <span className="col-start-8 row-start-2 bg-gray-400 text-black p-2 font-bold">
                5
            </span>
            <span className="col-start-9 row-start-2 bg-gray-400 text-black p-2 font-bold">
                6
            </span>
            <span className="col-start-10 row-start-2 bg-gray-400 text-black p-2 font-bold">
                7
            </span>
            <span className="col-start-11 row-start-2 bg-gray-400 text-black p-2 font-bold">
                8
            </span>
            <span className="col-start-12 row-start-2 bg-gray-400 text-black p-2 font-bold">
                9
            </span>

            {/* data */}
            {squares.map((square, index) => {
                return (
                    <span key={index} className="text-black p-2">
                        {square}
                    </span>
                )
            })}

            <span className="col-start-2 row-start-3 bg-gray-400 text-black p-2 font-bold">
                0
            </span>
            <span className="col-start-2 row-start-4 bg-gray-400 text-black p-2 font-bold">
                1
            </span>
            <span className="col-start-2 row-start-5 bg-gray-400 text-black p-2 font-bold">
                2
            </span>
            <span className="col-start-2 row-start-6 bg-gray-400 text-black p-2 font-bold">
                3
            </span>
            <span className="col-start-2 row-start-7 bg-gray-400 text-black p-2 font-bold">
                4
            </span>
            <span className="col-start-2 row-start-8 bg-gray-400 text-black p-2 font-bold">
                5
            </span>
            <span className="col-start-2 row-start-9 bg-gray-400 text-black p-2 font-bold">
                6
            </span>
            <span className="col-start-2 row-start-10 bg-gray-400 text-black p-2 font-bold">
                7
            </span>
            <span className="col-start-2 row-start-11 bg-gray-400 text-black p-2 font-bold">
                8
            </span>
            <span className="col-start-2 row-start-12 bg-gray-400 text-black p-2 font-bold">
                9
            </span>
        </div>
    )
}

export default Grid
