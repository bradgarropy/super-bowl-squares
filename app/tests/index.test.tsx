import {render, screen} from "@testing-library/react"
import {expect, test} from "vitest"

import IndexRoute, {meta} from "~/routes/index"
import {metaArgs} from "~/utils/testUtils"

test("renders", () => {
    render(<IndexRoute />)

    expect(screen.getByLabelText("Home Team"))
    expect(screen.getByLabelText("Away Team"))
    expect(screen.getByLabelText("Name"))

    expect(screen.getByText("generate"))
    expect(screen.getByText("add"))
})

test("meta", () => {
    const tags = meta(metaArgs)
    expect(tags).toEqual({title: "💿 remix starter | home"})
})
