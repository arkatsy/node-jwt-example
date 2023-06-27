import { NextFunction, Request, Response, Router } from 'express'
import * as middlewares from '../middlewares'

const router = Router()

router.use('products/', middlewares.errorLogger)

router.route('/products').get((req: Request, res: Response, next: NextFunction) => {
  res.send({
    products: [
      { id: 1, name: 'Product 1' },
      { id: 2, name: 'Product 2' },
      { id: 3, name: 'Product 3' },
    ],
  })
})

router.route('/products/:id').get((req: Request, res: Response, next: NextFunction) => {
  res.send({
    id: req.params.id,
  })
})

export { router as productsRoutes }
