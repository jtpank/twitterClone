const ObjectID = require('mongodb').ObjectID
const User = require('./User')

const usersCollection = require('../db').db().collection("users")
const followsCollection = require('../db').db().collection("follows")

let Follow = function(followedUsername, authorID) {
    this.followedUsername = followedUsername
    this.authorID = authorID
    this.errors = []
}
Follow.prototype.cleanup = function() {
    if(typeof(this.followedUsername) != "string")   {this.followedUsername = ""}
}

Follow.prototype.validate = async function(action) {
    //followed username must exist in db
    let followedAccount = await usersCollection.findOne({username: this.followedUsername})
    if(followedAccount) {
        this.followedID = followedAccount._id
    } else {
        this.errors.push("Cannot follow a non-existent user.")
    }

    let doesFollowExist = await followsCollection.findOne({followedID: this.followedID, authorID: new ObjectID(this.authorID)})
    if(action == "create") {
        //make sure follow does not already exist
        if(doesFollowExist) {this.errors.push("You are already following this user.") }
    }
    if(action == "delete") {
        //make sure follow does not already exist
        if(!doesFollowExist) {this.errors.push("You are not following this user.") }
    }
    
    //no following yourself
    if(this.followedID.equals(this.authorID)) { this.errors.push("You cannot follow yourself.")}
    

}

Follow.prototype.create = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanup()
        await this.validate("create")
        if(!this.errors.length) {
            await followsCollection.insertOne({followedID: this.followedID, authorID: new ObjectID(this.authorID)})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Follow.prototype.delete = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanup()
        await this.validate("delete")
        if(!this.errors.length) {
            await followsCollection.deleteOne({followedID: this.followedID, authorID: new ObjectID(this.authorID)})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Follow.isVisitorFollowing = async function(followedID, visitorID) {
    let followDoc = await followsCollection.findOne({followedID: followedID, authorID: new ObjectID(visitorID)})
    if(followDoc) {
        return true
    } else {
        return false
    }

}

Follow.getFollowersByID = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let followers = followsCollection.aggregate([
                {$match: {followedID: id}},
                {$lookup: {from: "users", localField: "authorID", foreignField: "_id", as: "userDoc"}},
                //userDoc is array of matching looked up documents
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()
            followers = (await followers).map(function(follower) {
                let user = new User(follower, true)
                return {username: follower.username}
            })
            resolve(followers)
        } catch {
            reject()
        }
    })
}



Follow.getFollowingByID = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let followers = followsCollection.aggregate([
                {$match: {authorID: id}},
                {$lookup: {from: "users", localField: "followedID", foreignField: "_id", as: "userDoc"}},
                //userDoc is array of matching looked up documents
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()
            followers = (await followers).map(function(follower) {
                let user = new User(follower, true)
                return {username: follower.username}
            })
            resolve(followers)
        } catch {
            reject()
        }
    })
}

Follow.countFollowersByID = function(id) {
    return new Promise(async (resolve, reject) => {
        let count = await followsCollection.countDocuments({followedID: id})
        resolve(count)
    })
}

Follow.countFollowingByID = function(id) {
    return new Promise(async (resolve, reject) => {
        let count = await followsCollection.countDocuments({authorID: id})
        resolve(count)
    })
}



module.exports = Follow