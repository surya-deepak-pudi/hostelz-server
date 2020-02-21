const express = require("express")
const router = express.Router()
const User = require("../../models/User")
const gravatar = require("gravatar")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const keys = require("../../config/keys")
const passport = require("passport")
const nodemailer = require("nodemailer")

let smtpTransport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "maintainhost99@gmail.com",
    pass: "deepakRoja"
  }
})

router.post("/register", (req, res) => {
  //finding a user to check if exists
  User.findOne({ mail: req.body.mail }).then(user => {
    if (user) {
      return res.status(400).json({ msg: "mail already exists" })
    } else {
      //No user
      //creating the avatar
      const avatar = gravatar.url(req.body.mail, { s: "200", r: "pg", d: "mm" })
      //creating the user
      User.create({ ...req.body, avatar, isVerified: false }).then(user => {
        if (user) {
          //creating a hashhed password
          bcrypt.genSalt(11, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
              if (err) {
                return res
                  .status(400)
                  .json({ msg: "problem hashing the password" })
              }
              user.password = hash
              user
                .save()
                .then(protectedUser => {
                  //sending verification mail
                  let rand = Math.floor(Math.random() * 100000000 + 1234571)
                  protectedUser.verifyString = rand
                  protectedUser.save().then(createdUser => {
                    if (createdUser) {
                      console.log(req.get("host"))
                      link = `http://localhost:3000/verify/${rand}/${createdUser._id}`
                      let mailOptions = {
                        to: protectedUser.mail,
                        subject: "Please verify your mail",
                        html:
                          "Hello.<br/>Please click on the link to verify your email.<br/><a href=" +
                          link +
                          ">Click here to verify</a>"
                      }
                      smtpTransport
                        .sendMail(mailOptions)
                        .then(response => {
                          if (response) {
                            console.log(response)
                            const payload = {
                              id: protectedUser._id,
                              name: protectedUser.name,
                              avatar: protectedUser.avatar,
                              isVerified: protectedUser.isVerified
                            }
                            jwt.sign(
                              payload,
                              keys.secret,
                              { expiresIn: 3600 },
                              (err, token) => {
                                if (err) {
                                  return res
                                    .status(400)
                                    .json({ msg: "error creating token" })
                                }
                                return res.json({
                                  success: true,
                                  token: "Bearer " + token
                                })
                              }
                            )
                          }
                        })
                        .catch(err => {
                          console.log(err)
                          return res
                            .status(400)
                            .json({ server: "error in sending mail" })
                        })
                    }
                  })
                })
                .catch(error => {
                  console.log(error)
                  return res
                    .status(400)
                    .json({ msg: "error in saving hashed password" })
                })
            })
          })
        }
      })
    }
  })
})

router.post("/login", (req, res) => {
  User.findOne({ mail: req.body.mail }).then(user => {
    if (!user) {
      return res.status(400).json({ msg: "Mail doesn't exist!" })
    } else {
      bcrypt.compare(req.body.password, user.password).then(isMatched => {
        if (isMatched) {
          const payload = {
            id: user._id,
            name: user.name,
            avatar: user.avatar,
            isVerified: user.isVerified
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
    .then(user => {
      if (user) {
        if (user.verifyString === req.body.rand) {
          user.isVerified = true
          user
            .save()
            .then(userFinalised => {
              return res.status(200).json({ verified: true })
            })
            .catch(err => {
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
    .catch(err => {
      if (err) {
        return res.status(400).json({ server: "error finding the user" })
      }
    })
})

module.exports = router
