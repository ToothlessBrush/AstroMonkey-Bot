//filters out songs that have been blacklisted

//array of blacklisted songs
blackListedSong = []

function blackList(tracks, interaction) {
    let removed = []
    for (let i = 0; i < tracks.length; i++) {
        if (blackListedSong.includes(tracks[i].url)) {
            removed.push(tracks[i])
            tracks.splice(i, 1)
            i-- //array shifts one left when element removed
        }
    }
    if (removed.length > 0) {
        console.log(`removed: ${removed} via blakcList`)
        interaction.editReply(`the following songs have issues extracting and were removed: ${removed}`)
    }
}

module.exports = {blackList}