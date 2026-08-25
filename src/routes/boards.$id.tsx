import {XMarkIcon} from "@heroicons/react/24/solid"
import type {FormEventHandler} from "react"
import {useEffect, useRef, useState} from "react"

import Grid from "~/components/Grid"
import {assignSquares} from "~/utils/assign"
import {requireUser} from "~/utils/auth.server"
import {getBoard} from "~/utils/boards"
import {getSuperBowl} from "~/utils/espn"

import type {Route} from "./+types/boards.$id"

export const loader = async ({request, params}: Route.LoaderArgs) => {
    await requireUser(request)
    const board = getBoard(Number(params.id))
    const superBowl = await getSuperBowl()

    return {
        board,
        superBowl,
    }
}

const Board = ({loaderData}: Route.ComponentProps) => {
    const {superBowl} = loaderData
    const [name, setName] = useState<string>("")
    const [names, setNames] = useState<string[]>([])
    const [squares, setSquares] = useState<string[]>([])

    const nameRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const newSquares = assignSquares(names)
        setSquares(newSquares)
    }, [names])

    const handleAddName: FormEventHandler<HTMLFormElement> = event => {
        event.preventDefault()

        const newNames = [...names, name.trim()]
        setNames(newNames)
        setName("")

        nameRef.current?.focus()
    }

    const handleRemoveName = (name: string) => {
        const newNames = names.filter(n => n !== name)
        setNames(newNames)

        nameRef.current?.focus()
    }

    return (
        <div className="grid grid-flow-col justify-start gap-x-12">
            <Grid teams={superBowl.teams} squares={squares} />

            <section>
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
                        autoComplete="name"
                        onChange={event => setName(event?.currentTarget.value)}
                    />

                    <button type="submit">add</button>
                </form>

                <div className="grid gap-y-2 justify-items-start">
                    {names?.map((name, index) => {
                        return (
                            <span
                                key={index}
                                className="rounded-full border-white border-2 py-1 px-4 inline-grid grid-flow-col gap-x-2"
                            >
                                <button onClick={() => handleRemoveName(name)}>
                                    <XMarkIcon className="h-5 w-5 text-white" />
                                </button>
                                <span className="">{name}</span>
                            </span>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}

export default Board
