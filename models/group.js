const mongoose = require("mongoose") ;

const groupSchema = new mongoose.Schema({
    isStandardGroup: {
        type: Boolean,
        required: true
    },
    groupTypeId:{   
        type: String,
        trim: true, 
        required: true,
    },
    groupName: {
        type: String,
        trim: true, 
        required: true
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Parent",
            required: false
        }
    ],
    createdOn: {
        type: Date,
        default: Date.now(),
        immutable: true
    },
    updatedOn: {
        type: Date,
        default: Date.now(),
        immutable: false
    }
}) ;

groupSchema.pre('save', function(next) {
    this.updatedOn = Date.now();
    next();
});

module.exports = mongoose.model("Group", groupSchema) ;