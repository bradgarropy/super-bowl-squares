import {afterEach, expect, test, vi} from "vitest"

import {getScoreboard, getSummary} from "~/utils/espn"

const fetchMock = vi.fn<typeof fetch>()
vi.stubGlobal("fetch", fetchMock)

afterEach(() => {
    fetchMock.mockReset()
})

test("returns the scoreboard response without transforming it", async () => {
    const scoreboard = {
        events: [
            {
                id: "401874048",
                name: "New Orleans Saints at Dallas Cowboys",
                date: "2026-08-29T00:00Z",
                status: {
                    type: {
                        name: "STATUS_SCHEDULED",
                        completed: false,
                        state: "pre",
                    },
                },
                competitions: [],
            },
        ],
    }
    fetchMock.mockResolvedValue(Response.json(scoreboard))

    const start = new Date("2026-08-27T00:00Z")
    const end = new Date("2026-09-03T00:00Z")

    expect(await getScoreboard(start, end)).toEqual(scoreboard)

    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.origin + url.pathname).toBe(
        "https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    )
    expect(url.searchParams.get("dates")).toBe("20260827-20260903")
    expect(url.searchParams.get("limit")).toBe("1000")
})

test("returns the summary response without transforming it", async () => {
    const summary = {
        header: {
            id: "401874048",
            competitions: [],
        },
    }
    fetchMock.mockResolvedValue(Response.json(summary))

    expect(await getSummary("401874048")).toEqual(summary)

    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.origin + url.pathname).toBe(
        "https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/summary",
    )
    expect(url.searchParams.get("event")).toBe("401874048")
})

test("reports scoreboard HTTP errors", async () => {
    fetchMock.mockResolvedValue(new Response(null, {status: 403}))

    await expect(
        getScoreboard(new Date("2026-08-27"), new Date("2026-09-03")),
    ).rejects.toThrow("ESPN scoreboard request failed: 403")
})

test("reports summary HTTP errors", async () => {
    fetchMock.mockResolvedValue(new Response(null, {status: 404}))

    await expect(getSummary("missing")).rejects.toThrow(
        "ESPN game summary request failed: 404",
    )
})
