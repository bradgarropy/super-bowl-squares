const getBoard = (id: number) => {
    console.log(`Getting board with id ${id}`)

    return {
        id,
        name: `Board ${id}`,
        userId: 1,
    }
}
const getBoards = (userId: number) => {
    console.log(`Getting all boards for user ${userId}`)

    return [
        {
            id: 1,
            name: "Board 1",
            userId: 1,
        },
        {
            id: 2,
            name: "Board 2",
            userId: 1,
        },
        {
            id: 3,
            name: "Board 3",
            userId: 1,
        },
        {
            id: 4,
            name: "Board 4",
            userId: 1,
        },
        {
            id: 5,
            name: "Board 5",
            userId: 1,
        },
    ]
}

const createBoard = async (userId: number) => {
    return {
        id: 6,
        name: "Board 6",
        userId,
    }
}

export {createBoard, getBoard, getBoards}
