const keys = require("./keys.js")
const nodemailer = require("nodemailer")

let smtpTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: keys.email,
    pass: keys.password
  }
})

module.exports = smtpTransport
