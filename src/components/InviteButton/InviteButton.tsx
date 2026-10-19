import {useFetcher} from "react-router"

import ShareButton from "~/components/ShareButton"
import type {Player} from "~/db/schema"

type InviteButtonProps = {
    action: string
    isInvited: boolean
    player: Pick<Player, "id" | "name">
    title: string
}

type InviteResponse = {error: string} | {inviteUrl: string}

const InviteButton = ({
    action,
    isInvited,
    player,
    title,
}: InviteButtonProps) => {
    const fetcher = useFetcher<InviteResponse>()

    const isGenerating = fetcher.state !== "idle"
    const inviteUrl =
        fetcher.data && "inviteUrl" in fetcher.data
            ? fetcher.data.inviteUrl
            : null
    const error =
        fetcher.data && "error" in fetcher.data ? fetcher.data.error : null

    const inviteButton = (
        <fetcher.Form method="post" action={action}>
            <input type="hidden" name="intent" value="invite" />
            <input type="hidden" name="playerId" value={player.id} />
            <button
                type="submit"
                disabled={isGenerating || isInvited}
                className="rounded bg-white/20 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isGenerating
                    ? "Generating…"
                    : isInvited
                      ? "Invited"
                      : "Invite"}
            </button>
        </fetcher.Form>
    )

    return (
        <div className="flex flex-wrap items-center gap-2">
            {inviteUrl ? (
                <ShareButton
                    label="Share invite"
                    size="small"
                    text={`Join my Squares board as ${player.name}.`}
                    title={title}
                    url={inviteUrl}
                />
            ) : (
                inviteButton
            )}

            {error ? (
                <span role="alert" className="text-sm text-gray-300">
                    {error}
                </span>
            ) : null}
        </div>
    )
}

export default InviteButton
