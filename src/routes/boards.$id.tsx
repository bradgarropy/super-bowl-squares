import {
    data,
    Form,
    Link,
    redirect,
    useFetcher,
    useNavigation,
} from "react-router"

import Board from "~/components/Board"
import ShareButton from "~/components/ShareButton"
import {dbCtx} from "~/db/client.server"
import {getUser, requireUser} from "~/utils/auth.server"
import {getBoard, getUserBoard} from "~/utils/boards.server"
import {getGame} from "~/utils/games"
import {invitePlayer} from "~/utils/invites.server"
import {addPlayer, removePlayer} from "~/utils/players.server"
import {shuffleBoard} from "~/utils/squares.server"

import type {Route} from "./+types/boards.$id"

export const loader = async ({context, params, request}: Route.LoaderArgs) => {
    const user = await getUser(request)
    const db = context.get(dbCtx)

    const board = await getBoard(db, params.id)

    if (!board) {
        throw data("Board not found", {status: 404})
    }

    const game = await getGame(board.gameId)
    const isOwner = user?.id === board.ownerId

    return {board, game, isOwner}
}

export const meta: Route.MetaFunction = () => {
    return [{title: "🏈 squares | board"}]
}

export const action = async ({context, params, request}: Route.ActionArgs) => {
    const user = await requireUser(request)
    const db = context.get(dbCtx)
    const board = await getUserBoard(db, params.id, user.id)

    if (!board) {
        throw data("Board not found", {status: 404})
    }

    const formData = await request.formData()
    const intent = formData.get("intent")

    if (intent === "invite") {
        const playerId = formData.get("playerId")

        if (typeof playerId !== "string" || !playerId) {
            return data({error: "Player is required."}, {status: 400})
        }

        const selectedPlayer = board.players.find(
            player => player.id === playerId,
        )

        if (!selectedPlayer) {
            return data({error: "Player not found."}, {status: 404})
        }

        if (selectedPlayer.userId) {
            return data(
                {error: "This player has already been claimed."},
                {status: 409},
            )
        }

        const token = await invitePlayer(db, board.id, selectedPlayer.id)
        const inviteUrl = new URL(
            `/boards/${board.id}/invites/${token}`,
            request.url,
        ).toString()

        console.log("Invite URL", inviteUrl)

        return {inviteUrl}
    }

    const game = await getGame(board.gameId)

    if (game.state !== "pre") {
        return data(
            {error: "Boards cannot be changed after the game has started."},
            {status: 409},
        )
    }

    if (intent === "shuffle") {
        await shuffleBoard(
            db,
            board.id,
            board.players.map(player => player.id),
        )

        return redirect(`/boards/${board.id}`)
    }

    if (intent === "add") {
        const value = formData.get("name")
        const name = typeof value === "string" ? value.trim() : ""

        if (!name) {
            return data({error: "Player name is required."}, {status: 400})
        }

        if (name.length > 100) {
            return data(
                {error: "Player name must be 100 characters or fewer."},
                {status: 400},
            )
        }

        if (board.players.length >= 100) {
            return data(
                {error: "A board cannot have more than 100 players."},
                {status: 409},
            )
        }

        await addPlayer(db, board, name)

        return redirect(`/boards/${board.id}`)
    }

    if (intent === "remove") {
        const playerId = formData.get("playerId")

        if (typeof playerId !== "string" || !playerId) {
            return data({error: "Player is required."}, {status: 400})
        }

        const selectedPlayer = board.players.find(
            player => player.id === playerId,
        )

        if (!selectedPlayer) {
            return data({error: "Player not found."}, {status: 404})
        }

        if (selectedPlayer.userId === board.ownerId) {
            return data(
                {error: "The board owner cannot be removed."},
                {status: 409},
            )
        }

        await removePlayer(db, board, playerId)

        return redirect(`/boards/${board.id}`)
    }

    return data({error: "Invalid action."}, {status: 400})
}

const BoardRoute = ({loaderData, actionData}: Route.ComponentProps) => {
    const {board, game, isOwner} = loaderData
    const inviteFetcher = useFetcher<typeof action>()
    const navigation = useNavigation()
    const isLocked = game.state !== "pre"
    const isSubmitting = navigation.state === "submitting"
    const isAdding =
        isSubmitting && navigation.formData?.get("intent") === "add"
    const isShuffling =
        isSubmitting && navigation.formData?.get("intent") === "shuffle"

    return (
        <main className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <Link to="/games" className="underline underline-offset-4">
                    Back to games
                </Link>

                {isOwner ? (
                    <ShareButton
                        title={game.name}
                        url={`/boards/${board.id}/welcome`}
                    />
                ) : null}
            </div>

            <Board key={game.id} game={game} squares={board.squares} />

            {isOwner && !isLocked ? (
                <Form method="post" className="mx-auto max-w-3xl">
                    <input type="hidden" name="intent" value="shuffle" />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded bg-white/20 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isShuffling ? "Shuffling…" : "Shuffle squares"}
                    </button>
                </Form>
            ) : null}

            <section
                aria-labelledby="players-heading"
                className="mx-auto max-w-3xl space-y-4"
            >
                <h2 id="players-heading" className="text-xl font-bold">
                    Players
                </h2>

                {isOwner ? (
                    <Form
                        key={board.players.length}
                        method="post"
                        className="space-y-2"
                    >
                        <input type="hidden" name="intent" value="add" />
                        <fieldset
                            disabled={isLocked || isSubmitting}
                            className="flex flex-wrap items-end gap-3 disabled:opacity-50"
                        >
                            <div className="grid gap-1">
                                <label htmlFor="player-name">Player name</label>

                                <input
                                    id="player-name"
                                    name="name"
                                    type="text"
                                    required
                                    maxLength={100}
                                    className="rounded bg-white px-3 py-2 text-black"
                                />
                            </div>

                            <button
                                type="submit"
                                className="rounded bg-white/20 px-4 py-2 disabled:cursor-not-allowed"
                            >
                                {isAdding ? "Adding…" : "Add player"}
                            </button>
                        </fieldset>

                        {isLocked ? (
                            <p className="text-sm text-gray-300">
                                Players are locked because the game has started.
                            </p>
                        ) : null}
                    </Form>
                ) : null}

                {isOwner && actionData && "error" in actionData ? (
                    <p role="alert">{actionData.error}</p>
                ) : null}

                {board.players.length === 0 ? (
                    <p>No players yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {board.players.map(player => (
                            <li
                                key={player.id}
                                className="flex items-center justify-between gap-3"
                            >
                                <span className="min-w-0 wrap-break-words">
                                    {player.name}
                                </span>
                                {isOwner ? (
                                    <div className="flex items-center gap-2">
                                        {!player.userId ? (
                                            <inviteFetcher.Form method="post">
                                                <input
                                                    type="hidden"
                                                    name="intent"
                                                    value="invite"
                                                />
                                                <input
                                                    type="hidden"
                                                    name="playerId"
                                                    value={player.id}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={
                                                        inviteFetcher.state !==
                                                        "idle"
                                                    }
                                                    className="rounded bg-white/20 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {inviteFetcher.state !==
                                                        "idle" &&
                                                    inviteFetcher.formData?.get(
                                                        "playerId",
                                                    ) === player.id
                                                        ? "Inviting…"
                                                        : "Invite"}
                                                </button>
                                            </inviteFetcher.Form>
                                        ) : null}

                                        {player.userId !== board.ownerId ? (
                                            <Form method="post">
                                                <input
                                                    type="hidden"
                                                    name="intent"
                                                    value="remove"
                                                />
                                                <input
                                                    type="hidden"
                                                    name="playerId"
                                                    value={player.id}
                                                />
                                                <button
                                                    type="submit"
                                                    aria-label={`Remove ${player.name}`}
                                                    disabled={
                                                        isLocked || isSubmitting
                                                    }
                                                    className="rounded bg-white/20 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isSubmitting &&
                                                    navigation.formData?.get(
                                                        "intent",
                                                    ) === "remove" &&
                                                    navigation.formData?.get(
                                                        "playerId",
                                                    ) === player.id
                                                        ? "Removing…"
                                                        : "Remove"}
                                                </button>
                                            </Form>
                                        ) : null}
                                    </div>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    )
}

export default BoardRoute
