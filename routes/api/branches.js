const express = require("express")
const router = express.Router()
const passport = require("passport")
const Branch = require("../../models/Branches")
const branchesMiddleware = require("../../middlewares/branches")
const _ = require("lodash")

//getting all branches
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Branch.find({ author: req.user._id })
      .then(branches => {
        if (branches) {
          //console.log(branches)
          console.log(req.query)
          if (req.query.properties) {
            let props = req.query.properties.split(",")
            console.log(props)
            for (let i = 0; i < branches.length; i++) {
              branches[i] = _.pick(branches[i], props)
            }
          }
          return res.status(200).json(branches)
        } else {
          return res.status(400).json({ msg: "No branches available" })
        }
      })
      .catch(err => {
        console.log(err)
        return res.status(400).json({ server: "error finding branches" })
      })
  }
)

//create a new branch
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  branchesMiddleware.nameExists,
  (req, res) => {
    Branch.create({ ...req.body, author: req.user }, (err, branchCreated) => {
      if (err) {
        return res.status(400).json({ server: "branch not created" })
      } else {
        return res.status(200).json(branchCreated)
      }
    })
  }
)

//show a branch
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  branchesMiddleware.isAuthor,
  (req, res) => {
    Branch.findById(req.params.id)
      .populate("rooms")
      .exec((err, branch) => {
        if (err) {
          console.log(err)
          return res.status(400).json({ server: "error finding branch" })
        } else {
          if (branch) {
            if (req.query.properties) {
              let props = req.query.properties.split(",")
              branch = _.pick(branch, props)
              // console.log(branch)
            }
            return res.status(200).json(branch)
          } else {
            return res.status(204).json({ server: "no branch available" })
          }
        }
      })
  }
)

//editing a branch
router.put(
  "/:id",
  branchesMiddleware.nameExists,
  branchesMiddleware.isAuthor,
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Branch.findById(req.params.id)
    Branch.findByIdAndUpdate(req.params.id, req.body)
      .then(branch => {
        return res.status(200).json(branch)
      })
      .catch(err => {
        return res.status(400).json({ server: "error in updating branch" })
      })
  }
)

//deleting a branch
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  branchesMiddleware.isAuthor,
  (req, res) => {
    Branch.findByIdAndDelete(req.params.id)
      .then(branch => {
        return res.status(200).json(branch)
      })
      .catch(err => {
        return res.status(400).json({ server: "error deleting branch" })
      })
  }
)

const Room = require("../../models/Rooms")

//creating a room
router.post(
  "/:id/rooms/",
  passport.authenticate("jwt", { session: false }),
  branchesMiddleware.isAuthor,
  (req, res) => {
    console.log("i crossed middleware")
    Branch.findById(req.params.id, (err, branch) => {
      if (err) {
        return res.status(400).json({ server: "Error finding branch" })
      }
      if (branch) {
        Room.create({ branch: branch.name, ...req.body }, (error, room) => {
          if (error) {
            return res.status(400).json({ server: "Room is not created" })
          } else {
            branch.rooms.push(room)
            branch.save()
            return res.status(200).json(room)
          }
        })
      } else {
        return res.status(400).json({ server: "Branch doesn't exist" })
      }
    })
  }
)

//fetching a room
router.get(
  "/:id/rooms/:roomId",
  passport.authenticate("jwt", { session: false }),
  branchesMiddleware.isAuthor,
  (req, res) => {
    Room.findById(req.params.roomId)
      .then(room => {
        if (room) {
          return res.status(200).json(room)
        } else {
          return res.status(400).json({ server: "Room doesnt exist" })
        }
      })
      .catch(err => {
        return res.status(400).json({ sever: "Error in finding the room" })
      })
  }
)

//editing a room
router.put(
  "/:id/rooms/:roomId",
  passport.authenticate("jwt", { session: false }),
  branchesMiddleware.isAuthor,
  (req, res) => {
    Room.findByIdAndUpdate(req.params.roomId, req.body)
      .then(room => {
        if (room) {
          return res.status(200).json(room)
        } else {
          return res.status(400).json({ server: "room is not edited" })
        }
      })
      .catch(err => {
        return res.status(400).json({ server: "Error in editing the room" })
      })
  }
)

//deleting a room
router.delete(
  "/:id/rooms/:roomId",
  passport.authenticate("jwt", { session: false }),
  branchesMiddleware.isAuthor,
  (req, res) => {
    Room.findByIdAndDelete(req.params.roomId, (err, room) => {
      if (err) {
        return res.status(400), json({ server: "Error in deleting the room" })
      } else {
        Branch.findById(req.params.id, (error, branch) => {
          if (error) {
            return res.status(400).json({ server: "Error finding the branch" })
          }
          if (branch) {
            branch.rooms.splice(branch.rooms.indexOf(req.params.roomId), 1)
            branch.save()
            return res.status(200).json(room)
          } else {
            return res.status(400).json({ server: "Branch Doesnt exist" })
          }
        })
      }
    })
  }
)

module.exports = router
