import {XMarkIcon} from "@heroicons/react/24/solid"
import type {MetaFunction} from "@remix-run/node"
import {json} from "@remix-run/node"
import {useLoaderData} from "@remix-run/react"
import type {FormEventHandler} from "react"
import {useRef, useState} from "react"

import {assignSquares} from "~/utils/assign"
import {getSuperBowl} from "~/utils/espn"

const meta: MetaFunction = () => ({
    title: "💿 remix starter | home",
})

const loader = async () => {
    const superBowl = await getSuperBowl()
    return json(superBowl)
}

const IndexRoute = () => {
    const superBowl = useLoaderData<typeof loader>()

    const [name, setName] = useState<string>("")
    const [names, setNames] = useState<string[]>([])
    const [squares, setSquares] = useState<string[]>([])

    const nameRef = useRef<HTMLInputElement>(null)

    const handleAddName: FormEventHandler<HTMLFormElement> = event => {
        event.preventDefault()

        const newNames = [...names, name]
        const newSquares = assignSquares(newNames)

        setNames(newNames)
        setName("")
        setSquares(newSquares)

        nameRef.current?.focus()
    }

    const handleRemoveName = (name: string) => {
        const newNames = names.filter(n => n !== name)
        setNames(newNames)
        nameRef.current?.focus()
    }

    return (
        <>
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
                <span
                    style={{
                        background: `linear-gradient(45deg, #${superBowl.teams.away.color} 50%, #${superBowl.teams.home.color} 50%)`,
                    }}
                    className="col-start-1 row-start-1"
                ></span>
                <span className="col-start-2 row-start-2 bg-gray-400"></span>

                {/* horizontal header */}
                <div
                    style={{backgroundColor: `#${superBowl.teams.home.color}`}}
                    className={
                        "col-start-2 row-start-1 col-span-11 p-4 font-extrabold grid grid-flow-col gap-x-2 justify-center items-center"
                    }
                >
                    <img
                        src={superBowl.teams.home.logo}
                        alt={superBowl.teams.home.name}
                        width="500"
                        height="500"
                        className="w-10"
                    />

                    <span>{superBowl.teams.home.name}</span>
                </div>

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
                <div
                    style={{backgroundColor: `#${superBowl.teams.away.color}`}}
                    className="col-start-1 row-start-2 row-span-11 p-4 font-extrabold [writing-mode:_vertical-lr] bg-gray-600 grid grid-flow-col gap-x-2 justify-center items-center"
                >
                    <span className="rotate-180">
                        {superBowl.teams.away.name}
                    </span>

                    <img
                        src={superBowl.teams.away.logo}
                        alt={superBowl.teams.away.name}
                        width="500"
                        height="500"
                        className="w-10 -rotate-90"
                    />
                </div>

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
export {loader, meta}
