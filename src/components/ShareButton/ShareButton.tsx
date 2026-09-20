import {useState} from "react"

type ShareButtonProps = {
    title: string
    url: string
}

type ShareStatus = "idle" | "sharing" | "copied" | "error"

const ShareButton = ({title, url}: ShareButtonProps) => {
    const [status, setStatus] = useState<ShareStatus>("idle")

    const share = async () => {
        const absoluteUrl = new URL(url, window.location.origin).toString()

        setStatus("sharing")

        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: "Join my Squares board.",
                    url: absoluteUrl,
                })
                setStatus("idle")
                return
            } catch (error) {
                if (error instanceof Error && error.name === "AbortError") {
                    setStatus("idle")
                    return
                }
            }
        }

        try {
            await navigator.clipboard.writeText(absoluteUrl)
            setStatus("copied")
        } catch {
            setStatus("error")
        }
    }

    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                disabled={status === "sharing"}
                className="rounded bg-white/20 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={share}
            >
                {status === "sharing" ? "Sharing…" : "Share board"}
            </button>

            <span aria-live="polite" className="text-sm text-gray-300">
                {status === "copied" ? "Link copied" : null}
                {status === "error" ? "Unable to share link" : null}
            </span>
        </div>
    )
}

export default ShareButton
