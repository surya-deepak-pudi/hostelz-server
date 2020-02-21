const Tenent = require("../models/Tenents")

let middlewareObj = {}

middlewareObj.isAuthor = (req, res, next) => {
  Tenent.findById(req.params.id)
    .then(tenent => {
      if (tenent) {
        let a = tenent.author.toString()
        let b = req.user.id.toString()
        if (a === b) {
          next()
        } else {
          return res.status(400).json({ msg: "Access Denied" })
        }
      } else {
        return res.status(400).json({ server: "tenent not available" })
      }
    })
    .catch(err => {
      return res.status(400).json({ server: "Error in finding tenent" })
    })
}

middlewareObj.isExists = (req, res, next) => {
  console.log(req)
  Tenent.findOne({ mail: req.body.mail })
    .then(user => {
      if (user && req.route.methods.get) {
        return res.status(400).json({ msg: "user already exists" })
      } else if (req.route.methods.put && user._id === req.body._id) {
        return res.status(400).json({ msg: "user already exists" })
      } else {
        next()
      }
    })
    .catch(err => {
      return res.status(400).json({ server: "Error finding tenent" })
    })
}

module.exports = middlewareObj
