const keys = require("./keys.js")
const nodemailer = require("nodemailer")

let smtpTransport = nodemailer.createTransport({
  host: "smtp.gamil.com",
  port: 587,
  service: "gmail",
  auth: {
    user: keys.email,
    pass: keys.password
  },
  logger: true
})

module.exports = smtpTransport
