import prisma from '../config/db.js'

export const createICP = async (req, res) => {
  try {
    const { id } = req.user
    console.log('Creating ICP for user ID:', id)
    const {
      profession,
      dreamClient,
      mainProblem,
      dreamOutcome,
      authorityStory,
    } = req.body

    if (
      !profession ||
      !dreamClient ||
      !mainProblem ||
      !dreamOutcome ||
      !authorityStory
    ) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const newICP = await prisma.ICP.create({
      data: {
        profession,
        dreamClient,
        mainProblem,
        dreamOutcome,
        authorityStory,
        user: { connect: { id: id } },
      },
    })

    res.status(201).json(newICP)
  } catch (error) {
    console.error('Error creating ICP:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const editICP = async (req, res) => {
  try {
    const { id } = req.user
    const {
      profession,
      dreamClient,
      mainProblem,
      dreamOutcome,
      authorityStory,
    } = req.body

    const updatedICP = await prisma.ICP.update({
      where: { userId: id },
      data: {
        profession,
        dreamClient,
        mainProblem,
        dreamOutcome,
        authorityStory,
      },
    })

    res.status(200).json(updatedICP)
  } catch (error) {
    console.error('Error updating ICP:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const getICP = async (req, res) => {
  try {
    const { id } = req.user
    const icp = await prisma.ICP.findUnique({
      where: { userId: id },
    })
    if (!icp) {
      return res.status(404).json({ message: 'ICP not found' })
    }
    res.status(200).json(icp)
  } catch (error) {
    console.error('Error fetching ICP:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
