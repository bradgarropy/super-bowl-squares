type EspnGameState = "pre" | "in" | "post"

type EspnStatus = {
    type: {
        name: string
        completed: boolean
        state: EspnGameState
    }
}

type EspnTeam = {
    id: string
    displayName: string
    abbreviation: string
    color: string
}

type EspnScoreboardTeam = EspnTeam & {
    logo: string
}

type EspnSummaryTeam = EspnTeam & {
    logos: {
        href: string
    }[]
}

type EspnLineScore = {
    displayValue: string
}

type EspnSeason = {
    year: number
    type: number
    slug: string
}

type EspnScoreboard = {
    events: {
        id: string
        name: string
        date: string
        season: EspnSeason
        status: EspnStatus
        competitions: {
            competitors: {
                homeAway: "home" | "away"
                team: EspnScoreboardTeam
            }[]
        }[]
    }[]
}

type EspnSummary = {
    header: {
        id: string
        competitions: {
            date: string
            status: EspnStatus & {
                displayClock: string
                period: number
            }
            competitors: {
                homeAway: "home" | "away"
                score?: string
                linescores?: EspnLineScore[]
                team: EspnSummaryTeam
            }[]
        }[]
    }
}

const getScoreboard = async (year: number): Promise<EspnScoreboard> => {
    const url = new URL(
        "https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    )

    url.searchParams.set("dates", String(year))
    url.searchParams.set("limit", "1000")

    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`ESPN scoreboard request failed: ${response.status}`)
    }

    return response.json()
}

const getSummary = async (id: string): Promise<EspnSummary> => {
    const url = new URL(
        "https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/summary",
    )

    url.searchParams.set("event", id)

    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`ESPN game summary request failed: ${response.status}`)
    }

    return response.json()
}

export {getScoreboard, getSummary}
export type {
    EspnGameState,
    EspnLineScore,
    EspnScoreboard,
    EspnScoreboardTeam,
    EspnSeason,
    EspnSummary,
    EspnSummaryTeam,
}
