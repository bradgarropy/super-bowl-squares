import {json} from "@remix-run/node"
import {Link, useLoaderData} from "@remix-run/react"

export const loader = async () => {
    return json({
        boards: [
            {
                id: 1,
            },
            {
                id: 2,
            },
            {
                id: 3,
            },
        ],
    })
}

const Route = () => {
    const {boards} = useLoaderData<typeof loader>()

    return (
        <>
            <h1>boards</h1>

            {boards.map(board => {
                return (
                    <div key={board.id}>
                        <Link to={`/boards/${board.id}`}>{board.id}</Link>
                    </div>
                )
            })}
        </>
    )
}

export default Route
