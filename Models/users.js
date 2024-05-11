const mongoose = require("mongoose");
const plm = require('passport-local-mongoose');

const userSchema = mongoose.Schema({
  username: {
    type: String,
    require: true,
    unique: true
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Email is required"],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  name: {
    type: String,
    require: true
  },
  bio: {
    type: String
  },
  password: {
    type: String,
    maxLength: [15, "Password should not exceed more than 15 characters"],
    minLength: [8, "Password should have at least 8 characters"],
    match:[/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,1024}$/, 'Password should contain one uppercase and splecial character']
  },
  ProfilePicture: {
    type: Object,
    default: {
      fileId: "",
      url: "https://ik.imagekit.io/xfssqj13p/Default-User-Image.png?updatedAt=1715264591029"
  }
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post"
    }
  ],
  stories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "story"
  }],
  savedPost: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post"
    }
  ],
  Followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    }
  ],
  Followings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    }
  ],
});

userSchema.plugin(plm);
module.exports = mongoose.model('user', userSchema);