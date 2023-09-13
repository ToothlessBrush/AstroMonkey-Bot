//the purpose of this script is to update the info of track data in the database from track objects to trackJSON data

const path = require(`path`)

const mongoose = require("mongoose")
const Server = require(`./../src/model/Server`)
const User = require("./../src/model/User")

const ENVIORNMENT = "prod"

require("dotenv").config({
    path: path.join(__dirname, `..`, `.env.${ENVIORNMENT}`),
})

/**
 *
 * @param {Object} track object to translate
 * @param {boolean} hidePlaylist whether to store playlist or not
 * @returns trackJSON
 */
function translateTrackDataToJSON(data, hidePlaylist) {
    return {
        id: data.id || null,
        title: data.title || null,
        description: data.description || null,
        author: data.author || null,
        url: data.url || null,
        thumbnail: data.thumbnail || null,
        duration: data.duration || null,
        durationMS: data.raw?.duration || null,
        views: data.views || null,
        requestedBy: data.requestedBy?.id || null,
        playlist: hidePlaylist
            ? null
            : data.playlist
            ? translateTrackDataToJSON(data.playlist, true)
            : null,
    }
}

async function updateTracksInPlaylists() {
    try {
        await mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })

        //update servers
        const servers = await Server.find()

        for (const server of servers) {
            for (const playlist of server.playlists) {
                for (let i = 0; i < playlist.tracks.length; i++) {
                    const track = playlist.tracks[i]

                    const updatedTrackJSON = translateTrackDataToJSON(
                        track,
                        true
                    )

                    playlist.tracks[i] = updatedTrackJSON
                }
            }
            await server.save()
        }

        console.log("updated server track data")

        //update users
        const users = await User.find()

        for (const user of users) {
            for (const playlist of user.playlists) {
                for (let i = 0; i < playlist.tracks.length; i++) {
                    const track = playlist.tracks[i]

                    const updatedTrackJSON = translateTrackDataToJSON(
                        track,
                        true
                    )

                    playlist.tracks[i] = updatedTrackJSON
                }
            }

            for (let i = 0; i < user.likes.length; i++) {
                const track = user.likes[i]

                const updatedTrackJSON = translateTrackDataToJSON(
                    track,
                    true
                )

                user.likes[i] = updatedTrackJSON
            }
            
            await user.save()
        }

        await mongoose.connection.close()

        console.log("updated user track data")
    } catch (error) {
        console.error("error updated tracks", error)
    }
}

updateTracksInPlaylists()
