const express = require("express")
const router = express.Router()
const Tenent = require("../../models/Tenents")
const Room = require("../../models/Rooms")
const passport = require("passport")
const schedule = require("node-schedule")
const tenantMiddleware = require("../../middlewares/tenents")

var paymentRule = new schedule.RecurrenceRule()
paymentRule.hour = 1
paymentRule.minute = 43

const monthAddition = (payDay, payMonth, payYear) => {
  if (payMonth === 11) {
    payMonth = 1
    payYear++
  } else if (payMonth === 1 && payDay === 29) {
    payDay = 28
    payMonth++
  } else {
    payMonth++
  }
  let arr = []
  arr[0] = payDay
  arr[1] = payMonth
  arr[2] = payYear
  return arr
}

var j = schedule.scheduleJob(paymentRule, function() {
  let today = new Date()
  let payDay = 9 //today.getDate()
  let payMonth = 3 //today.getMonth() + 1
  let payYear = 2020 //today.getFullYear()
  Tenent.find({ payDay, payYear, payMonth }).then(tenants => {
    let arr = monthAddition(payDay, payMonth, payYear)
    payDay = arr[0]
    payMonth = arr[1]
    payYear = arr[2]
    const helper = i => {
      if (i < tenants.length) {
        let dues = tenants[i].dues + tenants[i].rent
        Tenent.findByIdAndUpdate(tenants[i]._id, {
          paid: false,
          dues,
          payDay,
          payMonth,
          payYear
        }).then(tenant => {
          if (tenant) {
            helper(++i)
          }
        })
      }
    }
    helper(0)
  })
})

//get all the tenents
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Tenent.find({ author: req.user._id })
      .then(tenents => {
        if (tenents) {
          res.status(200).json(tenents)
        } else {
          res.status(400).json({ msg: "No tenents available" })
        }
      })
      .catch(err => {
        res.status(400).json({ server: "Error finding tenents" })
      })
  }
)

//getting balances
router.get(
  "/balances",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Tenent.find({ paid: false, author: req.user._id }, (err, tenents) => {
      if (err) {
        return res.status(400).json({ server: "error finding tenants" })
      } else {
        return res.status(200).json(tenents)
      }
    })
  }
)

//create a new tenent
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Room.findById(req.body.roomNumber, (err, room) => {
      if (err) {
        return res.status(400).json({ server: "error finding room" })
      } else {
        if (room) {
          let date = new Date()
          let arr = monthAddition(
            date.getDate(),
            date.getMonth(),
            date.getFullYear()
          )
          let payDay = arr[0]
          let payMonth = arr[1]
          let payYear = arr[2]
          Tenent.create(
            {
              rent: room.fee,
              room: room.number,
              ...req.body,
              author: req.user._id,
              paid: true,
              payDay,
              payMonth,
              payYear
            },
            (error, tenent) => {
              if (error) {
                return res
                  .status(400)
                  .json({ server: "Error creating tenents" })
              } else {
                room.tenents.push(tenent)
                room.vacancies--
                tenent.payDay = tenent.date.getDate()
                tenent.save()
                room.save()
                console.log("Created tenant")
                return res.status(200).json(tenent)
              }
            }
          )
        } else {
          return res.status(400).json({ server: "room doesn't exist" })
        }
      }
    })
  }
)

//show
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  tenantMiddleware.isAuthor,
  (req, res) => {
    Tenent.findOne({ _id: req.params.id }, (err, tenent) => {
      if (err) {
        return res.status(400).json({ server: "Error in finding tenent" })
      } else {
        console.log("showed a tenant")
        if (tenent) {
          return res.status(200).json(tenent)
        } else {
          return res.status(400).json({ msg: "Tenent doesnt exist" })
        }
      }
    })
  }
)

//edit
router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  tenantMiddleware.isAuthor,
  (req, res) => {
    Tenent.findById(req.params.id)
      .then(tenent => {
        //if changing rooms
        if (
          req.body.roomNumber &&
          (tenent.roomNumber !== req.body.roomNumber ||
            tenent.Branch !== req.body.Branch)
        ) {
          Room.findById(tenent.roomNumber).then(room => {
            if (room) {
              console.log(room)
              room.vacancies++
              room.tenents.splice(room.tenents.indexOf(req.params.id), 1)
              room
                .save()
                .then(
                  Room.findById(req.body.roomNumber)
                    .then(newRoom => {
                      if (newRoom) {
                        newRoom.tenents.push(req.params.id)
                        newRoom.vacancies--
                        newRoom
                          .save()
                          .then(
                            Tenent.findByIdAndUpdate(req.params.id, req.body)
                              .then(updatedTenent => {
                                return res.status(200).json(updatedTenent)
                              })
                              .catch(err => {
                                console.log(err)
                                return res.status(400).json({ msg: "error" })
                              })
                          )
                          .catch(err => {
                            console.log(err)
                            return res.status(400).json({ msg: "error" })
                          })
                      }
                    })
                    .catch(err => {
                      console.log(err)
                      return res.status(400).json({ msg: "error" })
                    })
                )
                .catch(err => {
                  console.log(err)
                  return res.status(400).json({ msg: "error" })
                })
            }
          })
        }
        //changing personal data
        else {
          Tenent.findByIdAndUpdate(
            req.params.id,
            { ...req.body, author: req.user._id },
            (err, editedTenent) => {
              if (err || !editedTenent) {
                return res
                  .status(400)
                  .json({ server: "error in updating the tenent" })
              } else {
                return res.status(200).json(editedTenent)
              }
            }
          )
        }
      })
      .catch(err => {
        return res.status(400)
      })
  }
)
router.put(
  "/:id/pay",
  passport.authenticate("jwt", { session: false }),
  tenantMiddleware.isAuthor,
  (req, res) => {
    Tenent.findByIdAndUpdate(req.params.id, { paid: true, dues: 0 })
      .then(tenent => {
        if (tenent) {
          return res.status(200).json(tenent)
        } else {
          return res
            .status(400)
            .json({ data: "error in updatinging the tenant" })
        }
      })
      .catch(err => {
        console.log(err)
        return res.status(400).json({ server: "error in finding the tenant" })
      })
  }
)

//delete
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  tenantMiddleware.isAuthor,
  (req, res) => {
    Tenent.findById(req.params.id)
      .then(tenent => {
        Room.findById(tenent.roomNumber, (err, room) => {
          if (err) {
            return res.status(400).json({ server: "Error finding the room" })
          }
          Tenent.findByIdAndDelete(req.params.id, (error, deleteUser) => {
            if (error) {
              return res.status(400).json({ server: "Error deleting tenet" })
            }
            room.tenents.splice(room.tenents.indexOf(req.params.id), 1)
            room.vacancies++
            room.save()
            console.log("deleted tenent")
            return res.status(200).json(deleteUser)
          })
        })
      })
      .catch(err => {
        return res.status(400).json({ server: "error finding tenent" })
      })
  }
)

module.exports = router
