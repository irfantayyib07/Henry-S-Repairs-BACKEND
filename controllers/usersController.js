const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

// @desc Get all users
// @route GET /users
// @access Private

const getAllUsers = asyncHandler(async (req, res) => {
 const users = await User.find().select("-password").lean()

 if (!users?.length) {
  return res.status(400).json({ message: "No users found" })
 }

 res.json(users)
})

// @desc Create new user
// @route POST /users
// @access Private

const createNewUser = asyncHandler(async (req, res) => {
 const { username, password, roles } = req.body

 if (!username || !password || !Array.isArray(roles) || !roles.length) {
  return res.status(400).json({ message: "All fields are required" })
 }

 // TODO: to study
 const duplicate = await User.findOne({ username }).lean().exec() // without lean(), a mongoose document will be returned
 if (duplicate) return res.status(409).json({ message: "Username already taken!" })

 const hashedPassword = await bcrypt.hash(password, 10)

 const newUserInfo = { username, password: hashedPassword, roles }
 const newUser = await User.create(newUserInfo)
 if (newUser) {
  res.status(201).json({ message: `New user ${username} created` })
 } else {
  res.status(400).json({ message: "Invalid user data received" })
 }
})

// @desc update user
// @route PATCH /users
// @access Private

const updateUser = asyncHandler(async (req, res) => {
 const { id, username, roles, active, password } = req.body

 if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== "boolean") {
  return res.status(400).json({ message: "All fields except password are required" })
 }

 const user = await User.findById(id).exec()
 if (!user) {
  return res.status(400).json({ message: "No such user" })
 }

 // TODO: to study
 const duplicate = await User.findOne({ username }).lean().exec()
 if (duplicate && duplicate?._id.toString() !== id) {
  return res.status(409).json({ message: "Username already taken!" })
 }

 user.username = username
 user.roles = roles
 user.active = active
 if (password) user.password = await bcrypt.hash(password, 10)

 const updatedUser = await user.save() // save method is from the mongoose document

 res.json({ message: `Updated user ${username}` })
})

// @desc delete user
// @route DELETE /users
// @access Private

const deleteUser = asyncHandler(async (req, res) => {
 const { id } = req.body

 if (!id) {
  return res.status(400).json({ message: "User ID is required" })
 }

 const note = await Note.findOne({ user: id }).lean().exec()
 if (note) {
  return res.status(400).json({ message: "User has assigned notes" })
 }

 const user = await User.findById(id).exec()
 if (!user) {
  return res.status(400).json({ message: "User not found" })
 }

 const toBeDeleted = await User.findOne({ _id: id })
 await user.deleteOne()

 res.json({ message: `Username ${toBeDeleted.username} with id ${id} deleted` })
})

module.exports = {
 getAllUsers,
 createNewUser,
 updateUser,
 deleteUser,
}