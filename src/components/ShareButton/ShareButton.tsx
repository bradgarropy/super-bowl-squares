import {useState} from "react"

import {shareUrl} from "~/utils/share"

type ShareButtonProps = {
    label?: string
    size?: "default" | "small"
    text?: string
    title: string
    url: string
}

type ShareStatus = "idle" | "sharing" | "copied" | "error"

const ShareButton = ({
    label = "Share board",
    size = "default",
    text = "Join my Squares board.",
    title,
    url,
}: ShareButtonProps) => {
    const [status, setStatus] = useState<ShareStatus>("idle")

    const share = async () => {
        setStatus("sharing")

        const result = await shareUrl({
            title,
            text,
            url,
        })

        setStatus(
            result === "shared" || result === "cancelled" ? "idle" : result,
        )
    }

    const message = {
        copied: "Link copied",
        error: "Unable to share link",
        idle: null,
        sharing: null,
    }[status]

    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                disabled={status === "sharing"}
                className={`rounded bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 ${
                    size === "small" ? "px-3 py-1" : "px-4 py-2"
                }`}
                onClick={share}
            >
                {status === "sharing" ? "Sharing…" : label}
            </button>

            {message ? (
                <span aria-live="polite" className="text-sm text-gray-300">
                    {message}
                </span>
            ) : null}
        </div>
    )
}

export default ShareButton
