const validator = require("validator")
const bcrypt = require("bcryptjs")
const { doesEmailExist } = require("../controllers/userController.js")
const usersCollection = require('../db.js').db().collection("users")
let User = function(data) {
    //store data in property to access later
    this.data = data
    this.errors = []
}
//any model created with User
//has access to this function (points toward)
//more efficient than copying same functions
//  across many users


User.prototype.cleanUp = function() {
    if(typeof(this.data.username) != "string") {
        //ignores whatever non-string value is provided
        this.data.username = ""
    }
    if(typeof(this.data.email) != "string") {
        this.data.email = ""
    }
    if(typeof(this.data.password) != "string") {
        this.data.password = ""
    }

    //remove bad properties
    //if someone tried sending a separate property, it is ignored
    this.data = {
        //trim trims whitespace
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }

}

User.prototype.validate = function() {
    return new Promise(async (resolve, reject) => {
        if(this.data.username == "") {
            this.errors.push("Must provide a username")
        }
        if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {
            this.errors.push("Username can only contain alpha numeric characters")
        }
        if(!validator.isEmail(this.data.email)) {
            this.errors.push("Must provide valid email")
        }
        if(this.data.password == "") {
            this.errors.push("Must provide a password")
        }
        if(this.data.password.length > 0 && this.data.password.length < 8) {
            this.errors.push("Password must be at least 8 characters long")
        }
        if(this.data.password.length > 50) {
            this.errors.push("Password cannot exceed 50 characters")
        }
        if(this.data.username.length > 0 && this.data.username.length < 3) {
            this.errors.push("Username must be at least 3 characters")
        }
        if(this.data.username.length > 25) {
            this.errors.push("Username cannot exceed 25 characters")
        }
        //only if username valid, check if available in db
        if(this.data.username.length > 2 && this.data.username.length < 51 && validator.isAlphanumeric(this.data.username)){
            //if mongodb finds a matching document, this promise resolves v
            //else the above promise resolves to null (false)
            let usernameExists = await usersCollection.findOne({username: this.data.username})
            if(usernameExists){
                this.errors.push("Username is taken.")
            }
        }
        //only if email valid, check if available in db
        if(validator.isEmail(this.data.email)){
            let emailExists = await usersCollection.findOne({email: this.data.email})
            if(emailExists){
                this.errors.push("Email is taken.")
            }
        }
        resolve()
    })
}

User.prototype.register = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        //adjust validate to return a promise, then await that promise **need to async the function
        await this.validate()
        //npm install bcryptjs
        //store data in db
        if(!this.errors.length) {
            //hash password
            //create a salt
            let salt = bcrypt.genSaltSync()
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            await usersCollection.insertOne(this.data)
            resolve()
        } else {
            reject(this.errors)
        }
        
    })
}

User.prototype.login = function() {
    return new Promise((resolve, reject) => {
        //can perform asynchronous (takes time) operations
        //then call resolve or reject
        this.cleanUp()
        //first find the user
        //then match password
        //if mongodb finds the user, it passes the document into function(err, doc)
        /*usersCollection.findOne({username: this.data.username}, (err, attemptedUser) => {
            if(attemptedUser && attemptedUser.password == this.data.password) {
                resolve("login fine")
            } else {
                reject("invalid username or pw")
            }
        })*/
        usersCollection.findOne({username: this.data.username}).then((attemptedUser) => {
            if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
                //attemptedUser.password == this.data.password
                this.data = attemptedUser
                resolve("login fine")
            } else {
                reject("Invalid username or password")
            }
        }).catch(function() {
            //this happens if findOne fails
            reject("try later")
        })

    })
}

User.findByUsername = function(username) {
    return new Promise(function(resolve, reject) {
        if (typeof(username) != "string") { 
            reject()
            return
        }
        usersCollection.findOne({username: username}).then(function(userDoc) {
            if(userDoc) {
                userDoc = new User(userDoc)
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username
                    //avatar
                }
                resolve(userDoc)
            } else {
                reject()
            }
        }).catch(function() {
            reject()
            //reject for techinal / db connection error NOT cause it did not find a username
        })
    })

}

User.doesEmailExist = function(email) {
    return new Promise(async function(resolve, reject) {
        if (typeof(email) != "string") { 
            resolve(false)
            return
        }
        let user = await usersCollection.findOne({email: email})
        if(user) {
            resolve(true)
        } else {
            resolve(false)
        }
    })
}

module.exports = User