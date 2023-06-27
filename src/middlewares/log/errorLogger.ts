import { NextFunction, Request, Response } from 'express'

const errorLogger = (req: Request, res: Response, next: NextFunction) => {
  console.error('Error occurred: ', req.method, req.path, req.params, req.query, req.body)
  next()
}

export { errorLogger }
