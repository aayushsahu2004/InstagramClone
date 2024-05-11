const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    comment: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post"
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    ],
    date: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("comment", commentSchema);
