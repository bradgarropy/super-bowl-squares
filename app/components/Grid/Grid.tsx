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

const HorizontalHeader = () => {
    return (
        <>
            <div className="col-start-3 row-start-2 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>0</span>
            </div>
            <div className="col-start-4 row-start-2 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>1</span>
            </div>
            <div className="col-start-5 row-start-2 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>2</span>
            </div>
            <div className="col-start-6 row-start-2 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>3</span>
            </div>
            <div className="col-start-7 row-start-2 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>4</span>
            </div>
            <div className="col-start-8 row-start-2 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>5</span>
            </div>
            <div className="col-start-9 row-start-2 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>6</span>
            </div>
            <div className="col-start-10 row-start-2 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>7</span>
            </div>
            <div className="col-start-11 row-start-2 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>8</span>
            </div>
            <div className="col-start-12 row-start-2 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>9</span>
            </div>
        </>
    )
}

const VerticalHeader = () => {
    return (
        <>
            <div className="col-start-2 row-start-3 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>0</span>
            </div>
            <div className="col-start-2 row-start-4 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>1</span>
            </div>
            <div className="col-start-2 row-start-5 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>2</span>
            </div>
            <div className="col-start-2 row-start-6 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>3</span>
            </div>
            <div className="col-start-2 row-start-7 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>4</span>
            </div>
            <div className="col-start-2 row-start-8 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>5</span>
            </div>
            <div className="col-start-2 row-start-9 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>6</span>
            </div>
            <div className="col-start-2 row-start-10 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>7</span>
            </div>
            <div className="col-start-2 row-start-11 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>8</span>
            </div>
            <div className="col-start-2 row-start-12 bg-gray-400 text-black p-2 font-bold grid place-items-center">
                <span>9</span>
            </div>
        </>
    )
}

const Grid: FC<GridProps> = ({teams, squares}) => {
    return (
        <div className="justify-center w-fit m-auto grid grid-cols-squares grid-rows-squares border-white border-4 tabular-nums bg-white text-center">
            {/* corners */}
            <Corner teams={teams} />
            <SubCorner />

            {/* teams */}
            <HomeTeam team={teams.home} />
            <AwayTeam team={teams.away} />

            {/* headers */}
            <HorizontalHeader />
            <VerticalHeader />

            {/* data */}
            {squares.map((square, index) => {
                return (
                    <span
                        key={index}
                        className="text-black p-2 place-self-center"
                    >
                        {square}
                    </span>
                )
            })}
        </div>
    )
}

export default Grid
