import { Schema, model, Document } from "mongoose"
import { playlistSchema, IPlaylist } from "./Playlist"
import { TrackJSON } from "discord-player"
import cron from "node-cron"

interface IUser extends Document {
    name: string
    ID: string
    likes: TrackJSON[]
    playlists: IPlaylist[]
    timestamps: {
        createdAt: Date
        updatedAt: Date
    }
}

const userSchema = new Schema<IUser>(
    {
        name: String,
        ID: String,
        likes: [Schema.Types.Mixed],
        playlists: [playlistSchema],
    },
    {
        timestamps: {
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
    }
)

userSchema.pre(`save`, function () {
    console.log(`Saved User Document`)
})

//updated updatedAt whenever .findOne is called //queries are strict
// userSchema.pre("findOne", function (next) {
//     // Attach a post-find hook to the query to update 'updatedAt'
//     console.log(`finding one document on mongodb`)
//     this.set({}, { $set: { updatedAt: new Date() } }).then(() => next())
// })

const User = model<IUser>("User", userSchema)

console.log(`registered cleanup event for inactive users`)
cron.schedule("0 0 * * *", async () => {
    console.log(`checking for inactive users`)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    try {
        const deletedUser = await User.deleteMany({
            updatedAt: { $lt: thirtyDaysAgo },
        })
        console.log(`Deleted ${deletedUser.deletedCount} inactive users.`)
    } catch (error) {
        console.error("Error deleting inactive users:", error)
    }
})

export { User, IUser }
