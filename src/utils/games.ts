import {
    type EspnGameState,
    type EspnLineScore,
    type EspnScoreboard,
    type EspnScoreboardTeam,
    type EspnSummaryTeam,
    getScoreboard,
    getSummary,
} from "~/utils/espn"

type Team = {
    id: string
    name: string
    abbreviation: string
    color: string
    logo: string
}

type Game = {
    id: string
    name: string
    date: string
    teams: {
        home: Team
        away: Team
    }
}

type QuarterScore = {
    quarter: number
    home: number
    away: number
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

const createTeam = (team: EspnScoreboardTeam | EspnSummaryTeam): Team => ({
    id: team.id,
    name: team.displayName,
    abbreviation: team.abbreviation,
    color: team.color,
    logo: "logo" in team ? team.logo : (team.logos[0]?.href ?? ""),
})

const createGame = (event: EspnScoreboard["events"][number]): Game => {
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
            home: createTeam(home.team),
            away: createTeam(away.team),
        },
    }
}

const getScores = (
    homeLinescores: EspnLineScore[],
    awayLinescores: EspnLineScore[],
    completedQuarters: number,
): QuarterScore[] => {
    const quarterScores: QuarterScore[] = []

    let home = 0
    let away = 0

    for (let index = 0; index < completedQuarters; index++) {
        home += Number(homeLinescores[index]?.displayValue ?? 0)
        away += Number(awayLinescores[index]?.displayValue ?? 0)
        quarterScores.push({quarter: index + 1, home, away})
    }

    return quarterScores
}

const getGame = async (id: string): Promise<GameDetails> => {
    const summary = await getSummary(id)
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
            home: createTeam(home.team),
            away: createTeam(away.team),
        },
    }
}

const getScoreboardForRange = async (start: Date, end: Date) => {
    // ESPN groups games by US calendar dates. Include the previous day so
    // late-night games aren't missed; callers filter exact kickoff times.
    const queryStart = new Date(start)
    queryStart.setUTCDate(queryStart.getUTCDate() - 1)

    return getScoreboard(queryStart, end)
}

/** NFL games currently in progress. */
const getLiveGames = async (): Promise<Game[]> => {
    const now = new Date()
    const scoreboard = await getScoreboardForRange(now, now)

    return scoreboard.events
        .filter(event => event.status.type.state === "in")
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
        .map(createGame)
}

/** The next seven days of games, or the next five games when that window is empty. */
const getUpcomingGames = async (): Promise<Game[]> => {
    const now = new Date()
    const end = new Date(now)
    end.setUTCDate(end.getUTCDate() + 7)

    const scoreboard = await getScoreboardForRange(now, end)

    const upcomingGames = scoreboard.events
        .filter(event => {
            const kickoff = new Date(event.date)

            return (
                event.status.type.state === "pre" &&
                kickoff >= now &&
                kickoff <= end
            )
        })
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
        .map(createGame)

    if (upcomingGames.length > 0) {
        return upcomingGames
    }

    const oneYearLater = new Date(now)
    oneYearLater.setUTCFullYear(oneYearLater.getUTCFullYear() + 1)

    const yearScoreboard = await getScoreboard(now, oneYearLater)

    const upcomingYearGames = yearScoreboard.events
        .filter(
            event =>
                event.status.type.state === "pre" &&
                new Date(event.date) >= now,
        )
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
        .slice(0, 5)
        .map(createGame)

    return upcomingYearGames
}

/** Post-game NFL events with kickoffs in the past seven days, newest first. */
const getRecentGames = async (): Promise<Game[]> => {
    const now = new Date()
    const start = new Date(now)
    start.setUTCDate(start.getUTCDate() - 7)

    const scoreboard = await getScoreboardForRange(start, now)

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
        .map(createGame)
}

export {getGame, getLiveGames, getRecentGames, getUpcomingGames}
export type {Game, GameDetails, QuarterScore, Team}
