//setup function exports
const User = require('../models/User.js')
const Post = require('../models/Post.js')
const Follow = require('../models/Follow.js')
const jwt = require('jsonwebtoken')
const dotenv = require("dotenv")
dotenv.config()

exports.apiGetPostsByUsername = async function(req, res) {
    try {
        let authorDoc = await User.findByUsername(req.params.username)
        let posts = await Post.findByAuthorID(authorDoc._id)
        res.json(posts)
    } catch {
        res.json("Sorry, invalid user requested")
    }
}

exports.doesUsernameExist = function(req, res) {
    User.findByUsername(req.body.username).then(function() {
        //data that axios request receives
        res.json(true)
    }).catch(function() {
        res.json(false)
    })
}

exports.doesEmailExist = async function(req, res) {
    let emailBool = await User.doesEmailExist(req.body.email)
    res.json(emailBool)

}


exports.mustBeLoggedIn = function(req, res, next) {
    if(req.session.user) {
        next()
    } else {
        req.flash("errors", "Must be logged in to perform that action.")
        req.session.save(function() {
            res.redirect('/')
        })
    }
}
exports.apiMustBeLoggedIn = function(req, res, next) {
    try {
        req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET)
        next()
    } catch {
        res.json("must provide valid token")
    }
}

exports.login = function(req, res) {
    let user = new User(req.body)
    //returns a promise
    //how to use a promise
    //then is what to do successful
    //catch is what to do if fail
    user.login().then(function() {
        //store info in this object to be unique to this browswer session
        //storing values in memory of server here is not stable (every restart = lose session data)
        //solution is to store session data in mongodb 
        req.session.user = {username: user.data.username, _id: user.data._id}
        //now use this session data when vist the home page
        //browser sends cookie to server with every get req
        //res.redirect(result)
        req.session.save(function() {
            res.redirect('/')
        })
    }).catch(function(e) {
        //e is the value our promise rejects with
        //leverage flash package here
        //adds flash object onto req object
        //this modifies our sessions data
        //dont perform redirect till complete storing in db
        req.flash('errors', e)
        req.session.save(function() {
            res.redirect('/')
        })
        
    })
   
}
exports.apiLogin = function(req, res) {
    //decouple from web browser environment
    let user = new User(req.body)
    user.login().then(function(result) {
        res.json(jwt.sign({_id: user.data._id}, process.env.JWTSECRET, {expiresIn: '1d'}))
    }).catch(function(e) {
       res.json("Invalid login credentials")
    })
   
}
exports.logout = function(req, res) {
    //if incoming req with equiv cookie, destroys the session
    //provide  a callback (sessions doesn't use promises) to wait until the session is destroyed
    req.session.destroy(function() {
        res.redirect('/')
    })

}
exports.register = function(req, res) {
    //access data through req.body
    //new operator creates a new object using User as a blueprint
    //and pass form field inputs
    let user = new User(req.body)
    user.register().then(() => {
        //redirect to homepage and update session data
        req.session.user = {username: user.data.username, _id: user.data._id}
        req.session.save(function(){
            res.redirect('/')
        })
    }).catch((regErrors) => {
        regErrors.forEach(function(error){
            //callback fcn for each element of array
            //instead use flash pkg to add errors to session data
            //name of error, error
            req.flash('regErrors', error)
            req.session.save(function(){
                res.redirect('/')
            })

        })
    })
    
}
exports.home = async function(req, res) {
    if(req.session.user) {
        //fetch feed of posts for current user
        let posts = await Post.getFeed(req.session.user._id)
        res.render('home-dashboard', {posts: posts})
    } else {
        //want to delete the flash session after accessing it
        res.render('home-guest', {regErrors: req.flash('regErrors')})
    }
}
exports.profilePage = function(req, res) {
    res.render("profile-page.ejs")
}

exports.ifUserExists = function(req, res, next) {
    User.findByUsername(req.params.username).then(function(userDocument) {
        req.profileUser = userDocument
        next()
    }).catch(function() {
        res.render('404')
    })
}

exports.profilePostsScreen = function(req, res) {
    //ask post model for posts by author id
    Post.findByAuthorID(req.profileUser._id).then(function(posts) {
        res.render('profile', {
            currentPage: "posts",
            posts: posts,
            profileUsername: req.profileUser.username,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    }).catch(function() {
        res.render('404')
    })
   
}

exports.sharedProfileData = async function(req, res, next) {
    let isVisitorsProfile = false
    let isFollowing = false
    if(req.session.user) {
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
        //ask follow model if current user is following
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorID)
    }
    req.isVisitorsProfile = isVisitorsProfile
    req.isFollowing = isFollowing
    //get posts following and followed counts
    let postCountPromise = Post.countPostsByAuthor(req.profileUser._id)
    let followerCountPromise = Follow.countFollowersByID(req.profileUser._id)
    let followingCountPromise = Follow.countFollowingByID(req.profileUser._id)
    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])

    req.postCount = postCount
    req.followerCount = followerCount
    req.followingCount = followingCount

    next()
}

exports.profileFollowersScreen = async function(req, res) {
    try {
        let followers = await Follow.getFollowersByID(req.profileUser._id)
        res.render('profile-followers', {
        currentPage: "followers",
        followers: followers,
        profileUsername: req.profileUser.username,
        isFollowing: req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })
    } catch {
        res.render("404")
    }
}


exports.profileFollowingScreen = async function(req, res) {
    try {
        let following = await Follow.getFollowingByID(req.profileUser._id)
        res.render('profile-following', {
        currentPage: "following",
        following: following,
        profileUsername: req.profileUser.username,
        isFollowing: req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })
    } catch {
        res.render("404")
    }
}
