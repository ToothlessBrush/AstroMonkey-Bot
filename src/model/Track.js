const { Schema, model } = require("mongoose")

const userNameSchema = new Schema({
    name: String,
    ID: String,
})

const trackSchema = new Schema({
    name: String,
    url: String,
    duration: Number,
    dateAdded: {
        type: Date,
        default: Date.now,
    },
    addedBy: {
      name: String,
      ID: String
    },
})

const Track = model("Track", trackSchema)
module.exports = Track
