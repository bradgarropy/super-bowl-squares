import {XMarkIcon} from "@heroicons/react/24/solid"
import type {MetaFunction} from "@remix-run/node"
import type {FormEventHandler} from "react"
import {useRef, useState} from "react"

import {assignSquares} from "~/utils/assign"
import {teams} from "~/utils/nfl"

const meta: MetaFunction = () => ({
    title: "💿 remix starter | home",
})

const IndexRoute = () => {
    const [name, setName] = useState<string>("")
    const [names, setNames] = useState<string[]>([])
    const [squares, setSquares] = useState<string[]>([])
    const [homeTeam, setHomeTeam] = useState<string>()
    const [awayTeam, setAwayTeam] = useState<string>()

    const nameRef = useRef<HTMLInputElement>(null)

    const handleGenerate: FormEventHandler<HTMLFormElement> = event => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)

        const rawNames = formData.get("names") as string
        const names = rawNames.split(",").map(name => name.trim())

        const newSquares = assignSquares(names)
        setSquares(newSquares)

        const newHomeTeam = formData.get("homeTeam") as string
        const newAwayTeam = formData.get("awayTeam") as string

        setHomeTeam(newHomeTeam)
        setAwayTeam(newAwayTeam)
    }

    const handleAddName: FormEventHandler<HTMLFormElement> = event => {
        event.preventDefault()

        setNames([...names, name])
        setName("")
        nameRef.current?.focus()
    }

    const handleRemoveName = (name: string) => {
        const newNames = names.filter(n => n !== name)
        setNames(newNames)
        nameRef.current?.focus()
    }

    return (
        <>
            <form onSubmit={handleGenerate} className="mb-12">
                <div className="grid grid-flow-col justify-center gap-x-8 items-end mb-12">
                    <div className="grid">
                        <label htmlFor="homeTeam" className="font-bold mr-2">
                            Home Team
                        </label>

                        <select
                            name="homeTeam"
                            id="homeTeam"
                            className="text-black p-2"
                        >
                            {teams.map(team => {
                                return (
                                    <option key={team} value={team}>
                                        {team}
                                    </option>
                                )
                            })}
                        </select>
                    </div>

                    <span className="font-extrabold italic text-4xl">vs</span>

                    <div className="grid">
                        <label htmlFor="awayTeam" className="font-bold mr-2">
                            Away Team
                        </label>

                        <select
                            name="awayTeam"
                            id="awayTeam"
                            className="text-black p-2"
                        >
                            {teams.map(team => {
                                return (
                                    <option key={team} value={team}>
                                        {team}
                                    </option>
                                )
                            })}
                        </select>
                    </div>
                </div>

                <button type="submit">generate</button>
            </form>

            <form onSubmit={handleAddName} className="mb-12">
                <label htmlFor="name" className="font-bold mr-2">
                    Name
                </label>

                <input
                    ref={nameRef}
                    type="text"
                    name="name"
                    id="name"
                    className="text-black mr-8"
                    value={name}
                    onChange={event => setName(event?.currentTarget.value)}
                />

                <button type="submit">add</button>
            </form>

            {names?.map(name => {
                return (
                    <span
                        key={name}
                        className="rounded-full border-white border-2 py-1 px-4 inline-grid grid-flow-col gap-x-2"
                    >
                        <span className="">{name}</span>
                        <button onClick={() => handleRemoveName(name)}>
                            <XMarkIcon className="h-5 w-5 text-white" />
                        </button>
                    </span>
                )
            })}

            <div className="grid grid-cols-squares grid-rows-squares border-white border-4 tabular-nums bg-white text-center mt-12">
                {/* empty */}
                <span className="col-start-1 row-start-1 bg-gray-600"></span>
                <span className="col-start-1 row-start-2 bg-gray-600"></span>
                <span className="col-start-2 row-start-1 bg-gray-600"></span>
                <span className="col-start-2 row-start-2 bg-gray-400"></span>

                {/* horizontal header */}
                <span className="col-start-3 row-start-1 col-span-10 p-4 font-extrabold bg-gray-600">
                    {homeTeam ?? "Home Team"}
                </span>

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

                {/* vertical header */}
                <span className="col-start-1 row-start-3 row-span-10 p-4 font-extrabold rotate-180 [writing-mode:_vertical-lr] bg-gray-600">
                    {awayTeam ?? "Away Team"}
                </span>

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
        </>
    )
}

export default IndexRoute
export {meta}
