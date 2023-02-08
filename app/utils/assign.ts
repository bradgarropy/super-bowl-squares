import arrayShuffle from "array-shuffle"

type Entries = Record<string, number>
type Square = string
type Name = string

const assignSquares = (names: Name[]): Square[] => {
    const squaresPerName = Math.floor(100 / names.length)
    const remainingSquares = 100 % names.length
    const remainingNames = arrayShuffle(names).slice(0, remainingSquares)

    const entries = names.reduce<Entries>((entries, name) => {
        entries[name] = squaresPerName

        if (remainingNames.includes(name)) {
            entries[name] += 1
        }

        return entries
    }, {})

    const squares = names.flatMap(name => {
        return new Array(entries[name]).fill(name)
    })

    return arrayShuffle(squares)
}

export {assignSquares}
