var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./posts');
const stroyModel = require('./story');
const commentModel = require('./comments');
const upload = require('./multer');
const passport = require('passport');
const localStrategy = require('passport-local')
passport.use(new localStrategy(userModel.authenticate()));

router.get('/', function (req, res) {
  res.render('index', { footer: false });
});

router.get('/login', function (req, res) {
  res.render('login', { footer: false });
});

router.get('/feed', isloggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const posts = await postModel.find().populate('user');
  // console.log(posts.Comments);
  const stories = await stroyModel.find({ user: { $ne: user._id } }).populate('user');
  var obj = {};

  const StoryPacks = stories.filter(function (story) {
    if (!obj[story.user._id]) {
      obj[story.user._id] = 'Stories';
      return true
    }
  })

  res.render('feed', { footer: true, posts, user, stories: StoryPacks });
});

router.get('/story/:number', isloggedIn, async function (req, res) {
  const storyUser = await userModel.findOne({ username: req.session.passport.user }).populate('stories');
  const index = req.params.number;
  const storyImage = storyUser.stories[index];

  if (index >= 0 && storyUser.stories.length > index) {
    res.render('story', { footer: false, storyUser, storyImage, number: index });
  } else {
    res.redirect('/feed');
  }
});

router.get('/story/:id/:number', isloggedIn, async function (req, res) {
  const storyUser = await userModel.findOne({ _id: req.params.id }).populate('stories');
  const index = req.params.number;
  const storyImage = storyUser.stories[index];

  if (index >= 0 && storyUser.stories.length > index) {
    res.render('story', { footer: false, storyUser, storyImage, number: index });
  } else {
    res.redirect('/feed');
  }
});


router.get('/profile', isloggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate('posts savedPost');
  res.render('profile', { footer: true, user });
});

router.get('/userpost/:userId/:postId', isloggedIn, async function (req, res) {
  const users = await userModel.findOne({ username: req.session.passport.user });
  const user = await userModel.findOne({ _id: req.params.userId }).populate('posts');
  const postId = req.params.postId;
  res.render('userpost', { footer: true, user, postId, users });
});

router.get('/savedpost/:userId/:postId', isloggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user })
  const savedPost = await userModel.findOne({ username: req.session.passport.user }).populate('savedPost');
  const SavedPostUser = savedPost.savedPost.map(element => {
    return element.user;
  });
  const postUser = await userModel.findOne({ _id: SavedPostUser });
  const postId = req.params.postId;
  res.render('savedpost', { footer: true, user, savedPost, postId, postUser });
});

router.get('/userprofile/:username', isloggedIn, async function (req, res) {
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

router.get('/search', isloggedIn, async function (req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
  res.render('search', { footer: true, user });
});

router.get('/edit', isloggedIn, async function (req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
  res.render('edit', { footer: true, user });
});

router.get('/upload', isloggedIn, async function (req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
  res.render('upload', { footer: true, user });
});

router.post('/register', function (req, res, next) {
  const userData = new userModel({
    username: req.body.username,
    email: req.body.email,
    name: req.body.name
  })
  userModel.register(userData, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect('/profile')
      })
    })
    .catch(function (err) {
      console.log(err);
    })
});

router.post('/login', passport.authenticate("local", {
  successRedirect: '/profile',
  failureRedirect: '/login'
}), function (req, res, next) { });

function isloggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

router.post('/upload', isloggedIn, upload.single('image'), async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  user.ProfilePicture = req.file.filename;
  await user.save();
  res.redirect('/edit')
});

router.post('/uploadPost', isloggedIn, upload.single('image'), async function (req, res, next) {
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
    const story = await stroyModel.create({
      storyImage: req.file.filename,
      user: user._id
    })
    user.stories.push(story._id);
  }

  await user.save();
  res.redirect("/feed");
});

router.post('/update', isloggedIn, async function (req, res, next) {
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

router.get('/username/:username', isloggedIn, async function (req, res) {
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


router.get('/like/:postId', isloggedIn, async function (req, res) {
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

router.get('/Clicklike/:postId', isloggedIn, async function (req, res) {
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

router.get('/save/:postId', isloggedIn, async function (req, res) {
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

router.get('/delete/:postId', isloggedIn, async function (req, res) {
  const post = await postModel.findOneAndDelete({ _id: req.params.postId });
  const user = await userModel.findOne({ username: req.session.passport.user });
  user.posts.splice(user.posts.indexOf(req.params.postId), 1);
  await user.save();
  res.redirect('/feed');
});

router.get('/follow/:userId', isloggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const requestedUser = await userModel.findOne({ _id: req.params.userId });
  if (user.Followings.indexOf(requestedUser._id) === -1) {
    user.Followings.push(requestedUser._id);
    requestedUser.Followers.push(user._id);
  }
  else{
    user.Followings.splice(user.Followings.indexOf(requestedUser._id), 1);
    requestedUser.Followers.splice(user.Followers.indexOf(user._id), 1);
  }
  await user.save();
  await requestedUser.save();
  res.json({requestedUser, user});
});

router.get('/comments/:postId', isloggedIn, async function(req, res){
  const post = await postModel.findOne({_id: req.params.postId});
  const comments = await commentModel.find({post: post._id}).populate('user');
  res.json(comments);
});

router.get('/createComment/:comment/:postId', isloggedIn, async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.findOne({_id: req.params.postId});
  const comment = await commentModel.create({
    comment: req.params.comment,
    user: user._id,
    post: req.params.postId
  });
  post.Comments.push(comment._id);
  await post.save();
  await post.populate('Comments');
  await comment.populate('user');
  res.json({comment, post});
});

router.get('/Followers/:userId', isloggedIn, async function(req, res){
  const currentUser = await userModel.findOne({username: req.session.passport.user});
  const currentUserId = currentUser._id
  const user = await userModel.findOne({_id: req.params.userId});
  const Followers = await userModel.find({_id: user.Followers});
  const Followings = currentUser.Followings;
  res.json({Followers, Followings, currentUserId});
});

router.get('/Followings/:userId', isloggedIn, async function(req, res){
  const currentUser = await userModel.findOne({username: req.session.passport.user});
  const currentUserId = currentUser._id
  const user = await userModel.findOne({_id: req.params.userId});
  const UserFollowings = currentUser.Followings;
  const Followings = await userModel.find({_id: user.Followings});
  res.json({Followings, UserFollowings, currentUserId});
});

router.get('/RemoveFollowers/:userId', isloggedIn, async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user});
  user.Followers.splice(user.Followers.indexOf(req.params.userId), 1);
  const RemoveUser = await userModel.findOne({_id: req.params.userId});
  RemoveUser.Followings.splice(RemoveUser.Followings.indexOf(user._id), 1);
  await user.save();
  await RemoveUser.save();
  res.json(user);
});

module.exports = router;
