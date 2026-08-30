const formatDate = (date: Date) => {
    const formattedDate = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    })

    return formattedDate
}

const formatTime = (date: Date) => {
    const formattedTime = date
        .toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        })
        .replace(" ", "")

    return formattedTime
}

const formatDateTime = (date: Date) => {
    const formattedDateTime = `${formatDate(date)} @ ${formatTime(date)}`
    return formattedDateTime
}

export {formatDate, formatDateTime, formatTime}
