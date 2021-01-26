//node is good for data intensive and real time applications
//necessary libraries
//npm install express-session
//npm install connect-mongo
//flash messaging: npm install connect-flash
//markdown html: npm install marked
//npm install csurf
//json web tokens
//npm install jsonwebtoken
const express = require("express")
const session = require("express-session")
const flash = require("connect-flash")
const markdown = require("marked")
const sanitizeHTML = require("sanitize-html")
const csrf = require('csurf')
const https = require('https')
const fs = require('fs')
//const { MongoClient } = require("mongodb")
//caps because its a blueprint for object
const MongoStore = require("connect-mongo")(session)

//the require function executes the file
//then returns whatever the file exports
//call express
const app = express();
let key = fs.readFileSync(__dirname + '/certs/selfsigned.key');
let cert = fs.readFileSync(__dirname + '/certs/selfsigned.crt');

//add user submitted data onto our request object
app.use(express.urlencoded({extended: false}))
//use javascript object notation
app.use(express.json())

app.use('/api', require('./router-api'))



//configuration for sessions
let sessionOptions = session({
    secret: "blahblah",
    store: new MongoStore({client: require("./db.js")}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000*60*60*24, httpOnly: true}
})

//now tell express to use sessions
app.use(sessionOptions)
//use flash
app.use(flash())

//run this function for every request
app.use(function(req, res, next) {

    //make markdown function available from within ejs templates
    res.locals.filterUserHTML = function(content) {
        //this makes it so you can't include Links in your post
        return sanitizeHTML(markdown(content), {allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes: {}})
    }


    //make flash messages available from all templates
    res.locals.errors = req.flash("errors")
    res.locals.success  = req.flash("success")


    //make current user id available on req objet
    if(req.session.user) {
        req.visitorID = req.session.user._id
    } else {
        req.visitorID = 0
    }
    //make user session data from view templates
    //this line lets us access from ejs templates
    res.locals.user = req.session.user
    //console.log(req.session.aUser)
    next()
})




//which is then stored in 'router' variable
const router = require('./router.js')
//using public folder for static files
app.use(express.static('public'))
//set html views(express opt, nameOfFolder)
app.set('views', 'views')
//set template engine(type, whichTemplateEngine)
//same html as .ejs files
//requires npm install ejs
app.set('view engine', 'ejs')

//any requests that modify state, needs a matching csrf token, or request will be denied
app.use(csrf())
app.use(function(req, res, next) {
    //contains token to output in html template
    res.locals.csrfToken = req.csrfToken()
    next()
})
app.use('/', router)

app.use(function(err, req, res, next) {
    if(err) {
        if(err.code == "EBADCSRFTOKEN") {
            req.flash('errors', "Cross Site Request Forgery Detected!")
            req.session.save(() => res.redirect('/'))
        } else {
            res.render('404')
        }
    }
})

//right now server is ONLY an express application
//NOW we want to power socket connections

const server = require('http').createServer(app)

//now add socket functioinality to this server

const io = require('socket.io')(server)

io.use(function(socket, next) {
    sessionOptions(socket.request, socket.request.res, next)
})

io.on('connection', function(socket) {
    if(socket.request.session.user) {
        let user = socket.request.session.user
        socket.emit('Welcome', {username: user.username})
        //socket represents connection between server and browser
        socket.on('chatMessageFromBrowser', function(data) {
        //emit message to ALL connected users
        //emits to all connected users EXCEPT the one that sent it
        socket.broadcast.emit('chatMessageFromServer', {
            //data to send
            message: sanitizeHTML(data.message, {allowedTags: [], allowedAttributes: {}}),
            username: user.username
        })
    })
    } else {

    }
})

module.exports = server
