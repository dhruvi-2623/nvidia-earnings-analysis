// backend/src/scripts/analyze.mjs
import fs from 'fs/promises'
import path from 'path'
import axios from 'axios'

// loadEnv: read .env (if present) and populate process.env
async function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env')
    const data = await fs.readFile(envPath, 'utf8')
    const lines = data.split('\n')
    for (const line of lines) {
      if (!line.trim() || line.startsWith('#')) continue
      const [key, ...vals] = line.split('=')
      process.env[key.trim()] = vals.join('=').trim()
    }
  } catch {
    console.log('No .env file found. Using system environment variables.')
  }
}

// splitTranscript: cut transcript into prepared remarks and Q&A
function splitTranscript(text) {
  const markers = [
    "Question-and-Answer Session",
    "Q&A Session",
    "Question and Answer Session",
    "QUESTIONS AND ANSWERS"
  ]
  for (const marker of markers) {
    const idx = text.indexOf(marker)
    if (idx !== -1) {
      return {
        preparedRemarks: text.slice(0, idx).trim(),
        qa: text.slice(idx + marker.length).trim()
      }
    }
  }
  // fallback 70/30 split
  const splitIndex = Math.floor(text.length * 0.7)
  return {
    preparedRemarks: text.slice(0, splitIndex),
    qa: text.slice(splitIndex)
  }
}

// analyzeText: send section to Gemini API, parse JSON response
async function analyzeText(text, sectionType) {
  const API_KEY = process.env.GEMINI_API_KEY
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`
  const prompt = `
Analyze the ${sectionType} section from an NVIDIA earnings call transcript.
Return JSON exactly like:
{
  "label": "Positive|Neutral|Negative",
  "score": -1.0 to 1.0,
  "key_phrases": ["phrase1", "phrase2", ...]
}
Text:
${text.slice(0, 12000)}
`.trim()

  try {
    const res = await axios.post(url, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
    }, { headers: { 'Content-Type': 'application/json' } })

    const responseText = res.data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const start = responseText.indexOf('{')
    const end = responseText.lastIndexOf('}') + 1
    return JSON.parse(responseText.slice(start, end))
  } catch (err) {
    console.error(`Error analyzing ${sectionType}:`, err.message)
    return { label: "Neutral", score: 0, key_phrases: ["Analysis failed"] }
  }
}

// analyzeAll: main flow – load env, loop quarters, run analysis, write JSON
async function analyzeAll() {
  await loadEnv()
  if (!process.env.GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY')

  const rawDir = path.resolve(process.cwd(), 'scripts/raw')
  const outDir = path.resolve(process.cwd(), 'public/data')
  await fs.mkdir(outDir, { recursive: true })

  const quarters = ['Q2_2025', 'Q3_2025', 'Q4_2025', 'Q1_2026']
  const results = []

  for (const quarter of quarters) {
    try {
      const transcript = await fs.readFile(path.join(rawDir, `${quarter}.txt`), 'utf8')
      const { preparedRemarks, qa } = splitTranscript(transcript)
      const [management, qaAnalysis] = await Promise.all([
        analyzeText(preparedRemarks, "Management Remarks"),
        analyzeText(qa, "Q&A Session")
      ])

      // aggregate themes
      const allPhrases = [...management.key_phrases, ...qaAnalysis.key_phrases]
      const count = {}
      allPhrases.forEach(p => { if (p) count[p] = (count[p]||0) + 1 })
      const themes = Object.entries(count)
        .sort((a,b)=>b[1]-a[1]).slice(0,5).map(([t])=>t)

      const data = { quarter, management, qa: qaAnalysis, themes }
      await fs.writeFile(path.join(outDir, `${quarter}.json`), JSON.stringify(data, null, 2))
      results.push(data)
      await new Promise(r => setTimeout(r, 1500))
    } catch (e) {
      console.error(`Error in ${quarter}:`, e.message)
    }
  }

  // compute quarter-over-quarter comparison
  if (results.length > 1) {
    const comp = results.slice(1).map((curr, i) => {
      const prev = results[i]
      return {
        quarter: curr.quarter,
        managementChange: curr.management.score - prev.management.score,
        qaChange: curr.qa.score - prev.qa.score,
        newThemes: curr.themes.filter(t => !prev.themes.includes(t))
      }
    })
    await fs.writeFile(path.join(outDir, 'comparison.json'), JSON.stringify(comp, null, 2))
  }

  return results
}

export default analyzeAll
