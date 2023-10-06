/**
 *
 * @param {String} urlString url to test
 * @returns {boolean} if url with Http protocol or not
 */

export default function isUrl(urlString: string): boolean {
    try {
        const testURL = new URL(urlString)
        return testURL.protocol === `http:` || testURL.protocol === `https:`
    } catch (e) {
        return false
    }
}
