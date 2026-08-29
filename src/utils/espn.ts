type SuperBowl = {
    title: string
    teams: {
        home: Team
        away: Team
    }
}

type Team = {
    name: string
    color: string
    logo: string
}

type GameTeam = Team & {
    id: string
    abbreviation: string
}

type Game = {
    id: string
    name: string
    date: string
    teams: {
        home: GameTeam
        away: GameTeam
    }
}

type QuarterScore = {
    quarter: number
    home: number
    away: number
}

type LineScore = {
    value: number
}

type GameDetails = Game & {
    state: EspnGameState
    quarter: number
    clock: string
    score: {
        home: number
        away: number
    }
    quarterScores: QuarterScore[]
}

// Only the scoreboard fields this module uses, not ESPN's entire response.
type EspnTeam = {
    id: string
    displayName: string
    abbreviation: string
    color: string
    logo: string
}

type EspnGameState = "pre" | "in" | "post"

type EspnStatus = {
    type: {
        name: string
        completed: boolean
        state: EspnGameState
    }
}

type EspnScoreboard = {
    events: {
        id: string
        name: string
        date: string
        status: EspnStatus
        competitions: {
            competitors: {
                homeAway: "home" | "away"
                team: EspnTeam
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
                score: string
                linescores?: LineScore[]
                team: EspnTeam
            }[]
        }[]
    }
}

const formatEspnDate = (date: Date) => {
    return date.toISOString().slice(0, 10).replaceAll("-", "")
}

const mapTeam = (team: EspnTeam): GameTeam => ({
    id: team.id,
    name: team.displayName,
    abbreviation: team.abbreviation,
    color: team.color,
    logo: team.logo,
})

const mapGame = (event: EspnScoreboard["events"][number]): Game => {
    const competitors = event.competitions[0]?.competitors
    const home = competitors?.find(team => team.homeAway === "home")
    const away = competitors?.find(team => team.homeAway === "away")

    if (!home || !away) {
        throw new Error(`ESPN game ${event.id} is missing a team`)
    }

    return {
        id: event.id,
        name: event.name,
        date: event.date,
        teams: {
            home: mapTeam(home.team),
            away: mapTeam(away.team),
        },
    }
}

const getScores = (
    homeLinescores: LineScore[],
    awayLinescores: LineScore[],
    completedQuarters: number,
): QuarterScore[] => {
    const quarterScores: QuarterScore[] = []
    let home = 0
    let away = 0

    for (let index = 0; index < completedQuarters; index++) {
        home += homeLinescores[index]?.value ?? 0
        away += awayLinescores[index]?.value ?? 0
        quarterScores.push({quarter: index + 1, home, away})
    }

    return quarterScores
}

const getGame = async (id: string): Promise<GameDetails> => {
    const url = new URL(
        "https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/summary",
    )
    url.searchParams.set("event", id)

    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`ESPN game summary request failed: ${response.status}`)
    }

    const summary: EspnSummary = await response.json()
    const competition = summary.header.competitions[0]
    const home = competition?.competitors.find(team => team.homeAway === "home")
    const away = competition?.competitors.find(team => team.homeAway === "away")

    if (!competition || !home || !away) {
        throw new Error(`ESPN game ${id} is missing game details`)
    }

    const completedQuarters =
        competition.status.type.state === "post"
            ? Math.max(
                  home.linescores?.length ?? 0,
                  away.linescores?.length ?? 0,
              )
            : Math.max(
                  competition.status.period -
                      (competition.status.displayClock === "0:00" ? 0 : 1),
                  0,
              )

    return {
        id: summary.header.id,
        name: `${away.team.displayName} at ${home.team.displayName}`,
        date: competition.date,
        state: competition.status.type.state,
        quarter: competition.status.period,
        clock: competition.status.displayClock,
        score: {
            home: Number(home.score),
            away: Number(away.score),
        },
        quarterScores: getScores(
            home.linescores ?? [],
            away.linescores ?? [],
            completedQuarters,
        ),
        teams: {
            home: mapTeam(home.team),
            away: mapTeam(away.team),
        },
    }
}

const getScoreboard = async (
    start: Date,
    end: Date,
): Promise<EspnScoreboard> => {
    // ESPN groups games by US calendar dates. Include the previous day so
    // late-night games aren't missed; callers filter exact kickoff times.
    const queryStart = new Date(start)
    queryStart.setUTCDate(queryStart.getUTCDate() - 1)

    const url = new URL(
        "https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    )

    url.searchParams.set(
        "dates",
        `${formatEspnDate(queryStart)}-${formatEspnDate(end)}`,
    )

    url.searchParams.set("limit", "1000")

    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`ESPN scoreboard request failed: ${response.status}`)
    }

    return response.json()
}

/** NFL games currently in progress. */
const getLiveGames = async (): Promise<Game[]> => {
    const now = new Date()
    const scoreboard = await getScoreboard(now, now)

    return scoreboard.events
        .filter(event => event.status.type.state === "in")
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
        .map(mapGame)
}

/** Pre-game NFL events from now through the next seven days, earliest first. */
const getUpcomingGames = async (): Promise<Game[]> => {
    const now = new Date()
    const end = new Date(now)
    end.setUTCDate(end.getUTCDate() + 7)

    const scoreboard = await getScoreboard(now, end)

    return scoreboard.events
        .filter(event => {
            const kickoff = new Date(event.date)

            return (
                event.status.type.state === "pre" &&
                kickoff >= now &&
                kickoff <= end
            )
        })
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
        .map(mapGame)
}

/** Post-game NFL events with kickoffs in the past seven days, newest first. */
const getRecentGames = async (): Promise<Game[]> => {
    const now = new Date()
    const start = new Date(now)
    start.setUTCDate(start.getUTCDate() - 7)

    const scoreboard = await getScoreboard(start, now)

    return scoreboard.events
        .filter(event => {
            const kickoff = new Date(event.date)

            return (
                event.status.type.state === "post" &&
                kickoff >= start &&
                kickoff <= now
            )
        })
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
        .map(mapGame)
}

const getSuperBowl = async (): Promise<SuperBowl> => {
    // const res = await fetch(
    //     "http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    // )

    // const json = await res.json()

    // const game = json.events[0].competitions[0]
    // const title = game.notes[0].headline

    // const homeTeam = game.competitors.find(
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     (competitor: any) => competitor.homeAway === "home",
    // ).team

    // const awayTeam = game.competitors.find(
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     (competitor: any) => competitor.homeAway === "away",
    // ).team

    const superBowl: SuperBowl = {
        title: "Super bowl",
        teams: {
            home: {
                name: "Cowboys",
                color: "00008B",
                logo: "foo.jpg",
                // name: homeTeam.displayName,
                // color: homeTeam.color,
                // logo: homeTeam.logo,
            },
            away: {
                name: "Eagles",
                color: "2E8B57",
                logo: "foo.jpg",
                // name: awayTeam.displayName,
                // color: awayTeam.color,
                // logo: awayTeam.logo,
            },
        },
    }
    return superBowl
}

export {getGame, getLiveGames, getRecentGames, getSuperBowl, getUpcomingGames}
export type {Game, GameDetails, GameTeam, QuarterScore, SuperBowl, Team}
