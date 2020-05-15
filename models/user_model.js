const { TOKEN_KEY, API_KEY } = require('../configs/config');
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema({
  userName:{ type: String, required:true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: {type: String, required: true},
  isAdmin:{type: Boolean, default: false},
  active: {type: Boolean, default: true},
  tokens: [],
  categories: [{type: Schema.Types.ObjectId}],
  subjects:[{type: Schema.Types.ObjectId, ref: "Subject"}],
  lessons: [{type: Schema.Types.ObjectId, ref: "Lesson"}], 
  requests: []
}, {timestamps: true});

userSchema.methods.generateAuthToken = async function (){
  // Generate an auth token for the user
  const token = jwt.sign({_id: this._id}, TOKEN_KEY);
  this.tokens =  this.tokens.concat({token});
  await this.save();
  return token;
};

userSchema.methods.generateAPI_Key = async function (){
  // Generate an auth token for the user
  const token = jwt.sign({_id: this._id, isAdmin: this.isAdmin, role: this.role}, API_KEY);
  this.tokens =  this.tokens.concat({token});
  await this.updateOne({tokens: token});
  return token;
};


module.exports = mongoose.model("User", userSchema);