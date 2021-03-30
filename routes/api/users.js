const express = require("express")
const router = express.Router()
const User = require("../../models/User")
const gravatar = require("gravatar")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const smtpTransport = require("../../config/smtp")
const loginVerification = require("../../mails/loginVerification")
const { customAlphabet } = require("nanoid")
const keys = require("../../config/keys")
const passport = require("passport")
const _ = require("lodash")
let clientLink = require("../../config/clientLink")

router.post("/register", (req, res) => {
  console.log("I'm inside register")
  User.findOne({ mail: req.body.mail, isVerified: true }).then((user) => {
    if (user) {
      return res.status(400).json({ msg: "mail already exists" })
    } else {
      let newUser = _.pick(req.body, ["mail", "fname", "lname"])
      bcrypt.genSalt(11, (err, salt) => {
        console.log()
        bcrypt.hash(req.body.password, salt, (err, hash) => {
          if (err) {
            console.log("probelm withe pwd")
            return res.status(400).json({ msg: "problem hashing the password" })
          }
          newUser.password = hash
          let rand = customAlphabet("1234567890", 6)()
          newUser.avatar = gravatar.url(req.body.mail, {
            s: "200",
            r: "pg",
            d: "mm",
          })
          newUser.verifyString = rand
          newUser.isVerified = false
          User.create(newUser)
            .then((createdUser) => {
              if (createdUser) {
                // let link = `${clientLink}/verify/${rand}/${createdUser._id}`
                // let mailOptions = loginVerification(createdUser.mail, link)
                // smtpTransport.sendMail(mailOptions)
                const payload = {
                  id: createdUser._id,
                  fname: createdUser.fname,
                  lname: createdUser.lname,
                  avatar: createdUser.avatar,
                  isVerified: createdUser.isVerified,
                }
                jwt.sign(
                  payload,
                  keys.secret,
                  { expiresIn: 3600 },
                  (err, token) => {
                    if (err) {
                      console.log("probelm with token")
                      return res
                        .status(400)
                        .json({ msg: "error creating token" })
                    }
                    return res.json({
                      success: true,
                      token: "Bearer " + token,
                    })
                  }
                )
              } else {
                console.log("probelm withe creation of user")
                return res.status(400).json({ err: "no user created" })
              }
            })
            .catch((err) => {
              console.log("probelm with error")
              console.log(err)
              return res.status(400).json({ server: "error in creating user" })
            })
        })
      })
    }
  })
})

router.post("/login", (req, res) => {
  console.log("I'm called")
  User.findOne({ mail: req.body.mail }).then((user) => {
    if (!user) {
      return res.status(400).json({ msg: "Mail doesn't exist!" })
    } else {
      bcrypt.compare(req.body.password, user.password).then((isMatched) => {
        if (isMatched) {
          const payload = {
            id: user._id,
            fname: user.fname,
            lname: user.lname,
            avatar: user.avatar,
            isVerified: user.isVerified,
          }
          jwt.sign(payload, keys.secret, (err, token) => {
            if (err) {
              return res.status(400).json({ msg: "error creating token" })
            }
            res.json({ success: true, token: "Bearer " + token })
          })
          //return res.status(200).json({ msg: "success" })
        } else {
          return res.status(400).json({ msg: "Wrong password!" })
        }
      })
    }
  })
})

router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json(req.user)
  }
)

router.post("/verify", (req, res) => {
  User.findById(req.body.id)
    .then((user) => {
      if (user) {
        if (user.verifyString === req.body.rand) {
          user.isVerified = true
          user
            .save()
            .then((userFinalised) => {
              return res.status(200).json({ verified: true })
            })
            .catch((err) => {
              return res
                .status(400)
                .json({ Status: "Error in saving the user" })
            })
        } else {
          return res.status(200).json({ verified: false })
        }
      } else {
        return res.status(400).json({ server: "user not found" })
      }
    })
    .catch((err) => {
      if (err) {
        return res.status(400).json({ server: "error finding the user" })
      }
    })
})

module.exports = router
