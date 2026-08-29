import {redirect} from "react-router"

export const loader = () => {
    return redirect("/games")
}

export default function Home() {
    return null
}
