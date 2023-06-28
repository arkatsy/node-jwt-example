import express, { type Express, Request, Response, NextFunction } from 'express'
import path from 'path'
import dotenv from 'dotenv'
import pg from 'pg'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcrypt'
import z from 'zod'
import jwt from 'jsonwebtoken'

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

// TODO: Add error handling
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

    // Check if user exists
    pool.query('SELECT email FROM auth.users WHERE email = $1', [email], (error, results) => {
      if (error) {
        console.log('ERROR: An error has occured while checking if the user exists. ', error)
        res.send('Internal server error. Please try again later.')
      }

      if (results.rows.length === 0) {
        console.log('ERROR: User does not exist.')
        res.send('User does not exist.')
        return
      }

      // Validate password
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
            // Success authentication
            console.log(`SUCCESS: User ${email} has been authenticated.`)
            const ACCESS_TOKEN = jwt.sign({ email }, process.env.JWT_SECRET, {
              // 20 sec
              expiresIn: '20s',
            })

            const REFRESH_TOKEN = jwt.sign({ email }, process.env.JWT_SECRET, {
              // 7 days
              expiresIn: '7d',
            })

            res.cookie('access_token', ACCESS_TOKEN, {
              httpOnly: true,
              maxAge: 1000 * 20,
            })

            res.cookie('refresh_token', REFRESH_TOKEN, {
              httpOnly: true,
              maxAge: 1000 * 60 * 60 * 24 * 7,
            })

            // Add refresh token to database
            pool.query(
              'INSERT INTO auth.tokens (email, refresh_token) VALUES ($1, $2)',
              [email, REFRESH_TOKEN],
              (error, results) => {
                if (error) {
                  console.log(
                    'ERROR: An error has occured while inserting the refresh token into the database. ',
                    error
                  )
                  res.send('Internal server error. Please try again later.')
                }
                console.log('LOG:: Refresh token has been added to the database.')
                res.send('You have been authenticated.')
              }
            )

            // res.redirect('/dashboard')
          } else {
            // Failed authentication, (wrong password)
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
              // access token
              const ACCESS_TOKEN = jwt.sign({ email, username }, process.env.JWT_SECRET, {
                // 20 sec
                expiresIn: '20s',
              })
              console.log('access_token: ', ACCESS_TOKEN)

              const REFRESH_TOKEN = jwt.sign({ email, username }, process.env.JWT_SECRET, {
                // 7 days
                expiresIn: '7d',
              })
              console.log('refresh_token: ', REFRESH_TOKEN)

              // Store refresh token to the database
              pool.query(
                'INSERT INTO auth.tokens (refresh_token, email) VALUES ($1, $2)',
                [REFRESH_TOKEN, email],
                (error) => {
                  if (error) {
                    console.error(
                      'ERROR: An error has occured while storing the refresh token. ',
                      error
                    )
                  }
                  console.log('SUCCESS: Refresh token has been stored.')
                }
              )

              // Send access and refresh token as cookies
              res.cookie('access_token', ACCESS_TOKEN, {
                httpOnly: true,
                // 20 sec
                maxAge: 20 * 1000,
              })

              res.cookie('refresh_token', REFRESH_TOKEN, {
                httpOnly: true,
                // 7 days
                maxAge: 7 * 24 * 60 * 60 * 1000,
              })

              res.send('Account has been created, logged in')
            }
          )
        })
      }
    })
  })

app.get('/dashboard', (req: Request, res: Response, next: NextFunction) => {
  const access_token = req.cookies.access_token as string
  const refresh_token = req.cookies.refresh_token as string
  console.log('/dashboard hit test')
  console.log('access_token: ', access_token)
  console.log('refresh_token: ', refresh_token)

  if (!access_token && !refresh_token) {
    console.log('ERROR: No access token or refresh token found.')
    res.send('No access token or refresh token found.')
  }
  // In the case of only refresh token:
  // 1. Take the db's refresh_token and make sure it matches the one in the cookie.
  // 2. verify the incoming refresh token
  // 3. If it's valid, then create a new access token and send it back to the client.

  // If(access_token) then verify it
  if (access_token) {
    jwt.verify(access_token, process.env.JWT_SECRET, (err, decoded) => {
      console.log('decoded: ', decoded)
      if (err) {
        console.log('ERROR: Access token is not valid. ', err)
        res.setHeader('Content-Type', 'json/application')
        res.send('Access token is not valid.')
        // here should refresh the token
      }
      console.log('SUCCESS: Access token is valid.')
      console.log('decoded: ', decoded)
      res.set('Content-Type', 'text/html')
      res.sendFile(path.join(PUBLIC_PATH, 'html/dashboard.html'))
    })
  } else if (refresh_token) {
    // If(refresh_token) then verify it
    jwt.verify(refresh_token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log('ERROR: Refresh token is not valid. ', err)
        res.send('Refresh token is not valid.')
      }
      console.log('SUCCESS: Refresh token is valid.')
      console.log('decoded: ', decoded)

      // ----- TODO: Find a better way to do this
      if (!decoded) {
        console.log('ERROR: Decoded is not defined.')
        // Need to return to narrow the type of decoded
        return res.send('Decoded is not defined.')
      }

      if (typeof decoded === 'string') {
        console.log('ERROR: Decoded is a string.???')
        // Need to return to narrow the type of decoded
        return res.send('Decoded is a string.???')
      }
      // -----

      // Check if the refresh token is in the database
      pool.query(
        'SELECT refresh_token FROM auth.tokens WHERE refresh_token = $1',
        [refresh_token],
        (error, results) => {
          if (error) {
            console.log(
              'ERROR: An error has occured while checking if the refresh token is in the database. ',
              error
            )
            res.send('Internal server error. Please try again later.')
          }
          if (results.rows.length > 0) {
            console.log('SUCCESS: Refresh token is in the database.')
            // Generate new access token
            const ACCESS_TOKEN = jwt.sign({ email: decoded.email }, process.env.JWT_SECRET, {
              // 20 sec
              expiresIn: '20s',
            })
            console.log('access_token: ', ACCESS_TOKEN)

            // Send access token as cookie
            res.cookie('access_token', ACCESS_TOKEN, {
              httpOnly: true,
              // 20 sec
              maxAge: 20 * 1000,
            })
            res.setHeader('Content-Type', 'json/application')
            res.send('Access token has been refreshed.')
          } else {
            console.log('ERROR: Refresh token is not in the database.')
            res.send('Refresh token is not in the database.')
          }
        }
      )
    })
  }
})

// TODO: separate functions for db operations

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`))
