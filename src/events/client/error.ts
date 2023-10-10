module.exports = {
    name: "error",
    execute(error: Error) {
        console.error(error)
    },
}
