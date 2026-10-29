import {mkdtemp, rm, writeFile} from "node:fs/promises"
import {tmpdir} from "node:os"
import path from "node:path"
import {parseArgs} from "node:util"

import {eq, sql} from "drizzle-orm"
import type {BatchItem} from "drizzle-orm/batch"
import {getPlatformProxy, unstable_readConfig} from "wrangler"

import {createDb, type Database} from "~/db/client.server"
import {
    type Board,
    board,
    type NewPlayer,
    type NewSquare,
    player,
    square,
    type User,
    user,
} from "~/db/schema"

type Environment = "local" | "production" | "staging"
type RemoteEnvironment = Exclude<Environment, "local">
type HistoricalPlayerInitial = keyof typeof historicalPlayers
type HistoricalBoard = {
    assignments: readonly string[]
    gameId: Board["gameId"]
    year: number
}
type D1DatabaseConfig = {
    binding: string
    database_id: string
    database_name: string
}
type Query = BatchItem<"sqlite">

const historicalPlayers = {
    B: "Brad",
    G: "Gaby",
    M: "Matt",
    Y: "Yarib",
} as const

const historicalBoards = [
    {
        year: 2020,
        gameId: "401131047",
        assignments: [
            "MYMYMMYGMB",
            "BBBBBBGGGG",
            "MGMYMMGGYM",
            "MYGYYMYYBY",
            "GYGYYBBMMG",
            "GYBBMYBMMM",
            "GGGMGGYBMY",
            "MYYGMBBBGG",
            "MYYBBBGYBG",
            "MBBBYMGYGB",
        ],
    },
    {
        year: 2021,
        gameId: "401220403",
        assignments: [
            "YGBYGMBMYG",
            "YMBGMYBMBM",
            "BGYGGBBBYY",
            "YYYGBMGYYM",
            "YYBBGYYGBB",
            "MBYGYGYMGG",
            "GMGGBMBGMM",
            "MYBBBBMYYY",
            "MBBGGYMMMM",
            "MGBGMGGMMB",
        ],
    },
    {
        year: 2022,
        gameId: "401326638",
        assignments: [
            "MBMBGYGBGB",
            "GGGBYYBMBM",
            "MMGGYYYBBM",
            "GYBMYYYBYM",
            "YMGMYGGBMM",
            "MGYMBBMBGG",
            "BBYGGMBYGB",
            "MYMYGYBYGM",
            "MYBGYMGMGB",
            "YBBYGYMGMB",
        ],
    },
    {
        year: 2023,
        gameId: "401438030",
        assignments: [
            "BBMGGYBGBY",
            "BMMBMYBGBB",
            "MYGBBMMYYY",
            "BGYYBGYYMY",
            "GBGMMGGMMG",
            "BYBYGYGYMG",
            "MMYMBYMYMM",
            "GYBGBBBGGG",
            "GBGYYGGMBM",
            "MMYGBMMYYB",
        ],
    },
    {
        year: 2024,
        gameId: "401547378",
        assignments: [
            "YGMMGBBBYY",
            "YGYMBYBBMY",
            "MGBYGGYGGY",
            "BMGYGYBGMY",
            "BBBYGYGMBB",
            "YYYMGMBGGB",
            "MMBMBYYGMB",
            "MGYMMBMMGY",
            "MBMGBGBGMM",
            "YYYBBMGGGM",
        ],
    },
    {
        year: 2025,
        gameId: "401671889",
        assignments: [
            "BMGYMYBGMY",
            "GBYMGBYMGB",
            "MYGBMYGBMY",
            "BGMYBGMYBG",
            "YMBGYMBGYM",
            "GBYMGBYMGB",
            "MYBGMYBGMY",
            "GBYMGBYMGB",
            "YMBGYMBGYM",
            "BGYMBGYMBG",
        ],
    },
    {
        year: 2026,
        gameId: "401772988",
        assignments: [
            "YMBYBYGBBB",
            "YGGYMMMMBB",
            "GYBYMMBYYG",
            "YYGGBMGBBG",
            "MBYGYGYMGM",
            "MMYBGYYBBG",
            "BYGYMMGGMY",
            "MYGMBBGMBM",
            "BGYYYGMMBB",
            "BGGGMGMMYB",
        ],
    },
] satisfies HistoricalBoard[]

const ownerEmail = "bradgarropy@gmail.com"

const getHistoricalPlayerName = (initial: HistoricalPlayerInitial) => {
    return historicalPlayers[initial]
}

const getBoardId = (year: number) => `historical-${year}`

const getPlayerId = (year: number, initial: HistoricalPlayerInitial) => {
    return `historical-${year}-${initial.toLowerCase()}`
}

const createImportQueries = (
    db: Database,
    ownerId: User["id"],
): [Query, ...Query[]] => {
    const initials = Object.keys(historicalPlayers) as HistoricalPlayerInitial[]

    const queries = historicalBoards.flatMap(historicalBoard => {
        const boardId = getBoardId(historicalBoard.year)
        const players = initials.map(initial => ({
            id: getPlayerId(historicalBoard.year, initial),
            boardId,
            userId: initial === "B" ? ownerId : null,
            name: getHistoricalPlayerName(initial),
        })) satisfies NewPlayer[]
        const playerIds = Object.fromEntries(
            initials.map(initial => [
                initial,
                getPlayerId(historicalBoard.year, initial),
            ]),
        ) as Record<HistoricalPlayerInitial, string>
        const squares = historicalBoard.assignments.flatMap(
            (assignments, row) =>
                [...assignments].map((initial, column) => ({
                    boardId,
                    playerId: playerIds[initial as HistoricalPlayerInitial],
                    row,
                    column,
                })),
        ) satisfies NewSquare[]

        return [
            db
                .insert(board)
                .values({id: boardId, gameId: historicalBoard.gameId, ownerId})
                .onConflictDoUpdate({
                    target: board.id,
                    set: {
                        gameId: historicalBoard.gameId,
                        ownerId,
                        updatedAt: sql`(current_timestamp)`,
                    },
                }),
            db
                .insert(player)
                .values(players)
                .onConflictDoUpdate({
                    target: player.id,
                    set: {
                        boardId: sql`excluded.board_id`,
                        name: sql`excluded.name`,
                        userId: sql`coalesce(${player.userId}, excluded.user_id)`,
                        updatedAt: sql`(current_timestamp)`,
                    },
                }),
            ...Array.from({length: 4}, (_, index) =>
                db
                    .insert(square)
                    .values(squares.slice(index * 25, (index + 1) * 25))
                    .onConflictDoUpdate({
                        target: [square.boardId, square.row, square.column],
                        set: {playerId: sql`excluded.player_id`},
                    }),
            ),
        ]
    })

    const [firstQuery, ...remainingQueries] = queries
    return [firstQuery, ...remainingQueries]
}

const importHistoricalBoards = (db: Database, ownerId: User["id"]) => {
    return db.batch(createImportQueries(db, ownerId))
}

const getEnvironment = (): Environment => {
    const {values} = parseArgs({
        options: {
            environment: {type: "string"},
        },
    })
    const environment = values.environment

    if (
        environment !== "local" &&
        environment !== "production" &&
        environment !== "staging"
    ) {
        throw new Error("Environment must be local, production, or staging")
    }

    return environment
}

const createRemoteConfig = async (environment: RemoteEnvironment) => {
    const wranglerEnvironment =
        environment === "staging" ? "staging" : undefined
    const config = unstable_readConfig({
        config: "./wrangler.jsonc",
        env: wranglerEnvironment,
    })
    const databases = config.d1_databases as D1DatabaseConfig[]
    const directory = await mkdtemp(path.join(tmpdir(), "squares-history-"))
    const configPath = path.join(directory, "wrangler.json")

    await writeFile(
        configPath,
        JSON.stringify({
            name: `${config.name}-history-import`,
            main: path.resolve("workers/app.ts"),
            compatibility_date: config.compatibility_date,
            d1_databases: databases.map(database => ({
                binding: database.binding,
                database_id: database.database_id,
                database_name: database.database_name,
                remote: true,
            })),
        }),
    )

    return {configPath, directory}
}

const main = async () => {
    const environment = getEnvironment()
    const remoteConfig =
        environment === "local" ? null : await createRemoteConfig(environment)
    const platform = await getPlatformProxy<Pick<Env, "DB">>(
        remoteConfig
            ? {configPath: remoteConfig.configPath, remoteBindings: true}
            : {remoteBindings: false},
    )

    try {
        const db = createDb(platform.env.DB)
        const owner = await db.query.user.findFirst({
            columns: {email: true, id: true, name: true},
            where: eq(user.email, ownerEmail),
        })

        if (!owner) {
            throw new Error(
                `No user with email ${ownerEmail} exists in ${environment}`,
            )
        }

        await importHistoricalBoards(db, owner.id)

        console.log(
            `Imported historical boards into ${environment} for ${owner.name} (${owner.email})`,
        )
    } finally {
        await platform.dispose()

        if (remoteConfig) {
            await rm(remoteConfig.directory, {recursive: true})
        }
    }
}

await main()
