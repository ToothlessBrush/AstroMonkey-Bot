const { Schema, model } = require("mongoose")

const playlistSchema = new Schema({
    name: String,
    creater: {
        name: String,
        ID: String,
    },
    length: Number,
    dateCreated: { type: Date, default: Date.now },
    tracks: [Schema.Types.Mixed],
})

const Playlist = model("Playlist", playlistSchema)

module.exports = Playlist
