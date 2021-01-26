const apiRouter = require('express').Router()
const userFunctions = require("./controllers/userController")
const postFunctions = require("./controllers/postController")
const followFunctions = require("./controllers/followController")
const cors = require('cors')

//configures routes for cors so its allowed from any domain
apiRouter.use(cors())

apiRouter.post('/login', userFunctions.apiLogin)
apiRouter.post('/create-post', userFunctions.apiMustBeLoggedIn, postFunctions.apiCreate)
apiRouter.delete('/post/:id', userFunctions.apiMustBeLoggedIn, postFunctions.apiDelete)
apiRouter.get('/post/postsByAuthor/:username', userFunctions.apiGetPostsByUsername)
//export so its availabe from main file that is importing
module.exports = apiRouter