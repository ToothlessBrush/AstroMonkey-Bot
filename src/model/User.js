const { Schema, model } = require("mongoose")

const userSchema = new Schema({})

module.exports = model("User", userSchema)
