import {useFetcher} from "react-router"

import ShareButton from "~/components/ShareButton"
import type {Player} from "~/db/schema"

type InviteButtonProps = {
    action: string
    isInvited: boolean
    player: Pick<Player, "id" | "name">
    title: string
}

type InviteResponse = {error: string} | {inviteUrl: string} | {revoked: true}

const InviteButton = ({
    action,
    isInvited,
    player,
    title,
}: InviteButtonProps) => {
    const fetcher = useFetcher<InviteResponse>()

    const intent = fetcher.formData?.get("intent")
    const isInviting = fetcher.state !== "idle" && intent === "invite"
    const isRevoking = fetcher.state !== "idle" && intent === "revoke-invite"
    const inviteUrl =
        fetcher.data && "inviteUrl" in fetcher.data
            ? fetcher.data.inviteUrl
            : null
    const error =
        fetcher.data && "error" in fetcher.data ? fetcher.data.error : null

    const inviteButton = isInvited ? (
        <button
            type="button"
            disabled
            className="rounded bg-white/20 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
            Invited
        </button>
    ) : (
        <fetcher.Form method="post" action={action}>
            <input type="hidden" name="intent" value="invite" />
            <input type="hidden" name="playerId" value={player.id} />
            <button
                type="submit"
                disabled={isInviting}
                className="rounded bg-white/20 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isInviting ? "Generating…" : "Invite"}
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

            {isInvited ? (
                <fetcher.Form method="post" action={action}>
                    <input type="hidden" name="intent" value="revoke-invite" />
                    <input type="hidden" name="playerId" value={player.id} />
                    <button
                        type="submit"
                        disabled={isRevoking}
                        className="rounded bg-white/20 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isRevoking ? "Revoking…" : "Revoke"}
                    </button>
                </fetcher.Form>
            ) : null}

            {error ? (
                <span role="alert" className="text-sm text-gray-300">
                    {error}
                </span>
            ) : null}
        </div>
    )
}

export default InviteButton
