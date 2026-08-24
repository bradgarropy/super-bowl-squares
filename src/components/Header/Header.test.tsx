import {render, screen} from "@testing-library/react"
import {createMemoryRouter, RouterProvider} from "react-router"
import {expect, test} from "vitest"

import Header from "~/components/Header"

test("renders", () => {
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
                    root: {user: null},
                },
            },
        },
    )

    render(<RouterProvider router={router} />)

    expect(screen.getByText("Super Bowl Squares"))
})
