//tests a string to see if its a url

function isUrl(urlString) {
    try {
        new URL(urlString)
        return true
    } catch (e) {
        return false
    }
}

module.exports = { isUrl }
