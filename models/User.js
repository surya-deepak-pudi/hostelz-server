const mongoose = require("mongoose")
const Schema = mongoose.Schema

const UserSchema = new Schema({
  name: String,
  mail: String,
  password: String,
  avatar: String,
  verifyString:String,
  isVerified:Boolean,
  date: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model("User", UserSchema)
