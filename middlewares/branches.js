const Branch = require("../models/Branches")

let middlewareObj = {}
middlewareObj.isAuthor = (req, res, next) => {
  Branch.findById(req.params.id, (err, branch) => {
    if (err) {
      res.status(400).json({ server: "Error in finding the Branch" })
    } else {
      if (branch) {
        let a = branch.author.toString()
        let b = req.user.id.toString()
        if (a === b) {
          next()
        } else {
          return res.status(400).json({ msg: "Access Denied" })
        }
      } else {
        return res.status(400).json({ server: "Branch doesn't exist" })
      }
    }
  })
}

middlewareObj.nameExists = (req, res, next) => {
  Branch.findOne({ name: req.body.name })
    .then(branch => {
      if (branch) {
        return res.status(400).json({ msg: "Branch name already exists!" })
      } else {
        console.log(branch)
        next()
      }
    })
    .catch(err => {
      return res.status(400).json({ server: "error finding branch" })
    })
}

module.exports = middlewareObj
