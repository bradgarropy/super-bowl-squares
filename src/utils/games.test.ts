import {afterEach, beforeEach, expect, test, vi} from "vitest"

import type {EspnScoreboard} from "~/utils/espn"
import {getGame, getGames, getSeason} from "~/utils/games"

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

const {logo: homeLogo, ...homeSummaryTeam} = homeTeam
const {logo: awayLogo, ...awaySummaryTeam} = awayTeam

const homeTeamSummary = {
    ...homeSummaryTeam,
    logos: [{href: homeLogo}],
}

const awayTeamSummary = {
    ...awaySummaryTeam,
    logos: [{href: awayLogo}],
}

const createEvent = (
    id = "401874048",
    date = "2026-08-29T00:00Z",
    status = "STATUS_SCHEDULED",
    season = 2026,
): EspnScoreboard["events"][number] => {
    const completed = ["STATUS_FINAL", "STATUS_FINAL_OVERTIME"].includes(status)
    const state =
        status === "STATUS_IN_PROGRESS"
            ? "in"
            : completed ||
                ["STATUS_CANCELED", "STATUS_POSTPONED"].includes(status)
              ? "post"
              : "pre"

    return {
        id,
        date,
        name: "New Orleans Saints at Dallas Cowboys",
        season: {
            year: season,
            type: 2,
            slug: "regular-season",
        },
        status: {
            type: {
                name: status,
                completed,
                state,
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
    }
}

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

test.each([
    ["2027-01-15T12:00:00Z", 2026],
    ["2027-02-15T12:00:00Z", 2026],
    ["2027-03-01T00:00:00Z", 2027],
    ["2027-12-31T23:59:59Z", 2027],
])("gets the NFL season for %s", (date, season) => {
    vi.setSystemTime(new Date(date))
    expect(getSeason()).toBe(season)
})

test("gets one NFL season across calendar years", async () => {
    fetchMock.mockResolvedValueOnce(
        Response.json({
            events: [
                createEvent("regular", "2026-09-10T00:00Z"),
                createEvent(
                    "previous-season",
                    "2026-01-10T00:00Z",
                    "STATUS_FINAL",
                    2025,
                ),
            ],
        }),
    )
    fetchMock.mockResolvedValueOnce(
        Response.json({
            events: [
                createEvent(
                    "super-bowl",
                    "2027-02-14T00:00Z",
                    "STATUS_FINAL",
                ),
                createEvent(
                    "next-season",
                    "2027-09-09T00:00Z",
                    "STATUS_SCHEDULED",
                    2027,
                ),
            ],
        }),
    )

    expect((await getGames()).map(game => game.id)).toEqual([
        "regular",
        "super-bowl",
    ])

    const urls = fetchMock.mock.calls.map(call => new URL(String(call[0])))
    expect(urls.map(url => url.searchParams.get("dates"))).toEqual([
        "2026",
        "2027",
    ])
})

test("reports a season game missing a team", async () => {
    const event = createEvent()
    event.competitions[0].competitors.pop()
    fetchMock.mockResolvedValueOnce(Response.json({events: [event]}))
    fetchMock.mockResolvedValueOnce(Response.json({events: []}))

    await expect(getGames()).rejects.toThrow(
        "ESPN game 401874048 is missing a team",
    )
})

test("handles a season team without a logo", async () => {
    const event = createEvent()
    const {logo: _logo, ...teamWithoutLogo} = homeTeam
    event.competitions[0].competitors[1].team = teamWithoutLogo
    fetchMock.mockResolvedValueOnce(Response.json({events: [event]}))
    fetchMock.mockResolvedValueOnce(Response.json({events: []}))

    expect((await getGames())[0].teams.home.logo).toBe("")
})

test("gets game details with cumulative scores at the end of each quarter", async () => {
    fetchMock.mockResolvedValue(
        Response.json({
            header: {
                id: "401874048",
                competitions: [
                    {
                        date: "2026-08-29T00:00Z",
                        status: {
                            displayClock: "8:32",
                            period: 4,
                            type: {
                                name: "STATUS_IN_PROGRESS",
                                state: "in",
                                completed: false,
                            },
                        },
                        competitors: [
                            {
                                homeAway: "away",
                                score: "17",
                                linescores: [
                                    {displayValue: "3"},
                                    {displayValue: "7"},
                                    {displayValue: "7"},
                                    {displayValue: "0"},
                                ],
                                team: awayTeamSummary,
                            },
                            {
                                homeAway: "home",
                                score: "27",
                                linescores: [
                                    {displayValue: "7"},
                                    {displayValue: "10"},
                                    {displayValue: "7"},
                                    {displayValue: "3"},
                                ],
                                team: homeTeamSummary,
                            },
                        ],
                    },
                ],
            },
        }),
    )

    expect(await getGame("401874048")).toEqual({
        id: "401874048",
        name: "New Orleans Saints at Dallas Cowboys",
        date: "2026-08-29T00:00Z",
        state: "in",
        quarter: 4,
        clock: "8:32",
        score: {home: 27, away: 17},
        quarterScores: [
            {quarter: 1, home: 7, away: 3},
            {quarter: 2, home: 17, away: 10},
            {quarter: 3, home: 24, away: 17},
        ],
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
    })

    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.origin + url.pathname).toBe(
        "https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/summary",
    )
    expect(url.searchParams.get("event")).toBe("401874048")
})

test("includes the final score for an overtime period", async () => {
    fetchMock.mockResolvedValue(
        Response.json({
            header: {
                id: "overtime",
                competitions: [
                    {
                        date: "2026-08-29T00:00Z",
                        status: {
                            displayClock: "0:00",
                            period: 5,
                            type: {
                                name: "STATUS_FINAL",
                                state: "post",
                                completed: true,
                            },
                        },
                        competitors: [
                            {
                                homeAway: "home",
                                score: "27",
                                linescores: [
                                    {displayValue: "7"},
                                    {displayValue: "10"},
                                    {displayValue: "0"},
                                    {displayValue: "7"},
                                    {displayValue: "3"},
                                ],
                                team: homeTeamSummary,
                            },
                            {
                                homeAway: "away",
                                score: "24",
                                linescores: [
                                    {displayValue: "3"},
                                    {displayValue: "7"},
                                    {displayValue: "7"},
                                    {displayValue: "7"},
                                    {displayValue: "0"},
                                ],
                                team: awayTeamSummary,
                            },
                        ],
                    },
                ],
            },
        }),
    )

    expect((await getGame("overtime")).quarterScores).toEqual([
        {quarter: 1, home: 7, away: 3},
        {quarter: 2, home: 17, away: 10},
        {quarter: 3, home: 17, away: 17},
        {quarter: 4, home: 24, away: 24},
        {quarter: 5, home: 27, away: 24},
    ])
})

test("reports an HTTP error when game details cannot be loaded", async () => {
    fetchMock.mockResolvedValue(new Response(null, {status: 404}))

    await expect(getGame("missing")).rejects.toThrow(
        "ESPN game summary request failed: 404",
    )
})

test("defaults missing scheduled scores to zero", async () => {
    fetchMock.mockResolvedValue(
        Response.json({
            header: {
                id: "scheduled",
                competitions: [
                    {
                        date: "2026-09-09T00:20Z",
                        status: {
                            displayClock: "0:00",
                            period: 0,
                            type: {
                                name: "STATUS_SCHEDULED",
                                state: "pre",
                                completed: false,
                            },
                        },
                        competitors: [
                            {homeAway: "home", team: homeTeamSummary},
                            {homeAway: "away", team: awayTeamSummary},
                        ],
                    },
                ],
            },
        }),
    )

    expect((await getGame("scheduled")).score).toEqual({home: 0, away: 0})
})

test("reports game details with no competition", async () => {
    fetchMock.mockResolvedValue(
        Response.json({header: {id: "missing", competitions: []}}),
    )

    await expect(getGame("missing")).rejects.toThrow(
        "ESPN game missing is missing game details",
    )
})

test("reports game details with a missing home or away team", async () => {
    const competition = {
        date: "2026-08-29T00:00Z",
        status: {
            displayClock: "0:00",
            period: 0,
            type: {
                name: "STATUS_SCHEDULED",
                state: "pre",
                completed: false,
            },
        },
    }

    fetchMock.mockResolvedValueOnce(
        Response.json({
            header: {
                id: "missing-home",
                competitions: [
                    {
                        ...competition,
                        competitors: [
                            {
                                homeAway: "away",
                                score: "0",
                                team: awayTeamSummary,
                            },
                        ],
                    },
                ],
            },
        }),
    )
    fetchMock.mockResolvedValueOnce(
        Response.json({
            header: {
                id: "missing-away",
                competitions: [
                    {
                        ...competition,
                        competitors: [
                            {
                                homeAway: "home",
                                score: "0",
                                team: homeTeamSummary,
                            },
                        ],
                    },
                ],
            },
        }),
    )

    await expect(getGame("missing-home")).rejects.toThrow(
        "ESPN game missing-home is missing game details",
    )
    await expect(getGame("missing-away")).rejects.toThrow(
        "ESPN game missing-away is missing game details",
    )
})

test("handles completed games without line scores or team logos", async () => {
    fetchMock.mockResolvedValue(
        Response.json({
            header: {
                id: "no-linescores",
                competitions: [
                    {
                        date: "2026-08-29T00:00Z",
                        status: {
                            displayClock: "0:00",
                            period: 4,
                            type: {
                                name: "STATUS_FINAL",
                                state: "post",
                                completed: true,
                            },
                        },
                        competitors: [
                            {
                                homeAway: "home",
                                score: "0",
                                team: {...homeSummaryTeam, logos: []},
                            },
                            {
                                homeAway: "away",
                                score: "0",
                                team: {...awaySummaryTeam, logos: []},
                            },
                        ],
                    },
                ],
            },
        }),
    )

    const game = await getGame("no-linescores")

    expect(game.quarterScores).toEqual([])
    expect(game.teams.home.logo).toBe("")
    expect(game.teams.away.logo).toBe("")
})

test("fills missing quarter scores with zero", async () => {
    fetchMock.mockResolvedValue(
        Response.json({
            header: {
                id: "missing-quarter",
                competitions: [
                    {
                        date: "2026-08-29T00:00Z",
                        status: {
                            displayClock: "0:00",
                            period: 2,
                            type: {
                                name: "STATUS_IN_PROGRESS",
                                state: "in",
                                completed: false,
                            },
                        },
                        competitors: [
                            {
                                homeAway: "home",
                                score: "7",
                                linescores: [{displayValue: "7"}, null],
                                team: homeTeamSummary,
                            },
                            {
                                homeAway: "away",
                                score: "3",
                                linescores: [{displayValue: "3"}, null],
                                team: awayTeamSummary,
                            },
                        ],
                    },
                ],
            },
        }),
    )

    expect((await getGame("missing-quarter")).quarterScores).toEqual([
        {quarter: 1, home: 7, away: 3},
        {quarter: 2, home: 7, away: 3},
    ])
})
