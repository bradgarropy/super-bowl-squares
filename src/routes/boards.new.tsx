import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node"
import {json, redirect} from "@remix-run/node"
import {Form} from "@remix-run/react"

import {requireUser} from "~/utils/auth.server"
import {createBoard} from "~/utils/boards"

export const loader = async ({request}: LoaderFunctionArgs) => {
    const user = await requireUser(request)
    return json({user})
}

export const action = async ({request}: ActionFunctionArgs) => {
    const user = await requireUser(request)
    const board = await createBoard(user.id)

    return redirect(`/boards/${board.id}`)
}

const Route = () => {
    return (
        <div className="max-w-lg mx-auto">
            <h1 className="mb-10">Create a new board</h1>

            <Form method="post" className="grid gap-y-4">
                <div className="grid">
                    <label htmlFor="game">Which game?</label>

                    <input
                        className="text-black"
                        type="text"
                        name="game"
                        id="game"
                        required
                    />
                </div>

                <div className="grid">
                    <label htmlFor="email">Invite others</label>

                    <input
                        className="text-black"
                        type="email"
                        name="email"
                        id="email"
                    />
                </div>

                <button type="submit" className="mt-4 justify-self-end">
                    create
                </button>
            </Form>
        </div>
    )
}

export default Route
