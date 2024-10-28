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
        index: {
            unique: true
        }
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
    createdBy: { // useful for derived circles (created by parents)
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parent",
        required: false
    }, 
    relatedTo:{ // useful for derived circles (created by parents), it reference to the root node under which this group is created 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: false
    },
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
