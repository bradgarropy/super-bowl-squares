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
    state: EspnGameState
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
    quarter: number
    clock: string
    score: {
        home: number
        away: number
    }
    quarterScores: QuarterScore[]
}

const createTeam = (team: EspnScoreboardTeam | EspnSummaryTeam): Team => {
    const logo =
        "logo" in team
            ? team.logo
            : "logos" in team
              ? team.logos?.[0]?.href
              : undefined

    return {
        id: team.id,
        name: team.displayName,
        abbreviation: team.abbreviation,
        color: team.color,
        logo: logo ?? "",
    }
}

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
        state: event.status.type.state,
        teams: {
            home: createTeam(home.team),
            away: createTeam(away.team),
        },
    }
}

const getSeason = (): number => {
    const now = new Date()
    const year = now.getUTCFullYear()
    const month = now.getUTCMonth()

    const season = month < 2 ? year - 1 : year
    return season
}

const getGames = async (year = getSeason()): Promise<Game[]> => {
    const scoreboards = await Promise.all([
        getScoreboard(year),
        getScoreboard(year + 1),
    ])

    return scoreboards
        .flatMap(scoreboard => scoreboard.events)
        .filter(event => event.season.year === year)
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
        .map(createGame)
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
            home: Number(home.score ?? 0),
            away: Number(away.score ?? 0),
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

export {getGame, getGames, getSeason}
export type {Game, GameDetails, QuarterScore, Team}
