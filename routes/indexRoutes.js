var express = require('express');
var router = express.Router();
const isLoggedIn = require("../utils/auth")
const upload = require('../utils/multer');

const { registerPage, loginPage, createUser, loggedInUser, logoutUser, profilePage, feedPage, updateUser, searchUser, editPage, suggestionPage, searchUsername, uploadPage, userProfile, uploadProfilePicture, followUser, checkFollowers, checkFollowings, removeFollowers } = require('../controllers/indexController');

const { createPost, likePost, clickLikePost, savePost, deletePost, showComment, createComment, showSavedPost, showUserPost } = require('../controllers/indexController');

const { findStory, createStory, findUserStory } = require('../controllers/indexController');



// /GET register page
router.get('/', registerPage);

// /GET login page
router.get('/login', loginPage);

// /POST Register User
router.post("/register", createUser);

// /POST Login User
router.post('/login', loggedInUser);

// /GET Logout User
router.get('/logout', logoutUser);

// /GET Edit Page
router.get('/edit', isLoggedIn, editPage);

// /GET Profile Page
router.get('/profile', isLoggedIn, profilePage);

// /POST Upload Profile Picture
router.post('/uploadProfilePicture', isLoggedIn, upload.single("image"), uploadProfilePicture);

// /POST Update User
router.post('/update', isLoggedIn, updateUser);

// /GET Search Paage
router.get('/search', isLoggedIn, searchUser);
router.get('/username/:username', isLoggedIn, searchUsername);

// /Get Feed Page
router.get('/feed', isLoggedIn, feedPage);

// /GET Suggetion Page
router.get('/suggestions', isLoggedIn, suggestionPage)

// /GET Upload Page
router.get('/upload', isLoggedIn, uploadPage);

// /GET User Profile
router.get('/userprofile/:username', isLoggedIn, userProfile);

// /GET Follow User
router.get('/follow/:userId', isLoggedIn, followUser);

// /GET Check Followers
router.get('/Followers/:userId', isLoggedIn, checkFollowers);

// /GET Check Followings
router.get('/Followings/:userId', isLoggedIn, checkFollowings);

// /GET Remove Followers
router.get('/RemoveFollowers/:userId', isLoggedIn, removeFollowers);


// /POST Create Post
router.post('/uploadPost', isLoggedIn, upload.single("image"), createPost);

// /GET Like Post
router.get('/like/:postId', isLoggedIn, likePost);

// /GET Click Like Post 
router.get('/Clicklike/:postId', isLoggedIn, clickLikePost);

// /GET Save Post 
router.get('/save/:postId', isLoggedIn, savePost);

// /GET Show Saved Post
router.get('/savedpost/:userId/:postId', isLoggedIn, showSavedPost);

// /GET Show User Post 
router.get('/userpost/:userId/:postId', isLoggedIn, showUserPost);

// /GET Delete Post 
router.get('/delete/:postId', isLoggedIn, deletePost);

// /GET Show Comment
router.get('/comments/:postId', isLoggedIn, showComment);

// /GET Create Comment
router.get('/createComment/:comment/:postId', isLoggedIn, createComment);

// /POST Create Story 
router.post('/uploadPost', isLoggedIn, createStory);

// /GET Find Story
router.get('/story/:number', isLoggedIn, findStory);

// /GET Find User Story
router.get('/story/:id/:number', isLoggedIn, findUserStory);


module.exports = router;