const getRedirectTo = (value: FormDataEntryValue | null) => {
    if (
        typeof value === "string" &&
        value.startsWith("/") &&
        !value.startsWith("//")
    ) {
        return value
    }

    return "/boards"
}

export {getRedirectTo}
