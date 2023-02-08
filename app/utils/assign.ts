import arrayShuffle from "array-shuffle"

type Participants = Record<string, Participant>

type Participant = {
    name: string
    initials: string
    entries: number
}

const getInitials = (name: string): string => {
    const pieces = name.split(" ")

    const initials = pieces
        .map(piece => {
            return piece[0].toUpperCase()
        })
        .join("")

    return initials
}

const assignSquares = (names: string[]): string[] => {
    const squaresPerName = Math.floor(100 / names.length)
    const remainingSquares = 100 % names.length
    const remainingNames = arrayShuffle(names).slice(0, remainingSquares)

    const participants = names.reduce<Participants>((participant, name) => {
        participant[name] = {
            name,
            initials: getInitials(name),
            entries: squaresPerName,
        }

        if (remainingNames.includes(name)) {
            participant[name].entries += 1
        }

        return participant
    }, {})

    console.log(participants)

    const squares = names.flatMap(name => {
        return new Array(participants[name].entries).fill(
            participants[name].initials,
        )
    })

    console.log(squares)

    return arrayShuffle(squares)
}

export {assignSquares}
