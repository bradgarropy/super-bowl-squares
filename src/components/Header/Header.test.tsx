import {cleanup, render, screen} from "@testing-library/react"
import {createMemoryRouter} from "react-router"
import {RouterProvider} from "react-router/dom"
import {afterEach, expect, test} from "vitest"

import Header from "~/components/Header"

afterEach(cleanup)

const renderHeader = (user: object | null) => {
    const router = createMemoryRouter(
        [
            {
                id: "root",
                path: "/",
                Component: Header,
            },
        ],
        {
            hydrationData: {
                loaderData: {
                    root: {user},
                },
            },
        },
    )

    render(<RouterProvider router={router} />)
}

test("shows a login link when logged out", () => {
    renderHeader(null)

    expect(screen.getByText("Super Bowl Squares")).toBeTruthy()
    expect(screen.getByRole("link", {name: "login"})).toBeTruthy()
})

test("shows a logout button when logged in", () => {
    renderHeader({id: 1})

    expect(screen.getByRole("button", {name: "logout"})).toBeTruthy()
})
