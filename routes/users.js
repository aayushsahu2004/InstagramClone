const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/InstagramData");
const plm = require('passport-local-mongoose');

const userSchema = mongoose.Schema({
  username: {
    type: String,
    require: true,
    unique: true
  },
  email: {
    type: String
  },
  name:{
    type: String,
    require: true
  },
  bio:{
    type: String
  },
  password:{
    type: String,
    require: true
  },
  ProfilePicture:{
    type: String,
    default: 'DefaultImage.png'
  },
  posts:[
    {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "post"
    }
  ],
  stories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "story"
  }],
  savedPost:[
      {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "post"
      } 
  ],
  Followers:[
    {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "user"
    } 
  ],
  Followings:[
    {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "user"
    } 
  ],
});

userSchema.plugin(plm);
module.exports = mongoose.model('user', userSchema);