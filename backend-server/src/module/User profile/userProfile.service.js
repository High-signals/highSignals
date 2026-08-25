import AppError from './../../shared/service/appError.js'
import prisma from './../../config/db.js'
import { s3, R2_AVATARS_BUCKET, R2_PUBLIC_URL } from './../../config/cloudflare.js'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export async function getUserProfile(userId) {
	const userProfile = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true, email: true, name: true, avatar: true, bio: true },
	})
	if (!userProfile) throw new AppError('User profile not found', 404)
	return userProfile
}

export async function getContentPlatforms(userId) {
	const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
	const platforms = await prisma.connectedAccount.findMany({
		where: { userId: user.id },
		select: { twitterId: true, facebookId: true, linkedInId: true, tiktokId: true, instagramId: true },
	})
	return platforms
}

export async function updateUserProfile(userId, profileData) {
	const updatedProfile = await prisma.user.update({
		where: { id: userId },
		data: { name: profileData.name, avatar: profileData.avatar, bio: profileData.bio },
		select: { id: true, email: true, name: true, avatar: true, bio: true },
	})
	if (!updatedProfile) throw new AppError('Failed to update user profile', 500)
	return updatedProfile
}

export async function editContentPlatforms(userId, platformData) {
	const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
	const updatedPlatforms = await prisma.connectedAccount.updateMany({
		where: { userId: user.id },
		data: { twitterId: platformData.twitterId, facebookId: platformData.facebookId, linkedInId: platformData.linkedInId, tiktokId: platformData.tiktokId, instagramId: platformData.instagramId },
	})
	if (updatedPlatforms.count === 0) throw new AppError('Failed to update content platforms', 500)
	return { message: 'Content platforms updated successfully' }
}

export async function deleteUserProfile(userId) {
	await prisma.user.delete({ where: { id: userId } })
	return { message: 'User profile deleted successfully' }
}

const EXT_FROM_MIME = {
	'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
	'image/webp': 'webp', 'image/gif': 'gif', 'image/heic': 'heic', 'image/heif': 'heif',
}

export async function uploadUserAvatar(userId, file) {
	if (!file || !file.buffer) throw new AppError('No file uploaded', 400)
	const ext = EXT_FROM_MIME[file.mimetype]
	if (!ext) throw new AppError('Unsupported image type', 400)

	const existing = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } })

	const objectKey = `avatar1/${userId}/${Date.now()}.${ext}`

	try {
		await s3.send(new PutObjectCommand({
			Bucket: R2_AVATARS_BUCKET,
			Key: objectKey,
			Body: file.buffer,
			ContentType: file.mimetype,
		}))
	} catch (err) {
		throw new AppError(`Avatar upload failed: ${err.message}`, 500)
	}

	const publicUrl = `${R2_PUBLIC_URL}/${objectKey}`

	const updated = await prisma.user.update({
		where: { id: userId },
		data: { avatar: publicUrl },
		select: { id: true, email: true, name: true, avatar: true, bio: true },
	})

	if (existing?.avatar && existing.avatar.includes(R2_PUBLIC_URL)) {
		const oldKey = existing.avatar.replace(`${R2_PUBLIC_URL}/`, '')
		if (oldKey !== objectKey) {
			s3.send(new DeleteObjectCommand({ Bucket: R2_AVATARS_BUCKET, Key: oldKey })).catch(() => {})
		}
	}

	return updated
}

export async function deleteUserAvatar(userId) {
	const existing = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } })

	if (existing?.avatar && existing.avatar.includes(R2_PUBLIC_URL)) {
		const oldKey = existing.avatar.replace(`${R2_PUBLIC_URL}/`, '')
		await s3.send(new DeleteObjectCommand({ Bucket: R2_AVATARS_BUCKET, Key: oldKey })).catch(() => {})
	}

	const updated = await prisma.user.update({
		where: { id: userId },
		data: { avatar: null },
		select: { id: true, email: true, name: true, avatar: true, bio: true },
	})

	return updated
}
