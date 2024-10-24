const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parent",
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  groupId: {
    // _id of group in which this post has created
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  content: {
    message: {
      type: "String",
      required: false,
      trim: true,
    },
    Attachments: {
      // assuming only images are allowed in base64 string format
      type: String,
      required: false,
    },
  },
  votes: {
    up: {
      type: Number,
      default: 0,
    },
    down: {
      type: Number,
      default: 0,
    },
  },
  postedOn: {
    type: Date,
    default: Date.now(),
    immutable: true,
  },
  updatedOn: {
    type: Date,
    default: Date.now(),
    immutable: false,
  },
});

replySchema.pre("save", function (next) {
  this.updatedOn = Date.now();
  next();
});

module.exports = mongoose.model("Reply", replySchema);
