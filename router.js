//how to let 1 js file communicate / share code with another js file
//console.log("executed immediately")
/*module.exports = {
    testStr: "This is export for router file",
    name: "jeffrey",
    speakFunction: function() { console.log("speak")}
}*/

//router directs traffic

const express = require("express")
const router = express.Router()
const userFunctions = require("./controllers/userController")
const postFunctions = require("./controllers/postController")
const followFunctions = require("./controllers/followController")

//*********USER RELATED ROUTES */
//get splash page
router.get('/', userFunctions.home)

//post new user register
router.post('/register', userFunctions.register)

//post user login
router.post('/login', userFunctions.login)

//post user logout
router.post('/logout', userFunctions.logout)

router.post('/doesUsernameExist', userFunctions.doesUsernameExist)
router.post('/doesEmailExist', userFunctions.doesEmailExist)


//*********POST RELATED ROUTES */
//get create post
router.get('/create-post', userFunctions.mustBeLoggedIn, postFunctions.viewCreateScreen)

//post a post
router.post('/create-post', userFunctions.mustBeLoggedIn, postFunctions.create)

//get view post (should be public)
router.get('/post/:id', postFunctions.viewSingle)

router.get('/post/:id/edit', userFunctions.mustBeLoggedIn, postFunctions.viewEditScreen)
router.post('/post/:id/edit', userFunctions.mustBeLoggedIn, postFunctions.update)
router.post('/post/:id/delete', userFunctions.mustBeLoggedIn, postFunctions.delete)
router.post('/search', postFunctions.search)


//*********PROFILE RELATED ROUTES */
router.get('/profile/:username', userFunctions.ifUserExists, userFunctions.sharedProfileData, userFunctions.profilePostsScreen)
router.get('/profile/:username/followers', userFunctions.ifUserExists, userFunctions.sharedProfileData, userFunctions.profileFollowersScreen)
router.get('/profile/:username/following', userFunctions.ifUserExists, userFunctions.sharedProfileData, userFunctions.profileFollowingScreen)

//*********Follow RELATED ROUTES */
router.post('/addFollow/:username', userFunctions.mustBeLoggedIn, followFunctions.addFollow)
router.post('/removeFollow/:username', userFunctions.mustBeLoggedIn, followFunctions.removeFollow)





//get user profile page
//router.get('/profile-page', userFunctions.profilePage)


module.exports = router
