//open connection to mongodb 
//npm install mongodb
//start node application and start db.js first
//because we do not want to run our app without db connection
const mongodb = require("mongodb")
const dotenv = require("dotenv")
//loads values from .env file
dotenv.config()
//load env variable
//npm install dotenv
mongodb.connect(process.env.CONNECTIONSTRING, {useUnifiedTopology: true}, function(err, client) {
    module.exports = client
    const app = require('./app.js')
    app.listen(process.env.PORT)
})
