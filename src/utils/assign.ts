import type {square} from "~/db/schema"

type Square = typeof square.$inferInsert
type SquareAssignment = Omit<Square, "boardId">

const shuffle = <Value>(values: Value[]): Value[] => {
    const shuffled = [...values]

    for (let index = shuffled.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1))
        const value = shuffled[index]

        shuffled[index] = shuffled[randomIndex]
        shuffled[randomIndex] = value
    }

    return shuffled
}

const assignSquares = (playerIds: string[]): SquareAssignment[] => {
    if (playerIds.length === 0) {
        return []
    }

    if (playerIds.length > 100) {
        throw new Error("A board cannot have more than 100 players")
    }

    const shuffledPlayerIds = shuffle(playerIds)

    const assignments = Array.from(
        {length: 100},
        (_, index) => shuffledPlayerIds[index % shuffledPlayerIds.length],
    )

    const squares = shuffle(assignments).map((playerId, index) => ({
        playerId,
        row: Math.floor(index / 10),
        column: index % 10,
    }))

    return squares
}

export {assignSquares}
export type {SquareAssignment}
