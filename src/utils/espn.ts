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

type UpcomingGame = {
    id: string
    name: string
    date: string
    teams: {
        home: GameTeam
        away: GameTeam
    }
}

// Only the scoreboard fields this module uses, not ESPN's entire response.
type EspnTeam = {
    id: string
    displayName: string
    abbreviation: string
    color: string
    logo: string
}

type EspnScoreboard = {
    events: {
        id: string
        name: string
        date: string
        status: {type: {name: string}}
        competitions: {
            competitors: {
                homeAway: "home" | "away"
                team: EspnTeam
            }[]
        }[]
    }[]
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

/** Scheduled NFL games from now through the next seven days, earliest first. */
const getUpcomingGames = async (): Promise<UpcomingGame[]> => {
    const now = new Date()

    // ESPN groups games by US calendar dates. Include yesterday so late-night
    // games aren't missed after midnight UTC; filter exact kickoff times below.
    const start = new Date(now)
    start.setUTCDate(start.getUTCDate() - 1)

    const end = new Date(now)
    end.setUTCDate(end.getUTCDate() + 7)

    const url = new URL(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    )

    url.searchParams.set(
        "dates",
        `${formatEspnDate(start)}-${formatEspnDate(end)}`,
    )

    url.searchParams.set("limit", "1000")
    console.log(url)

    const response = await fetch(url, {
        headers: {
            "Accept": "application/json",
            "User-Agent": "super-bowl-squares",
        },
    })

    if (!response.ok) {
        // Temporary diagnostics: keep upstream response details in server logs.
        console.error("ESPN scoreboard response", {
            url: url.href,
            status: response.status,
            contentType: response.headers.get("content-type"),
            server: response.headers.get("server"),
            requestId: response.headers.get("cf-ray"),
            body: (await response.text()).slice(0, 2000),
        })

        throw new Error(`ESPN scoreboard request failed: ${response.status}`)
    }

    const scoreboard: EspnScoreboard = await response.json()

    return scoreboard.events
        .filter(event => {
            const kickoff = new Date(event.date)

            return (
                event.status.type.name === "STATUS_SCHEDULED" &&
                kickoff >= now &&
                kickoff <= end
            )
        })
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
        .map(event => {
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
        })
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

export {getSuperBowl, getUpcomingGames}
export type {GameTeam, SuperBowl, Team, UpcomingGame}
