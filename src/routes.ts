import {index, route} from "@react-router/dev/routes"
import {type RouteConfig} from "@react-router/dev/routes"

const routes: RouteConfig = [
    index("routes/_index.tsx"),
    route("account", "routes/account.tsx"),
    route("boards", "routes/boards._index.tsx"),
    route("boards/new", "routes/boards.new.tsx"),
    route("boards/:id", "routes/boards.$id.tsx"),
    route("games", "routes/games.tsx"),
    route("games/:id", "routes/games.$id.tsx"),
    route("login", "routes/login.tsx"),
    route("logout", "routes/logout.tsx"),
    route("signup", "routes/signup.tsx"),
]

export default routes
