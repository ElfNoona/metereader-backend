const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  bpNumber: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Middleware to hash passwords 
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Instance method to evaluate password validity
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);