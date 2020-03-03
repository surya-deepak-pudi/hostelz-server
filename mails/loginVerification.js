const keys = require("../config/keys")

let mailOptions = (mail, link) => {
  return {
    to: mail,
    from: keys.email + "@yandex.com",
    subject: "Please verify your mail",
    html:
      "Hello.<br/>Please click on the link to verify your email.<br/><a href=" +
      link +
      ">Click here to verify</a>"
  }
}

module.exports = mailOptions
