/**
 *
 * @param {String} urlString url to test
 * @returns {boolean} if url or not
 */

function isUrl(urlString) {
    try {
        new URL(urlString)
        return true
    } catch (e) {
        return false
    }
}

module.exports = { isUrl }
