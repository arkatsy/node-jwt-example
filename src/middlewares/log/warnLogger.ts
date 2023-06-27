import { Request, Response, NextFunction } from 'express'

const warnLogger = (req: Request, res: Response, next: NextFunction) => {
  console.warn('Warning occurred: ', req.method, req.path, req.params, req.query, req.body)
  next()
}

export { warnLogger }
