const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const subjectSchema = new Schema({
  subjectTitle:{ type: String, required:true },
  description:{ type: String},
  tutors: [{type: Schema.Types.ObjectId, ref: 'User'}],
  category: {type: Schema.Types.ObjectId, required: true},
  students: [{type: Schema.Types.ObjectId, ref:'User'}],
  lessons: [{type: Schema.Types.ObjectId, ref:'Lesson'}]
}, {timestamps: true});


module.exports = mongoose.model("Subject", subjectSchema);