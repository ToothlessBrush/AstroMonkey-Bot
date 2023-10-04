const { Schema, model } = require("mongoose")
const playlistSchema = require("./Playlist")

const userSchema = new Schema({
    name: String,
    ID: String,
    likes: [Schema.Types.Mixed],
    playlists: [playlistSchema],
})

const User = model("User", userSchema)

module.exports = User
