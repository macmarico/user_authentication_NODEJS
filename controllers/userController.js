import asyncHandler from "express-async-handler";
import {
  generateAccessToken,
  generateRefreshToken,
} from "./../utils/generateToken.js";
import User from "./../models/usersModel.js";
import RefreshToken from "./../models/refreshTokenModel.js";
import jwt from "jsonwebtoken";

// @desc Auth user & get token
// @route POST /api/user/login
// @access public

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    const refreshToken = generateRefreshToken(user._id);
    const refreshTokenSaved = RefreshToken.create({
      refreshToken,
    });
    if (!refreshTokenSaved) {
      res.status(500);
      throw new Error("Internal server errror");
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      accessToken: generateAccessToken(user._id),
      refreshToken,
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc register a new user
// @route POST /api/user
// @access public

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateAccessToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc get user profile
// @route POST /api/users/profile
// @access private

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc Refresh token
// @route POST /api/users/RefreshToken
// @access private

const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.header("x-auth-token");
  if (!refreshToken) {
    res.status(401);
    throw new Error("Token not found");
  }
  const tokenValid = await RefreshToken.findOne({ refreshToken });
  if (!tokenValid) {
    res.status(403);
    throw new Error("Token invalid");
  }
  const user = await jwt.verify(refreshToken, process.env.JWT_SECRET);
  const { id } = user;
  const accessToken = generateAccessToken(id);
  res.json({
    accessToken,
  });
});

export { authUser, registerUser, getUserProfile, refreshToken };
