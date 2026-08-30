import type {ActionFunctionArgs, LoaderFunctionArgs} from "react-router"

import {auth} from "~/utils/auth.server"

const action = ({request}: ActionFunctionArgs) => {
    return auth.handler(request)
}

const loader = ({request}: LoaderFunctionArgs) => {
    return auth.handler(request)
}

export {action, loader}
