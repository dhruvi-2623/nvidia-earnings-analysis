import { Router } from 'express'
import analyzeAll from './analyze.mjs'

const router = new Router()

router.get('/', async (req, res) => {
  try {
    const data = await analyzeAll()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
