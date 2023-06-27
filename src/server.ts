import express, { type Express, Request, Response, NextFunction } from 'express'
import path from 'path'
import dotenv from 'dotenv'
import pg from 'pg'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcrypt'
import z from 'zod'

dotenv.config()
const envs = z.object({
  PORT: z.string().optional(),
  DB_HOST: z.string(),
  DB_PORT: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_DATABASE: z.string(),
  JWT_SECRET: z.string(),
})

envs.parse(process.env)

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envs> {}
  }
}

const PORT = Number(process.env.PORT) || 3000

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  max: 20,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
})

const PUBLIC_PATH = path.join(path.dirname(__dirname), 'public')

const app: Express = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// serve static files
app.use(express.static(PUBLIC_PATH))

app.get('/', (req: Request, res: Response) => {
  console.log('LOG:: GET /')
  console.log('LOG:: COOKIES: ', req.cookies)
  res.set('Content-Type', 'text/html')
  res.sendFile(path.join(PUBLIC_PATH, 'html/index.html'))
})

// Login / Register example with jwt
app
  .get('/login', (req: Request, res: Response) => {
    console.log('LOG:: GET /login')
    res.set('Content-Type', 'text/html')
    res.sendFile(path.join(PUBLIC_PATH, 'html/login.html'))
  })
  .post('/login', (req: Request, res: Response) => {
    console.log('POST /login')
    const { email, password } = req.body

    pool.query('SELECT email FROM auth.users WHERE email = $1', [email], (error, results) => {
      if (error) {
        console.log('ERROR: An error has occured while checking if the user exists. ', error)
        res.send('Internal server error. Please try again later.')
      }

      if (results.rows.length === 0) {
        console.log('ERROR: User does not exist.')
        res.send('User does not exist.')
      }

      pool.query('SELECT password FROM auth.users WHERE email = $1', [email], (error, results) => {
        if (error) {
          console.log(
            'ERROR: An error has occured while checking if the user is authenticated.',
            error
          )
          res.send('Internal server error. Please try again later.')
        }
        bcrypt.compare(password, results.rows[0].password, (err, result) => {
          if (err) {
            console.log('ERROR: An error has occured while comparing the passwords. ', err)
            res.send('Internal server error. Please try again later.')
          }

          if (result) {
            console.log(`SUCCESS: User ${email} has been authenticated.`)
            // TODO: implement jwt
            res.redirect('/dashboard')
          } else {
            console.log('ERROR: Wrong password.')
            res.send('Invalid credentials. Please try again.')
          }
        })
      })
    })
  })

app
  .get('/register', (req: Request, res: Response) => {
    console.log('GET /register')
    res.set('Content-Type', 'text/html')
    res.sendFile(path.join(PUBLIC_PATH, 'html/register.html'))
  })
  .post('/register', (req: Request, res: Response) => {
    console.log('POST /register')
    const { email, username, password } = req.body

    pool.query('SELECT email FROM auth.users WHERE email = $1', [email], (error, results) => {
      if (error) {
        console.error(
          'ERROR: An error has occured while checking if the user is authenticated. ',
          error
        )
        res.send('Internal server error. Please try again later.')
      }
      if (results.rows.length > 0) {
        console.log('ERROR: User already exists.')
        res.send('User already exists.')
      } else {
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) {
            console.error('ERROR: An error has occured while hashing the password. ', err)
            res.send('Internal server error. Please try again later.')
          }

          pool.query(
            'INSERT INTO auth.users (email, username, password) VALUES ($1, $2, $3)',
            [email, username, hash],
            (error) => {
              if (error) {
                console.error('ERROR: An error has occured while creating the user. ', error)
              }
              console.log(`SUCCESS: Account for user ${email} has been created.`)
              // TODO: implement jwt
              res.redirect('/dashboard')
            }
          )
        })
      }
    })
  })

app.get(
  '/dashboard',
  (req: Request, res: Response, next: NextFunction) => {
    // TODO: validate jwt
    next()
  },
  (req: Request, res: Response) => {
    console.log('GET /dashboard')
    res.set('Content-Type', 'text/html')
    res.sendFile(path.join(PUBLIC_PATH, 'html/dashboard.html'))
  }
)

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`))
