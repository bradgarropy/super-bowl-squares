import type {MetaFunction} from "@remix-run/node"
import type {FormEventHandler} from "react"
import {useState} from "react"

import {assignSquares} from "~/utils/assign"

const meta: MetaFunction = () => ({
    title: "💿 remix starter | home",
})

const IndexRoute = () => {
    const [squares, setSquares] = useState<string[]>([])

    const onSubmit: FormEventHandler<HTMLFormElement> = event => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        const rawNames = formData.get("names") as string
        const names = rawNames.split(",").map(name => name.trim())

        const newSquares = assignSquares(names)
        setSquares(newSquares)
    }

    return (
        <>
            <form onSubmit={onSubmit}>
                <label htmlFor="names">Names</label>

                <input
                    type="text"
                    name="names"
                    id="names"
                    className="text-black"
                />

                <button type="submit">generate</button>
            </form>

            <div className="grid grid-cols-10">
                {squares.map((square, index) => {
                    return <p key={index}>{square}</p>
                })}
            </div>
        </>
    )
}

export default IndexRoute
export {meta}
