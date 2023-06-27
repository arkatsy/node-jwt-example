import { Request, Response, NextFunction } from 'express'

const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log('Request logged:', req.method, req.path, req.params, req.query, req.body)
  next()
}

export { logger }
