import {data, Form, Link, redirect, useNavigation} from "react-router"

import Scoreboard from "~/components/Scoreboard"
import {dbCtx} from "~/db/client.server"
import {getUser, requireUser} from "~/utils/auth.server"
import {getGame} from "~/utils/games"
import {claimPlayer, getInvitedPlayer} from "~/utils/invites.server"

import type {Route} from "./+types/invites.$token"

export const loader = async ({context, params, request}: Route.LoaderArgs) => {
    const db = context.get(dbCtx)

    const [invitedPlayer, user] = await Promise.all([
        getInvitedPlayer(db, params.token),
        getUser(request),
    ])

    if (!invitedPlayer) {
        throw data("Invitation not found", {status: 404})
    }

    const game = await getGame(invitedPlayer.board.gameId)

    return {
        boardPath: `/boards/${invitedPlayer.boardId}`,
        game,
        inviterName: invitedPlayer.board.owner?.name ?? "Someone",
        isSignedIn: Boolean(user),
        playerName: invitedPlayer.name,
    }
}

export const meta: Route.MetaFunction = () => {
    return [{title: "🏈 squares | invitation"}]
}

export const action = async ({context, params, request}: Route.ActionArgs) => {
    const user = await requireUser(request)
    const db = context.get(dbCtx)
    const {status, boardId} = await claimPlayer(db, params.token, user.id)

    if (status === "invalid") {
        throw data("Invitation not found", {status: 404})
    }

    if (status === "already-claimed") {
        return data(
            {error: "You have already claimed a player on this board."},
            {status: 409},
        )
    }

    return redirect(`/boards/${boardId}`)
}

const Invite = ({actionData, loaderData, params}: Route.ComponentProps) => {
    const {game, inviterName, isSignedIn, playerName} = loaderData

    const navigation = useNavigation()

    const invitePath = `/invites/${params.token}`
    const redirectTo = encodeURIComponent(invitePath)
    const isClaiming = navigation.state === "submitting"

    return (
        <main className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
            <header className="space-y-3">
                <p className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
                    You&apos;ve been invited
                </p>

                <h1 className="text-3xl font-bold">
                    {inviterName} invited you to play as {playerName}
                </h1>

                {!isSignedIn ? (
                    <p className="text-gray-300">
                        Create an account or sign in to connect these squares to
                        you.
                    </p>
                ) : null}
            </header>

            <section
                aria-label="Game"
                className="flex flex-col items-center gap-4"
            >
                <Scoreboard game={game} />
            </section>

            {!isSignedIn ? (
                <div className="flex flex-wrap justify-center gap-3">
                    <Link
                        to={`/signup?redirectTo=${redirectTo}`}
                        className="rounded bg-white px-4 py-2 font-semibold text-green-800"
                    >
                        Create account
                    </Link>

                    <Link
                        to={`/login?redirectTo=${redirectTo}`}
                        className="rounded bg-white/20 px-4 py-2 font-semibold"
                    >
                        Sign in
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-gray-300">
                        Claim {playerName} to connect these squares to your
                        account.
                    </p>

                    <Form method="post">
                        <button
                            type="submit"
                            disabled={isClaiming}
                            className="rounded bg-white px-4 py-2 font-semibold text-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isClaiming ? "Claiming…" : `Claim ${playerName}`}
                        </button>
                    </Form>

                    {actionData?.error ? (
                        <p role="alert" className="text-red-300">
                            {actionData.error}
                        </p>
                    ) : null}
                </div>
            )}
        </main>
    )
}

export default Invite
