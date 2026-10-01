import {expect, test} from "vitest"

import {formatDate, formatDateTime, formatTime} from "~/utils/date"

const date = new Date(2026, 7, 28, 20)

test("formats a date", () => {
    expect(formatDate(date)).toBe("August 28, 2026")
})

test("formats a time", () => {
    expect(formatTime(date)).toBe("8:00PM")
})

test("formats a date and time", () => {
    expect(formatDateTime(date)).toBe("August 28, 2026 @ 8:00PM")
})
