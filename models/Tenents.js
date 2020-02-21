const mongoose = require("mongoose")
const Schema = mongoose.Schema

const TenentSchema = new Schema({
  name: String,
  mail: String,
  number: Number,
  advance: Number,
  adhar: String,
  date: Date,
  nonVeg: Boolean,
  occupation: String,
  Branch: String,
  BranchName: String,
  roomNumber: String,
  room: String,
  dues: Number,
  rent: Number,
  payDay: Number,
  payMonth: Number,
  payYear: Number,
  gaurdianName: String,
  gaurdianAddress: String,
  gaurdianNumber: Number,
  image: String,
  paid: Boolean,
  dues: { type: Number, default: 0 },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
})

module.exports = mongoose.model("Tenent", TenentSchema)
