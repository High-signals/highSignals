import asyncWrapper from '../../shared/service/asyncHandler.js'
import { sendFeedbackEmail } from '../../shared/service/sendFeedbackEmail.js'
import {
	getUserProfile,
	updateUserProfile,
	deleteUserProfile,
	uploadUserAvatar,
	deleteUserAvatar,
} from './userProfile.service.js'

export const getUserProfileController = asyncWrapper(async (req, res) => {
	const userId = req.user.id
	const userProfile = await getUserProfile(userId)

	res.json(userProfile)
})

export const getContentPlatformsController = asyncWrapper(async (req, res) => {
	const userId = req.user.id
	const platforms = await getContentPlatforms(userId)
	res.json(platforms)
})

export const editContentPlatformsController = asyncWrapper(async (req, res) => {
	const userId = req.user.id
	const { twitterId, facebookId, linkedInId, tiktokId, instagramId } =
		req.body
	const updatedPlatforms = await editContentPlatforms(userId, {
		twitterId,
		facebookId,
		linkedInId,
		tiktokId,
		instagramId,
	})
	res.json(updatedPlatforms)
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

export const uploadAvatarController = asyncWrapper(async (req, res) => {
	const userId = req.user.id
	const updated = await uploadUserAvatar(userId, req.file)
	res.json(updated)
})

export const deleteAvatarController = asyncWrapper(async (req, res) => {
	const userId = req.user.id
	const updated = await deleteUserAvatar(userId)
	res.json(updated)
})

export const submitFeedbackController = asyncWrapper(async (req, res) => {
	const { name, email, feedback } = req.body
	if (!name || !email || !feedback) {
		return res.status(400).json({ message: 'Name, email, and feedback are required.' })
	}
	const result = await sendFeedbackEmail(name, email, feedback)
	if (!result.success) {
		return res.status(500).json({ message: result.error || 'Failed to send feedback' })
	}
	res.json({ message: 'Feedback sent successfully' })
})
