const { Schema } = require("mongoose")

const serverSchema = new Schema({
    server: {
        name: String,
        ID: String
    },
    djrole: String,
    playlist: [{
        name: String,
        creater: {
            name: String,
            ID: String,
        },
        dateCreated: date.now,
        tracks: [{
            //track object
        }]
    }],
})
