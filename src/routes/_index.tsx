import type {MetaFunction} from "react-router"

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
