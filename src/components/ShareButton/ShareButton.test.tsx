import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react"
import {afterEach, expect, test, vi} from "vitest"

import ShareButton from "~/components/ShareButton"

afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
})

const renderButton = () => {
    render(
        <ShareButton title="Bills at Cowboys" url="/boards/board-1/welcome" />,
    )
}

test("opens the native share sheet when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn()
    vi.stubGlobal("navigator", {share, clipboard: {writeText}})
    renderButton()

    fireEvent.click(screen.getByRole("button", {name: "Share board"}))

    await waitFor(() => {
        expect(share).toHaveBeenCalledExactlyOnceWith({
            title: "Bills at Cowboys",
            text: "Join my Squares board.",
            url: expect.stringMatching(/\/boards\/board-1\/welcome$/),
        })
    })
    expect(writeText).not.toHaveBeenCalled()
})

test("copies the welcome link when native sharing is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("navigator", {clipboard: {writeText}})
    renderButton()

    fireEvent.click(screen.getByRole("button", {name: "Share board"}))

    await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith(
            expect.stringMatching(/\/boards\/board-1\/welcome$/),
        )
    })
    expect(screen.getByText("Link copied")).toBeInTheDocument()
})

test("does nothing when native sharing is cancelled", async () => {
    const error = new Error("Share cancelled")
    error.name = "AbortError"
    const share = vi.fn().mockRejectedValue(error)
    const writeText = vi.fn()
    vi.stubGlobal("navigator", {share, clipboard: {writeText}})
    renderButton()

    fireEvent.click(screen.getByRole("button", {name: "Share board"}))

    await waitFor(() => expect(share).toHaveBeenCalledOnce())
    expect(writeText).not.toHaveBeenCalled()
    expect(screen.queryByText("Unable to share link")).not.toBeInTheDocument()
})

test("copies the link when native sharing fails", async () => {
    const share = vi.fn().mockRejectedValue(new Error("Share unavailable"))
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("navigator", {share, clipboard: {writeText}})
    renderButton()

    fireEvent.click(screen.getByRole("button", {name: "Share board"}))

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce())
    expect(screen.getByText("Link copied")).toBeInTheDocument()
})

test("shows an error when the link cannot be shared or copied", async () => {
    const writeText = vi
        .fn()
        .mockRejectedValue(new Error("Clipboard unavailable"))
    vi.stubGlobal("navigator", {clipboard: {writeText}})
    renderButton()

    fireEvent.click(screen.getByRole("button", {name: "Share board"}))

    expect(await screen.findByText("Unable to share link")).toBeInTheDocument()
})
