const { Schema, model } = require("mongoose")
const playlistSchema = require("./Playlist")

const serverSchema = new Schema({
    server: {
        name: String,
        ID: String,
    },
    djrole: String,
    playlists: [playlistSchema],
})

const Server = model("Server", serverSchema)

module.exports = Server

/*
"servers": [
        {
            "server": {"name": "astromonkey test server", "ID": "892850656002600960"},
            "djrole": "DJrole",
            "playlists": [
                {
                    "name": "test playlist",
                    "creater": {"name": "toothlessbrush", "ID": "447853266240536586"},
                    "timesPlayed": 0,
                    "length": 0,
                    "tracks": [  
                        "track": {"trackobject": "trackobject"},
                        "track": {"trackobject": "trackobject"}
                    ]
                }
            ]
        },
*/
