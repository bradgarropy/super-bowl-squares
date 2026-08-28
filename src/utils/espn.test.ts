import {afterEach, beforeEach, expect, test, vi} from "vitest"

import {getRecentGames, getUpcomingGames} from "~/utils/espn"

const homeTeam = {
    id: "6",
    displayName: "Dallas Cowboys",
    abbreviation: "DAL",
    color: "002244",
    logo: "https://example.com/dallas.png",
}

const awayTeam = {
    id: "18",
    displayName: "New Orleans Saints",
    abbreviation: "NO",
    color: "d3bc8d",
    logo: "https://example.com/new-orleans.png",
}

const createEvent = (
    id = "401874048",
    date = "2026-08-29T00:00Z",
    status = "STATUS_SCHEDULED",
) => ({
    id,
    date,
    name: "New Orleans Saints at Dallas Cowboys",
    status: {
        type: {
            name: status,
            completed: ["STATUS_FINAL", "STATUS_FINAL_OVERTIME"].includes(
                status,
            ),
        },
    },
    competitions: [
        {
            // Deliberately away-first: ESPN array order isn't a team assignment.
            competitors: [
                {homeAway: "away", team: awayTeam},
                {homeAway: "home", team: homeTeam},
            ],
        },
    ],
})

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-27T12:00:00Z"))
    vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    fetchMock.mockReset()
})

test("requests a date range and returns a small, typed game shape", async () => {
    fetchMock.mockResolvedValue(Response.json({events: [createEvent()]}))

    expect(await getUpcomingGames()).toEqual([
        {
            id: "401874048",
            name: "New Orleans Saints at Dallas Cowboys",
            date: "2026-08-29T00:00Z",
            teams: {
                home: {
                    id: "6",
                    name: "Dallas Cowboys",
                    abbreviation: "DAL",
                    color: "002244",
                    logo: homeTeam.logo,
                },
                away: {
                    id: "18",
                    name: "New Orleans Saints",
                    abbreviation: "NO",
                    color: "d3bc8d",
                    logo: awayTeam.logo,
                },
            },
        },
    ])

    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.origin + url.pathname).toBe(
        "https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    )
    expect(url.searchParams.get("dates")).toBe("20260826-20260903")
    expect(url.searchParams.get("limit")).toBe("1000")
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(url)
})

test("only returns scheduled games in the next seven days, ordered by kickoff", async () => {
    fetchMock.mockResolvedValue(
        Response.json({
            events: [
                createEvent("later", "2026-09-02T23:00Z"),
                createEvent("past", "2026-08-27T11:59Z"),
                createEvent("live", undefined, "STATUS_IN_PROGRESS"),
                createEvent("final", undefined, "STATUS_FINAL"),
                createEvent("canceled", undefined, "STATUS_CANCELED"),
                createEvent("postponed", undefined, "STATUS_POSTPONED"),
                createEvent("earlier", "2026-08-28T23:00Z"),
                createEvent("outside-window", "2026-09-03T12:01Z"),
                createEvent("end", "2026-09-03T12:00Z"),
                createEvent("now", "2026-08-27T12:00Z"),
            ],
        }),
    )

    expect((await getUpcomingGames()).map(game => game.id)).toEqual([
        "now",
        "earlier",
        "later",
        "end",
    ])
})

test("returns an empty list when no games are scheduled", async () => {
    fetchMock.mockResolvedValue(Response.json({events: []}))
    expect(await getUpcomingGames()).toEqual([])
})

test("includes the previous ESPN calendar date for late-night kickoffs", async () => {
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"))
    fetchMock.mockResolvedValue(
        Response.json({events: [createEvent("late", "2026-09-01T01:00Z")]}),
    )

    expect((await getUpcomingGames()).map(game => game.id)).toEqual(["late"])
    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.searchParams.get("dates")).toBe("20260831-20260908")
})

test("reports an HTTP error instead of returning an empty list", async () => {
    fetchMock.mockResolvedValue(new Response("Access denied", {status: 403}))

    await expect(getUpcomingGames()).rejects.toThrow(
        "ESPN scoreboard request failed: 403",
    )
})

test("propagates network errors", async () => {
    fetchMock.mockRejectedValue(new Error("Network unavailable"))
    await expect(getUpcomingGames()).rejects.toThrow("Network unavailable")
})

test("reports a game missing a team", async () => {
    const event = createEvent()
    event.competitions[0].competitors.pop()
    fetchMock.mockResolvedValue(Response.json({events: [event]}))

    await expect(getUpcomingGames()).rejects.toThrow(
        "ESPN game 401874048 is missing a team",
    )
})

test("requests the past week and maps recent games with home and away teams", async () => {
    fetchMock.mockResolvedValue(
        Response.json({
            events: [
                createEvent("recent", "2026-08-26T00:00Z", "STATUS_FINAL"),
            ],
        }),
    )

    expect(await getRecentGames()).toEqual([
        {
            id: "recent",
            name: "New Orleans Saints at Dallas Cowboys",
            date: "2026-08-26T00:00Z",
            teams: {
                home: {
                    id: "6",
                    name: "Dallas Cowboys",
                    abbreviation: "DAL",
                    color: "002244",
                    logo: homeTeam.logo,
                },
                away: {
                    id: "18",
                    name: "New Orleans Saints",
                    abbreviation: "NO",
                    color: "d3bc8d",
                    logo: awayTeam.logo,
                },
            },
        },
    ])

    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.origin + url.pathname).toBe(
        "https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    )
    expect(url.searchParams.get("dates")).toBe("20260819-20260827")
    expect(url.searchParams.get("limit")).toBe("1000")
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(url)
})

test("returns only completed games from the past seven days, newest first", async () => {
    fetchMock.mockResolvedValue(
        Response.json({
            events: [
                createEvent("oldest", "2026-08-20T12:00Z", "STATUS_FINAL"),
                createEvent("too-old", "2026-08-20T11:59Z", "STATUS_FINAL"),
                createEvent("future", "2026-08-27T12:01Z", "STATUS_FINAL"),
                createEvent("scheduled", "2026-08-26T00:00Z"),
                createEvent("live", "2026-08-26T00:00Z", "STATUS_IN_PROGRESS"),
                createEvent("canceled", "2026-08-26T00:00Z", "STATUS_CANCELED"),
                createEvent(
                    "postponed",
                    "2026-08-26T00:00Z",
                    "STATUS_POSTPONED",
                ),
                createEvent(
                    "overtime",
                    "2026-08-26T00:00Z",
                    "STATUS_FINAL_OVERTIME",
                ),
                createEvent("latest", "2026-08-27T12:00Z", "STATUS_FINAL"),
            ],
        }),
    )

    expect((await getRecentGames()).map(game => game.id)).toEqual([
        "latest",
        "overtime",
        "oldest",
    ])
})

test("returns an empty list when there are no recent games", async () => {
    fetchMock.mockResolvedValue(Response.json({events: []}))
    expect(await getRecentGames()).toEqual([])
})

test("handles recent games across year boundaries and midnight UTC", async () => {
    vi.setSystemTime(new Date("2027-01-03T00:00:00Z"))
    fetchMock.mockResolvedValue(
        Response.json({
            events: [createEvent("late", "2026-12-27T01:00Z", "STATUS_FINAL")],
        }),
    )

    expect((await getRecentGames()).map(game => game.id)).toEqual(["late"])
    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.searchParams.get("dates")).toBe("20261226-20270103")
})

test("propagates HTTP errors when fetching recent games", async () => {
    fetchMock.mockResolvedValue(new Response(null, {status: 503}))
    await expect(getRecentGames()).rejects.toThrow(
        "ESPN scoreboard request failed: 503",
    )
})
