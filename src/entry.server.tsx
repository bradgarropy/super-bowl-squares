import {renderToString} from "react-dom/server"
import {ServerRouter} from "react-router"
import {type EntryContext} from "react-router"

const handleRequest = (
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    routerContext: EntryContext,
) => {
    const markup = renderToString(
        <ServerRouter context={routerContext} url={request.url} />,
    )

    const body = "<!DOCTYPE html>" + markup

    responseHeaders.set("Content-Type", "text/html")

    const response = new Response(body, {
        status: responseStatusCode,
        headers: responseHeaders,
    })

    return response
}

export default handleRequest
