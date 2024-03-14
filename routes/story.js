const mongoose = require('mongoose');

const storySchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  date: {
    type: Date,
    default: Date.now
  },
  storyImage: String,
  likes: [
    {type: mongoose.Schema.Types.ObjectId, ref: 'user'}
  ]
})

module.exports = mongoose.model("story", storySchema);