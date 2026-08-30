import {useEffect, useState} from "react"

import {cn} from "~/utils/cn"
import {formatDateTime} from "~/utils/date"

type DateTimeProps = {
    className?: string
    date: string
}

const DateTime = ({className = "", date}: DateTimeProps) => {
    const [localDate, setLocalDate] = useState<string | null>(null)

    useEffect(() => {
        setLocalDate(formatDateTime(new Date(date)))
    }, [date])

    return (
        <time
            className={cn(
                "block min-h-[1.5em]",
                localDate ? "visible" : "invisible",
                className,
            )}
            dateTime={date}
        >
            {localDate}
        </time>
    )
}

export default DateTime
