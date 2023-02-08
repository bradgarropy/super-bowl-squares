/** @type {import('tailwindcss').Config} */

const config = {
    content: ["./app/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                remix: {
                    black: "#121212",
                    blue: "#3defe9",
                },
            },
            textDecorationThickness: {
                3: "3px",
            },
            gridRow: {
                "span-7": "span 7 / span 7",
                "span-8": "span 8 / span 8",
                "span-9": "span 9 / span 9",
                "span-10": "span 10 / span 10",
                "span-11": "span 11 / span 11",
                "span-12": "span 12 / span 12",
            },
            gridRowStart: {
                7: "7",
                8: "8",
                9: "9",
                10: "10",
                11: "11",
                12: "12",
            },
            gridTemplateColumns: {
                squares: "repeat(2, auto) repeat(10, 1fr)",
            },
            gridTemplateRows: {
                layout: "auto 1fr auto",
                squares: "repeat(2, auto) repeat(10, 1fr)",
                7: "repeat(7, minmax(0, 1fr))",
                8: "repeat(8, minmax(0, 1fr))",
                9: "repeat(9, minmax(0, 1fr))",
                10: "repeat(10, minmax(0, 1fr))",
                11: "repeat(11, minmax(0, 1fr))",
                12: "repeat(11, minmax(0, 1fr))",
            },
            textUnderlineOffset: {
                6: "6px",
            },
        },
    },
    plugins: [],
}

module.exports = config
