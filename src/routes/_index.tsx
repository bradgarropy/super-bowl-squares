import type {Route} from "./+types/_index"

export const meta: Route.MetaFunction = () => {
    return [
        {
            title: "🏈 super bowl squares | home",
        },
    ]
}

const Home = () => {
    return (
        <>
            <h1>Make your own Super Bowl Squares and play with friends!</h1>
        </>
    )
}

export default Home
