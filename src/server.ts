import express, { type Express, Request, Response } from 'express'
import * as routes from './routes'
import * as middlewares from './middlewares'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()
const PUBLIC_PATH = path.join(path.dirname(__dirname), 'public')
const PORT = process.env.PORT || 3000

const app: Express = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// serve static files
app.use(express.static(PUBLIC_PATH))

app.get('/', (req: Request, res: Response) => {
  console.log('GET /')
  res.set('Content-Type', 'text/html')
  res.sendFile(path.join(PUBLIC_PATH, 'html/index.html'))
})

// Login / Register example with jwt
app
  .get('/login', (req: Request, res: Response) => {
    console.log('GET /login')
    res.set('Content-Type', 'text/html')
    res.sendFile(path.join(PUBLIC_PATH, 'html/login.html'))
  })
  .post('/login', (req: Request, res: Response) => {
    console.log('POST /login')
    console.log('USER DATA', req.body)
    res.send('ok')
  })

app
  .get('/register', (req: Request, res: Response) => {
    console.log('GET /register')
    res.set('Content-Type', 'text/html')
    res.sendFile(path.join(PUBLIC_PATH, 'html/register.html'))
  })
  .post('/register', (req: Request, res: Response) => {
    console.log('POST /register')
    console.log('USER DATA', req.body)
    res.send('ok')
  })

// Routes example with different folder structure
app.use('/api', middlewares.requireAuth)
app.use('/api', middlewares.logger)

app.use('/api', routes.usersRoutes)
app.use('/api', routes.productsRoutes)

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`))
