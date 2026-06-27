import AppError from './../../shared/service/appError.js'
import prisma from './../../config/db.js'
import { supabase, AVATARS_BUCKET } from './../../config/supabase.js'

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

const EXT_FROM_MIME = {
	'image/jpeg': 'jpg',
	'image/jpg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'image/heic': 'heic',
	'image/heif': 'heif',
}

function extractStoragePath(publicUrl) {
	if (!publicUrl || typeof publicUrl !== 'string') return null
	// public URL shape: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
	const marker = `/storage/v1/object/public/${AVATARS_BUCKET}/`
	const idx = publicUrl.indexOf(marker)
	if (idx === -1) return null
	return publicUrl.slice(idx + marker.length)
}

export async function uploadUserAvatar(userId, file) {
	if (!file || !file.buffer) {
		throw new AppError('No file uploaded', 400)
	}
	const ext = EXT_FROM_MIME[file.mimetype]
	if (!ext) {
		throw new AppError('Unsupported image type', 400)
	}

	const existing = await prisma.user.findUnique({
		where: { id: userId },
		select: { avatar: true },
	})

	const objectPath = `${userId}/${Date.now()}.${ext}`

	const { error: uploadError } = await supabase.storage
		.from(AVATARS_BUCKET)
		.upload(objectPath, file.buffer, {
			contentType: file.mimetype,
			upsert: false,
		})

	if (uploadError) {
		throw new AppError(
			`Avatar upload failed: ${uploadError.message}`,
			500,
		)
	}

	const { data: publicUrlData } = supabase.storage
		.from(AVATARS_BUCKET)
		.getPublicUrl(objectPath)

	const publicUrl = publicUrlData?.publicUrl
	if (!publicUrl) {
		throw new AppError('Failed to resolve avatar URL', 500)
	}

	const updated = await prisma.user.update({
		where: { id: userId },
		data: { avatar: publicUrl },
		select: {
			id: true,
			email: true,
			name: true,
			avatar: true,
			bio: true,
		},
	})

	// Best-effort cleanup of the previous object so the bucket doesn't grow
	// forever. We do this after the DB update so a storage hiccup never
	// leaves the user with a broken avatar URL.
	const oldPath = extractStoragePath(existing?.avatar)
	if (oldPath && oldPath !== objectPath) {
		supabase.storage
			.from(AVATARS_BUCKET)
			.remove([oldPath])
			.catch(() => {})
	}

	return updated
}

export async function deleteUserAvatar(userId) {
	const existing = await prisma.user.findUnique({
		where: { id: userId },
		select: { avatar: true },
	})

	const oldPath = extractStoragePath(existing?.avatar)
	if (oldPath) {
		await supabase.storage
			.from(AVATARS_BUCKET)
			.remove([oldPath])
			.catch(() => {})
	}

	const updated = await prisma.user.update({
		where: { id: userId },
		data: { avatar: null },
		select: {
			id: true,
			email: true,
			name: true,
			avatar: true,
			bio: true,
		},
	})

	return updated
}
