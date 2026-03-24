import asyncWrapper from '../../shared/service/asyncHandler.js'
import {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from './userProfile.service.js'

export const getUserProfileController = asyncWrapper(async (req, res) => {
  const userId = req.user.id
  const userProfile = await getUserProfile(userId)

  res.json(userProfile)
})

export const updateUserProfileController = asyncWrapper(async (req, res) => {
  const userId = req.user.id
  const profileData = req.body
  const updatedProfile = await updateUserProfile(userId, profileData)

  res.json(updatedProfile)
})

export const deleteUserProfileController = asyncWrapper(async (req, res) => {
  const userId = req.user.id
  const deletes = await deleteUserProfile(userId)
  res.json(deletes)
})
