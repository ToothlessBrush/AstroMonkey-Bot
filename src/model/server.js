const { Playlist } = require("discord-player")
const { schema, model } = require("mongoose")

const serverSchema = new Schema({
    server: Object,
    djrole: String,
    playlist: Array,
})