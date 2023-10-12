import { Schema, model, Document } from "mongoose"
import { playlistSchema, IPlaylist } from "./Playlist"

interface IServer extends Document {
    server: {
        name: string
        ID: string
    }
    djrole: string
    playlists: IPlaylist[]
}

const serverSchema = new Schema<IServer>({
    server: {
        name: String,
        ID: String,
    },
    djrole: String,
    playlists: [playlistSchema],
})

const Server = model<IServer>("Server", serverSchema)

export { Server, IServer }

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
