const { resolveInclude } = require('ejs')
const Post = require('../models/Post')


exports.viewCreateScreen = function(req, res) {
    res.render("create-post")
    //, {username: req.session.aUser.username}
}

exports.create = function(req, res) {
    //data management should be in models NOT controllers
    //pass form data
    let post = new Post(req.body, req.session.user._id)
    //console.log(req.session.aUser.id)
    post.create().then(function() {
        req.flash("success", "Succesfully created post.")
        req.session.save(() => {
            res.redirect(`/profile/${req.session.user.username}`)
        })
    }).catch(function(errors) {
        errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect('/create-post'))
    })


}
exports.apiCreate = function(req, res) {
    //data management should be in models NOT controllers
    //pass form data
    let post = new Post(req.body, req.apiUser._id)
    //console.log(req.session.aUser.id)
    post.create().then(function() {
      res.json("Congrats.")
    }).catch(function(errors) {
       res.json(errors)
    })
}

exports.viewSingle = async function(req, res) {
    //res.render('single-post-screen')
    try {
        let post = await Post.findSingleByID(req.params.id, req.visitorID)
        res.render('single-post-screen', {post: post, title: post.title})
    } catch {
        res.render('404')
    }

}

exports.viewEditScreen = async function(req, res) {
    try {
        let post = await Post.findSingleByID(req.params.id, req.visitorID)
        if(post.isVisitorOwner) {
            res.render('edit-post', {post: post})
        } else {
            req.flash("errors", "You do not have permission to perform that action.")
            req.session.save(() => res.redirect('/'))
        }
    } catch {
        res.render('404')
    }
}

exports.update = async function(req, res) {
    let post = new Post(req.body, req.visitorID, req.params.id)

    post.update().then((status) => {
        //post succesfully update in db
        //or user has permission and there is a validation error
        if(status == "success") {
            //post updated, flash with green success
            req.flash("success", "Successfully updated post.")
            req.session.save(() => {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        } else {
            post.errors.forEach(function(error) {
                req.flash("errors", error) 
            })
            req.session.save(() => {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }
        
    }).catch(() => {
        //if post with req id does not exist
        //or if current visitor is not owner
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => {
            res.redirect('/')
        })
    })
}

exports.delete = function(req, res) {
    Post.delete(req.params.id, req.visitorID).then(() => {
        req.flash("success","Post succesfully deleted")
        req.session.save(() => {
            res.redirect(`/profile/${req.session.user.username}`)
        })
    }).catch(() => { 
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect('/'))
    })
}
exports.apiDelete = function(req, res) {
    Post.delete(req.params.id, req.apiUser._id).then(() => {
       res.json("Congrats")
    }).catch(() => { 
       res.json("No permission to do that")
    })
}

exports.search = function(req, res) {
    Post.search(req.body.searchTerm).then((data) => {
        res.json(data)
    }).catch(() => {
        res.json([])
    })

}