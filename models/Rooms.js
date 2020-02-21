const mongoose = require("mongoose")
const Schema = mongoose.Schema

const RoomSchema = new Schema({
  branch: String,
  number: String,
  floor: Number,
  beds: Number,
  AC: Boolean,
  fee: Number,
  vacancies: Number,
  tenents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenents"
    }
  ]
})

module.exports = mongoose.model("Room", RoomSchema)
