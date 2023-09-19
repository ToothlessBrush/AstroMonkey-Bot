/**
 *
 * @param {String} urlString url to test
 * @returns {boolean} if url with Http protocol or not
 */

function isUrl(urlString) {
    try {
        const testURL = new URL(urlString)
        return testURL.protocol === `http:` || testURL.protocol === `https:`
    } catch (e) {
        return false
    }
}

module.exports = { isUrl }
