const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parent",
    required: true,
  },
  groupId: {
    // __id of group in which this post created
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  content: {
    message: {
      type: "String",
      required: false,
      trim: true,
    },
    Attachments: {
      type: String,
      required: false,
    },
  },
  isThreadCreated: {
    type: Boolean,
    default: false,
    required: false,
  },
  totalReplies: {
    type: Number,
    required: false,
    default: 0,
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

postSchema.pre("save", function (next) {
  this.updatedOn = Date.now();
  next();
});

module.exports = mongoose.model("Post", postSchema);
