const mongoose = require("mongoose")
const Schema = mongoose.Schema

const BranchSchema = new Schema({
  name: String,
  careTaker: String,
  number: Number,
  floors: Number,
  address: String,
  image: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  rooms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room"
    }
  ]
})

module.exports = mongoose.model("Branch", BranchSchema)
