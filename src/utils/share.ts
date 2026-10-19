type ShareOptions = {
    text: string
    title: string
    url: string
}

type ShareResult = "shared" | "cancelled" | "copied" | "error"

const shareUrl = async ({
    text,
    title,
    url,
}: ShareOptions): Promise<ShareResult> => {
    const absoluteUrl = new URL(url, window.location.origin).toString()

    if (navigator.share) {
        try {
            await navigator.share({title, text, url: absoluteUrl})
            return "shared"
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                return "cancelled"
            }
        }
    }

    try {
        await navigator.clipboard.writeText(absoluteUrl)
        return "copied"
    } catch {
        return "error"
    }
}

export {shareUrl}
export type {ShareOptions, ShareResult}
