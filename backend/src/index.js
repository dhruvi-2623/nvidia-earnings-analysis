// backend/src/index.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import scriptsRouter from './scripts/routes.js'   // you’ll create this

dotenv.config()

const app = express()
app.use(cors(), express.json())

app.use('/api/scripts', scriptsRouter)  
// → scriptsRouter should live at backend/src/scripts/routes.js

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`🚀 Backend listening on http://localhost:${PORT}`))
