let clientLink

if (process.env.NODE_ENV === "production") {
  clientLink = "https://surya-deepak-pudi.github.io/hostelz-client"
} else {
  clientLink = "http://localhost:3000"
}

module.exports = clientLink
