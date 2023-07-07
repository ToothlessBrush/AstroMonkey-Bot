const { Schema, model } = require("mongoose")
const Track = require("Track")

const playlistSchema = new Schema({
    name: String,
    creater: {
        name: String,
        ID: String
    },
    length: Number,
    dateCreated: {type: Date, default: Date.now},
    tracks: [Track]
})

const Playlist = model("Playlist", playlistSchema)

module.exports = Playlist