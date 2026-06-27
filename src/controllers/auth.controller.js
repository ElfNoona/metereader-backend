const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Helper methods to sign secure JSON Web Tokens
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

// Database tracker to prevent security breach replays by keeping active tokens registered
let activeRefreshTokens = []; 

exports.signUp = async (req, res) => {
  try {
    const { username, password, fullName, accountNo, address, sanctionedLoadKw } = req.body;
    
    let existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ success: false, error: 'User already exists' });

    const newUser = new User({ username, passwordHash: password, fullName, accountNo, address, sanctionedLoadKw });
    await newUser.save();

    const accessToken = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);
    activeRefreshTokens.push(refreshToken);

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      userId: newUser._id,
      user: { fullName: newUser.fullName, accountNo: newUser.accountNo }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ success: false, error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Invalid credentials' });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    activeRefreshTokens.push(refreshToken);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      userId: user._id,
      user: { fullName: user.fullName, accountNo: user.accountNo }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.refreshSession = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ success: false, error: 'Refresh Token Required' });
  if (!activeRefreshTokens.includes(token)) {
    return res.status(403).json({ success: false, error: 'Invalid or revoked Refresh Token' });
  }

  try {
    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    
    // Rotate tokens
    activeRefreshTokens = activeRefreshTokens.filter(t => t !== token); // Remove current token
    
    const newAccessToken = generateAccessToken(payload.userId);
    const newRefreshToken = generateRefreshToken(payload.userId);
    activeRefreshTokens.push(newRefreshToken);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    res.status(403).json({ success: false, error: 'Session expired. Please log in again.' });
  }
};

exports.logout = (req, res) => {
  const { token } = req.body;
  activeRefreshTokens = activeRefreshTokens.filter(t => t !== token);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};