import { Schema, model } from "mongoose"
import { playlistSchema, IPlaylist } from "./Playlist"
import { TrackJSON } from "discord-player"

interface IUser extends Document {
    name: string
    ID: string
    likes: TrackJSON[]
    playlists: IPlaylist[]
}

const userSchema = new Schema<IUser>({
    name: String,
    ID: String,
    likes: [Schema.Types.Mixed],
    playlists: [playlistSchema],
})

const User = model<IUser>("User", userSchema)

export { User, IUser }
