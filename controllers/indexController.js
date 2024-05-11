const path = require("path");
const userModel = require('../Models/users');
const postModel = require('../Models/posts');
const storyModel = require('../Models/story');
const commentModel = require('../Models/comments');
const passport = require('passport');
const localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));
const { catchAsyncError } = require("../middleware/catchAsyncErrors");
// const upload = require('../routes/multer');
const imagekit = require("../utils/imagekit").initImageKit();
const { v4: uuidv4 } = require('uuid');

const upload = require("../utils/multer");

exports.registerPage = catchAsyncError(function (req, res) {
    res.render('index', { footer: false, messages: req.flash("error") });
});

exports.loginPage = catchAsyncError(function (req, res) {
    res.render('login', { footer: false, error: req.flash("error") });
});

exports.editPage = catchAsyncError(async function (req, res) {
    const user = await userModel.findOne({
        username: req.session.passport.user
    })
    res.render('edit', { footer: true, user });
});

exports.createUser = catchAsyncError(function (req, res, next) {
    const userData = new userModel({
        username: req.body.username,
        email: req.body.email,
        name: req.body.name
    });
    userModel.register(userData, req.body.password)
        .then(function () {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/profile")
            })
        })
        .catch(function (err) {
            if (err.name === 'UserExistsError' || err.code === 11000) {
                req.flash('error', 'Username already exists');
                return res.redirect('/');
            } else if (err.name === 'MongoServerError' && err.message.includes("E11000 duplicate key")) {
                req.flash('error', "User with this email address already exist");
                return res.redirect('/');
            } else {
                req.flash('error', err.message);
                return res.redirect('/');
            }
        });
});

exports.loggedInUser = catchAsyncError(passport.authenticate("local", {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true,
}), function (req, res, next) { });

exports.logoutUser = catchAsyncError(function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/login');
    });
});

exports.profilePage = catchAsyncError(async function (req, res) {
    const user = await userModel.findOne({ username: req.session.passport.user }).populate('posts savedPost');
    res.render('profile', { footer: true, user });
    console.log();
});

exports.uploadProfilePicture = catchAsyncError(async function (req, res, next) {
    const user = await userModel.findOne({ username: req.session.passport.user });

    const file = req.file;
    const modifiedName = uuidv4() + Date.now() + path.extname(file.originalname);


    if (user.ProfilePicture.fileId !== "") {
        await imagekit.deleteFile(user.ProfilePicture.fileId);
    };

    const { fileId, url } = await imagekit.upload({
        file: file.buffer,
        fileName: modifiedName
    });

    user.ProfilePicture = { fileId, url };
    await user.save();
    res.redirect("/edit");
});

exports.updateUser = catchAsyncError(async function (req, res, next) {
    const UpdateUser = await userModel.findOneAndUpdate(
        { username: req.session.passport.user },
        { username: req.body.username, name: req.body.name, bio: req.body.bio },
        { new: true }
    );

    req.login(UpdateUser, function (err) {
        if (err) {
            console.log(err);
        }
    })

    await UpdateUser.save();
    res.redirect('/edit')
});

exports.searchUser = catchAsyncError(async function (req, res) {
    const user = await userModel.findOne({
        username: req.session.passport.user
    })
    res.render('search', { footer: true, user });
});

exports.searchUsername = catchAsyncError(async function (req, res) {
    const user = await userModel.findOne({ username: req.session.passport.user })
    const regexPatternForName = new RegExp(`^${req.params.username}`, 'i');
    const regexPatternForUsername = new RegExp(`^${req.params.username}`, 'i');
    const users = await userModel.find({
        $and: [
            {
                $or: [
                    { username: regexPatternForUsername },
                    { name: regexPatternForName }
                ]
            },
            { _id: { $ne: user._id } }
        ]
    });
    res.json(users);
});

exports.feedPage = catchAsyncError(async function (req, res) {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const posts = await postModel.find().populate('user');
    const stories = await storyModel.find({ user: { $ne: user._id } }).populate('user');
    var obj = {};

    const StoryPacks = stories.filter(function (story) {
        if (!obj[story.user._id]) {
            obj[story.user._id] = 'Stories';
            return true
        }
    })

    res.render('feed', { footer: true, posts, user, stories: StoryPacks });
});

exports.suggestionPage = catchAsyncError(async function (req, res) {
    const user = await userModel.findOne({
        username: req.session.passport.user
    });
    const FollowingsUserId = user.Followings.map(following => following._id);
    const suggestUser = await userModel.find({
        $and: [
            { _id: { $ne: user._id } },
            { _id: { $nin: FollowingsUserId } }
        ]
    });
    res.render('suggestion', { footer: true, user, suggestUser });
});

exports.uploadPage = catchAsyncError(async function (req, res) {
    const user = await userModel.findOne({
        username: req.session.passport.user
    })
    res.render('upload', { footer: true, user });
});

exports.userProfile = catchAsyncError(async function (req, res) {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const username = req.params.username;
    if (user.username === username) {
        res.redirect('/profile');
    }
    else {
        const users = await userModel.findOne({ username: username }).populate('posts');
        res.render('userprofile', { footer: true, users, user });
    }
});

exports.followUser = catchAsyncError(async function (req, res) {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const requestedUser = await userModel.findOne({ _id: req.params.userId });
    if (user.Followings.indexOf(requestedUser._id) === -1) {
        user.Followings.push(requestedUser._id);
        requestedUser.Followers.push(user._id);
    }
    else {
        user.Followings.splice(user.Followings.indexOf(requestedUser._id), 1);
        requestedUser.Followers.splice(user.Followers.indexOf(user._id), 1);
    }
    await user.save();
    await requestedUser.save();
    res.json({ requestedUser, user });
});

exports.checkFollowers = catchAsyncError(async function (req, res) {
    const currentUser = await userModel.findOne({ username: req.session.passport.user });
    const currentUserId = currentUser._id
    const user = await userModel.findOne({ _id: req.params.userId });
    const Followers = await userModel.find({ _id: user.Followers });
    const Followings = currentUser.Followings;
    res.json({ Followers, Followings, currentUserId });
});

exports.checkFollowings = catchAsyncError(async function (req, res) {
    const currentUser = await userModel.findOne({ username: req.session.passport.user });
    const currentUserId = currentUser._id
    const user = await userModel.findOne({ _id: req.params.userId });
    const UserFollowings = currentUser.Followings;
    const Followings = await userModel.find({ _id: user.Followings });
    res.json({ Followings, UserFollowings, currentUserId });
});

exports.removeFollowers = catchAsyncError(async function (req, res) {
    const user = await userModel.findOne({ username: req.session.passport.user });
    user.Followers.splice(user.Followers.indexOf(req.params.userId), 1);
    const RemoveUser = await userModel.findOne({ _id: req.params.userId });
    RemoveUser.Followings.splice(RemoveUser.Followings.indexOf(user._id), 1);
    await user.save();
    await RemoveUser.save();
    res.json(user);
});


exports.createPost = catchAsyncError(async function (req, res, next) {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const file = req.file;
    const modifiedName = uuidv4() + Date.now() + path.extname(file.originalname);
    const { fileId, url } = await imagekit.upload({
        file: file.buffer,
        fileName: modifiedName
    });

    if (req.body.type === "Post") {
        const post = await postModel.create({
            fileId: fileId,
            picture: url,
            user: user._id,
            caption: req.body.caption,
        })
        user.posts.push(post._id);
    }

    else if (req.body.type === "Story") {
        const story = await storyModel.create({
            fileId: fileId,
            storyImage: url,
            user: user._id
        })
        user.stories.push(story._id);
    }

    await user.save();
    res.redirect("/feed");
});

exports.likePost = catchAsyncError(async function (req, res) {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const post = await postModel.findOne({
        _id: req.params.postId
    });
    if (post.likes.indexOf(user.id) === -1) {
        post.likes.push(user._id);
    }
    else {
        post.likes.splice(post.likes.indexOf(user._id), 1);
    }
    await post.save();
    res.send(post);
});

exports.clickLikePost = catchAsyncError(async function (req, res) {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const post = await postModel.findOne({
        _id: req.params.postId
    });
    if (post.likes.indexOf(user.id) === -1) {
        post.likes.push(user._id);
    }
    await post.save();
    res.send(post);
});

exports.savePost = catchAsyncError(async function (req, res) {
    const user = await userModel.findOne({ username: req.session.passport.user });
    if (user.savedPost.indexOf(req.params.postId) === -1) {
        user.savedPost.push(req.params.postId);
    }
    else {
        user.savedPost.splice(user.savedPost.indexOf(req.params.postId), 1)
    }
    await user.save();
    res.json(user);

});

exports.showSavedPost = catchAsyncError(async function (req, res) {
    const user = await userModel.findOne({ username: req.session.passport.user })
    const savedPost = await userModel.findOne({ username: req.session.passport.user }).populate('savedPost');
    const SavedPostUser = savedPost.savedPost.map(element => {
        return element.user;
    });
    const postUser = await userModel.findOne({ _id: SavedPostUser });
    const postId = req.params.postId;
    res.render('savedpost', { footer: true, user, savedPost, postId, postUser });
});

exports.showUserPost = catchAsyncError(async function (req, res) {
    const users = await userModel.findOne({ username: req.session.passport.user });
    const user = await userModel.findOne({ _id: req.params.userId }).populate('posts');
    const postId = req.params.postId;
    res.render('userpost', { footer: true, user, postId, users });
});

exports.deletePost = catchAsyncError(async function (req, res) {
    const post = await postModel.findOneAndDelete({ _id: req.params.postId });
    const user = await userModel.findOne({ username: req.session.passport.user });
    const alluser = await userModel.find({ savedPost: req.params.postId });

    await commentModel.deleteMany({ post: req.params.postId });
    const postIndex = user.posts.indexOf(req.params.postId);
    if (postIndex !== -1) {
        user.posts.splice(postIndex, 1);
        await imagekit.deleteFile(post.fileId);
        await user.save();
    }
    for (const u of alluser) {
        try {
            const existingUser = await userModel.findById(u._id);
            if (existingUser) {
                const savedPostIndex = existingUser.savedPost.indexOf(req.params.postId);
                if (savedPostIndex !== -1) {
                    existingUser.savedPost.splice(savedPostIndex, 1);
                    await existingUser.save();
                }
            } else {
                console.error(`User with ID ${u._id} not found.`);
            }
        } catch (error) {
            console.error(`Error updating user with ID ${u._id}:`, error);
        }
    }

    res.redirect('/feed');

});

exports.showComment = catchAsyncError(async function (req, res) {
    const post = await postModel.findOne({ _id: req.params.postId });
    const comments = await commentModel.find({ post: post._id }).populate('user');
    res.json(comments);
});

exports.createComment = catchAsyncError(async function (req, res) {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const post = await postModel.findOne({ _id: req.params.postId });
    const comment = await commentModel.create({
        comment: req.params.comment,
        user: user._id,
        post: req.params.postId
    });
    post.Comments.push(comment._id);
    await post.save();
    await post.populate('Comments');
    await comment.populate('user');
    res.json({ comment, post });
});

exports.createStory = catchAsyncError(upload.single('image'), async function (req, res, next) {
    const user = await userModel.findOne({ username: req.session.passport.user });
    if (req.body.type === "Post") {
        const post = await postModel.create({
            picture: req.file.filename,
            user: user._id,
            caption: req.body.caption,
        })
        user.posts.push(post._id);
    }

    else if (req.body.type === "Story") {
        const story = await storyModel.create({
            storyImage: req.file.filename,
            user: user._id
        })
        user.stories.push(story._id);
    }

    await user.save();
    res.redirect("/feed");
});

exports.findStory = catchAsyncError(async function (req, res) {
    const storyUser = await userModel.findOne({ username: req.session.passport.user }).populate('stories');
    const index = req.params.number;
    const storyImage = storyUser.stories[index];

    if (index >= 0 && storyUser.stories.length > index) {
        res.render('story', { footer: false, storyUser, storyImage, number: index });
    } else {
        res.redirect('/feed');
    }
});

exports.findUserStory = catchAsyncError(async function (req, res) {
    const storyUser = await userModel.findOne({ _id: req.params.id }).populate('stories');
    const index = req.params.number;
    const storyImage = storyUser.stories[index];

    if (index >= 0 && storyUser.stories.length > index) {
        res.render('story', { footer: false, storyUser, storyImage, number: index });
    } else {
        res.redirect('/feed');
    }
})