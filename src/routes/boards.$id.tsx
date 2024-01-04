import type {LoaderFunctionArgs} from "@remix-run/node"
import {json, useLoaderData} from "@remix-run/react"

export const loader = async ({params}: LoaderFunctionArgs) => {
    return json({
        board: {
            id: params.id,
            users: [1, 2, 3],
            teams: [1, 2],
        },
    })
}

const Route = () => {
    const {board} = useLoaderData<typeof loader>()

    return (
        <>
            <h1>{`board ${board.id}`}</h1>

            <h2>users</h2>
            {board.users.map(user => {
                return <div key={user}>{user}</div>
            })}

            <h2>teams</h2>
            {board.teams.map(team => {
                return <div key={team}>{team}</div>
            })}
        </>
    )
}

export default Route
