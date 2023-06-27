import { Request, Response } from 'express'

const getUsers = (req: Request, res: Response) => {
  res.send({
    users: [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Doe' },
      { id: 3, name: 'Josh Doe' },
    ],
  })
}

const getUser = (req: Request, res: Response) => {
  res.send({
    id: req.params.id,
  })
}

export { getUsers, getUser }
