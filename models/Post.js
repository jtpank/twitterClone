const postsCollection = require('../db').db().collection("posts")
const followsCollection = require('../db').db().collection("follows")

//npm install sanitiz-html
const sanitizeHTML = require('sanitize-html')


const ObjectID = require('mongodb').ObjectID
let Post = function(data, userID, requestedPostID) {
    this.data = data
    this.userID = userID
    this.requestedPostID = requestedPostID
    this.errors = []
}

Post.prototype.cleanup = function() {
    if(typeof(this.data.title) != "string") { this.data.title = "" }
    if(typeof(this.data.body) != "string") { this.data.body = "" }

    //get rid of bad properties
    this.data = {
        title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
        body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
        createdDate: new Date(),
        //should store as an object id OBJECT TYPE
        author: ObjectID(this.userID)
    }
}

Post.prototype.validate = function() {
    //ensure niether title nor body are both blank
    if(this.data.title == "") { this.errors.push("Provide a title.")} 
    if(this.data.body == "") { this.errors.push("Provide a body.")} 
}


Post.prototype.create = function() {
    this.cleanup()
    this.validate()
    return new Promise((resolve, reject) => {
        if(!this.errors.length) {
            //store doc (post) in db
            postsCollection.insertOne(this.data).then(() => {
                resolve()
            }).catch(() => {
                this.errors.push("Try again, please.")
                reject(this.errors)
            })
        } else {
            //reject
            reject(this.errors)
        }
    })
}

Post.prototype.update = function() {
    return new Promise(async (resolve, reject) => {
        //find relevant post document in db
        //does post id exist? --> check
        try {
            let post = await Post.findSingleByID(this.requestedPostID, this.userID)
            if(post.isVisitorOwner) {
                //safe to update db document
                let status = await this.actuallyUpdateDB()
                resolve(status)
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

Post.prototype.actuallyUpdateDB = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanup()
        this.validate()
        if(!this.errors.length) {
            await postsCollection.findOneAndUpdate({_id: new ObjectID(this.requestedPostID)}, {$set: {
                title: this.data.title, 
                body: this.data.body 
            }})
            resolve("success")
        } else {
            resolve("failure")
        }
    })
}

Post.reusablePostQuery = function(uniqueOps, visitorID) {
    return new Promise(async function(resolve, reject) {
        let aggOps = uniqueOps.concat([
            //local is post collection, foreign is the users collection, as uses this name
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
            //project allows us to spell out which fields the resulting object has
            //so we don't return ALL fields for the resulting object
            {$project: {
                title: 1,
                body: 1,
                createdDate: 1,
                authorID: "$author",
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ])

        let posts = await postsCollection.aggregate(aggOps).toArray()
        //cleanup author property in each post object
        posts = posts.map(function(post) {
            //pull author id for current post
            post.isVisitorOwner = post.authorID.equals(visitorID)
            //can use slow operation
            // delete post.authorID
            post.authorID = undefined
            post.author = {
                username: post.author.username,
                //and avatar
            }
            return post
        })
        resolve(posts)
    })
}
//uppercase Post is a function
//how to add a function to a function?
//in JS a function is an object
//so can leverage Post as a constructor or by calling a function on it

Post.findSingleByID = function(id, visitorID) {
    return new Promise(async function(resolve, reject) {
        //first check id so as to not waste a trip to the database
        if(typeof(id) != "string" || !ObjectID.isValid(id)) {
            reject()
            //prevent any further functon execution
            return
        } 
        //aggregate returns data from MongoDB perspective
        //aggregate lets us run multiple operations, passed as an array of ops
        
        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectID(id)}}
        ], visitorID)

        if(posts.length) {
            //if it found a document
            //console.log(posts[0])
            resolve(posts[0])
        } else {
            reject()
        }
    })
}

Post.findByAuthorID = function(authorID) {
    //array of aggregate operations (each op is an object) as arg for reusablePostQuery
    return Post.reusablePostQuery([
        {$match: {author: authorID}},
        {$sort: {createdDate: -1}}
    ])
}

Post.delete = function(postIDtoDelete, currentUserID) {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleByID(postIDtoDelete, currentUserID)
            if(post.isVisitorOwner) {
                await postsCollection.deleteOne({_id: new ObjectID(postIDtoDelete)})
                resolve()
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

Post.search = function(searchTerm) {
    return new Promise(async (resolve, reject) => {
        if(typeof(searchTerm) == "string") {
            let posts = await Post.reusablePostQuery([
                //when you want a text search in mongo db
                // --> they contain certain text in them
                // --> this is an expensive operation
                // --> mongodb uses indexes to avoid the expense
                // SO when you want to search in those fields:
                // Create index in Mongodb
                {$match: {$text: {$search: searchTerm}}},
                {$sort: {score: {$meta: "textScore"}}}
            ])
            resolve(posts)
        } else {
            reject()
        }
    })
}

Post.countPostsByAuthor = function(id) {
    return new Promise(async (resolve, reject) => {
        let postCount = await postsCollection.countDocuments({author: id})
        resolve(postCount)
    })
}

Post.getFeed = async function(id) {
    //create array of user IDs that current user follows
    let followedUsers = await followsCollection.find({authorID: new ObjectID(id)}).toArray()
    followedUsers = followedUsers.map(function(followDoc) {
        return followDoc.followedID
    })
    //look for posts where author is in the above array of followed users   
    return Post.reusablePostQuery([
        {$match: {author: {$in: followedUsers}}},
        {$sort: {createdDate: -1}}
    ])
}

module.exports = Post