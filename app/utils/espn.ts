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

const getSuperBowl = async (): Promise<SuperBowl> => {
    const res = await fetch(
        "http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    )

    const json = await res.json()

    const game = json.events[0].competitions[0]
    const title = game.notes[0].headline

    const homeTeam = game.competitors.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (competitor: any) => competitor.homeAway === "home",
    ).team

    const awayTeam = game.competitors.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (competitor: any) => competitor.homeAway === "away",
    ).team

    const superBowl: SuperBowl = {
        title,
        teams: {
            home: {
                name: homeTeam.displayName,
                color: homeTeam.color,
                logo: homeTeam.logo,
            },
            away: {
                name: awayTeam.displayName,
                color: awayTeam.color,
                logo: awayTeam.logo,
            },
        },
    }
    return superBowl
}

export {getSuperBowl}
export type {SuperBowl, Team}
