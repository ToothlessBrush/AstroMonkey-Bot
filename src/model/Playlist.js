const { Schema, model } = require("mongoose")

const playlistSchema = new Schema({
    name: String,
    creater: {
        name: String,
        ID: String,
    },
    length: Number,
    duration: Number,
    dateCreated: { type: Date, default: Date.now },
    tracks: [Schema.Types.Mixed],
})



module.exports = playlistSchema
