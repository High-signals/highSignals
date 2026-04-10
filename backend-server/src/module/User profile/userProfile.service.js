import AppError from './../../shared/service/appError.js'
import prisma from './../../config/db.js'

export async function getUserProfile(userId) {
	const userProfile = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			email: true,
			name: true,
			avatar: true,
			bio: true,
		},
	})

	if (!userProfile) {
		throw new AppError('User profile not found', 404)
	}

	return userProfile
}

export async function getContentPlatforms(userId) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
		},
	})
	const platforms = await prisma.connectedAccount.findMany({
		where: { userId: user.id },
		select: {
			twitterId: true,
			facebookId: true,
			linkedInId: true,
			tiktokId: true,
			instagramId: true,
		},
	})

	return platforms
}

export async function updateUserProfile(userId, profileData) {
	const updatedProfile = await prisma.user.update({
		where: { id: userId },
		data: {
			name: profileData.name,
			avatar: profileData.avatar,
			bio: profileData.bio,
		},
		select: {
			id: true,
			email: true,
			name: true,
			avatar: true,
			bio: true,
		},
	})

	if (!updatedProfile) {
		throw new AppError('Failed to update user profile', 500)
	}

	return updatedProfile
}

export async function editContentPlatforms(userId, platformData) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
		},
	})

	const updatedPlatforms = await prisma.connectedAccount.updateMany({
		where: { userId: user.id },
		data: {
			twitterId: platformData.twitterId,
			facebookId: platformData.facebookId,
			linkedInId: platformData.linkedInId,
			tiktokId: platformData.tiktokId,
			instagramId: platformData.instagramId,
		},
	})

	if (updatedPlatforms.count === 0) {
		throw new AppError('Failed to update content platforms', 500)
	}

	return { message: 'Content platforms updated successfully' }
}

export async function deleteUserProfile(userId) {
	await prisma.user.delete({
		where: { id: userId },
	})

	return { message: 'User profile deleted successfully' }
}
