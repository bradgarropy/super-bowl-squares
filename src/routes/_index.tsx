import type {MetaFunction} from "@remix-run/node"

export const meta: MetaFunction = () => {
    return [
        {
            title: "🏈 super bowl squares | home",
        },
    ]
}

const Route = () => {
    return (
        <>
            <h1>Make your own Super Bowl Squares and play with friends!</h1>
        </>
    )
}

export default Route
