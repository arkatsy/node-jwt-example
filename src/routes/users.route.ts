import { NextFunction, Request, Response, Router } from 'express'
import * as middlewares from '../middlewares'

const router = Router()

router.use('/users', middlewares.warnLogger)

router.get('/users/:id', (req: Request, res: Response, next: NextFunction) => {
  res.send({
    id: req.params.id,
  })
})

router.route('/users').get((req: Request, res: Response, next: NextFunction) => {
  res.send({
    users: [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Doe' },
      { id: 3, name: 'Josh Doe' },
    ],
  })
})

export { router as usersRoutes }
