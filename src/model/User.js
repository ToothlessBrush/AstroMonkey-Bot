const { Schema, model } = require("mongoose")
const playlistSchema = require("./Playlist")

const userSchema = new Schema({
    name: String,
    ID: String,
    likes: playlistSchema,
    playlists: [playlistSchema]
})

const User = model("User", userSchema)

module.exports = User
