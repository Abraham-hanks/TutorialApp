const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const lessonSchema = new Schema({
date: {type: String, required: true},
tutor: {type: Schema.Types.ObjectId, required: true},
subject: {type: Schema.Types.ObjectId, required: true},
student: {type: Schema.Types.ObjectId, required: true}
}, {timestamps: true});


module.exports = mongoose.model("Lesson", lessonSchema);