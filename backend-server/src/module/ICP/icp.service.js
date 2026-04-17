import AppError from './../../shared/service/appError.js'
import prisma from '../../config/db.js'

export async function createICPService(userId, data) {
	const user = await prisma.user.findUnique({ where: { id: userId } })
	if (!user) {
		throw new AppError('User not found', 404)
	}

	const {
		type,
		audienceDescription,
		painPoint,
		desiredOutcome,
		motivation,
		contentTopic,
		backstory,
		goal,
		demographics,
		additional,
	} = data

	const newICP = await prisma.ICP.create({
		data: {
			type,
			audienceDescription,
			painPoint,
			desiredOutcome,
			motivation,
			contentTopic,
			backstory,
			goal,
			demographics,
			additional,
			userId,
		},
	})

	return newICP
}
