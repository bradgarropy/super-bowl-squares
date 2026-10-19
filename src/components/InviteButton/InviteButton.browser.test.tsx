import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react"
import {
    type ActionFunction,
    createMemoryRouter,
    RouterProvider,
} from "react-router"
import {afterEach, expect, test, vi} from "vitest"

import InviteButton from "~/components/InviteButton"

type InviteResponse = {error: string} | {inviteUrl: string}

afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
})

const renderButton = (action: ActionFunction) => {
    const router = createMemoryRouter(
        [
            {
                path: "/boards/:id",
                action,
                element: (
                    <InviteButton
                        action="/boards/board-1"
                        isInvited={false}
                        player={{id: "player-1", name: "Alex"}}
                        title="Bills at Cowboys"
                    />
                ),
            },
        ],
        {initialEntries: ["/boards/board-1"]},
    )

    render(<RouterProvider router={router} />)
}

test("generates an invitation for the selected player", async () => {
    let resolveAction: (value: InviteResponse) => void = () => {}
    let submittedData: Record<string, FormDataEntryValue> = {}
    const action: ActionFunction = async ({request}) => {
        submittedData = Object.fromEntries(await request.formData())

        return new Promise<InviteResponse>(resolve => {
            resolveAction = resolve
        })
    }
    renderButton(action)

    fireEvent.click(screen.getByRole("button", {name: "Invite"}))

    expect(
        await screen.findByRole("button", {name: "Generating…"}),
    ).toBeDisabled()

    expect(submittedData).toEqual({
        intent: "invite",
        playerId: "player-1",
    })

    resolveAction({inviteUrl: "https://example.com/invites/token-1"})

    expect(
        await screen.findByRole("button", {name: "Share invite"}),
    ).toHaveClass("px-3", "py-1")
})

test("shares a generated player invitation", async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("navigator", {share})
    renderButton(() =>
        Promise.resolve({inviteUrl: "https://example.com/invites/token-1"}),
    )

    fireEvent.click(screen.getByRole("button", {name: "Invite"}))
    fireEvent.click(await screen.findByRole("button", {name: "Share invite"}))

    await waitFor(() => {
        expect(share).toHaveBeenCalledExactlyOnceWith({
            title: "Bills at Cowboys",
            text: "Join my Squares board as Alex.",
            url: "https://example.com/invites/token-1",
        })
    })
})

test("shows invitation generation errors", async () => {
    renderButton(() => Promise.resolve({error: "Player is unavailable."}))

    fireEvent.click(screen.getByRole("button", {name: "Invite"}))

    expect(await screen.findByRole("alert")).toHaveTextContent(
        "Player is unavailable.",
    )
})

test("disables invitations that were previously generated", () => {
    const action = vi.fn()
    const router = createMemoryRouter(
        [
            {
                path: "/boards/:id",
                action,
                element: (
                    <InviteButton
                        action="/boards/board-1"
                        isInvited
                        player={{id: "player-1", name: "Alex"}}
                        title="Bills at Cowboys"
                    />
                ),
            },
        ],
        {initialEntries: ["/boards/board-1"]},
    )
    render(<RouterProvider router={router} />)

    fireEvent.click(screen.getByRole("button", {name: "Invited"}))

    expect(screen.getByRole("button", {name: "Invited"})).toBeDisabled()
    expect(action).not.toHaveBeenCalled()
})
