import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

// Simple .env file loader
async function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const data = await fs.readFile(envPath, 'utf8');
    const lines = data.split('\n');
    
    for (const line of lines) {
      if (line.trim() === '' || line.startsWith('#')) continue;
      const [key, ...value] = line.split('=');
      if (key) {
        process.env[key.trim()] = value.join('=').trim();
      }
    }
  } catch (error) {
    console.log('No .env file found. Using system environment variables.');
  }
}

await loadEnv();

// Configuration
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error('Missing GEMINI_API_KEY. Create a .env file with your key');
const rawDir = path.resolve(process.cwd(), 'scripts/raw');
const outDir = path.resolve(process.cwd(), 'public/data');
await fs.mkdir(outDir, { recursive: true });

// Quarters in chronological order (oldest first)
const quarters = ['Q2_2025', 'Q3_2025', 'Q4_2025', 'Q1_2026'];
const results = [];

// Function to split transcript into sections
function splitTranscript(text) {
  const markers = [
    "Question-and-Answer Session",
    "Q&A Session",
    "Question and Answer Session",
    "QUESTIONS AND ANSWERS"
  ];
  
  for (const marker of markers) {
    const qaIndex = text.indexOf(marker);
    if (qaIndex !== -1) {
      return {
        preparedRemarks: text.slice(0, qaIndex).trim(),
        qa: text.slice(qaIndex + marker.length).trim()
      };
    }
  }
  
  // Fallback: Use 70/30 split if marker not found
  const splitIndex = Math.floor(text.length * 0.7);
  return {
    preparedRemarks: text.slice(0, splitIndex),
    qa: text.slice(splitIndex)
  };
}

// Function to analyze text with Gemini
async function analyzeText(text, sectionType) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  
  const prompt = `
Analyze the ${sectionType} section from an NVIDIA earnings call transcript.
Return JSON exactly like:
{
  "label": "Positive|Neutral|Negative",
  "score": -1.0 to 1.0,
  "key_phrases": ["short phrase 1", "short phrase 2", ...]
}

Rules:
1. Score: -1.0 (most negative) to 1.0 (most positive)
2. Provide 3-5 key phrases capturing important topics
3. Focus on business strategy, financial performance, and market outlook

Text:
${text.slice(0, 12000)}  // First 12k chars
`.trim();

  try {
    const res = await axios.post(url, {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Extract response text
    const responseText = res.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!responseText) throw new Error('Empty response from Gemini');
    
    // Parse JSON from response (might have markdown code block)
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Invalid JSON response');
    }
    
    const jsonString = responseText.slice(jsonStart, jsonEnd);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error(`Error analyzing ${sectionType}:`, error.message);
    return {
      label: "Neutral",
      score: 0,
      key_phrases: ["Analysis failed"]
    };
  }
}

// Main processing loop
for (const quarter of quarters) {
  try {
    console.log(`Processing ${quarter}...`);
    
    // Read transcript
    const filePath = path.join(rawDir, `${quarter}.txt`);
    const transcript = await fs.readFile(filePath, 'utf8');
    
    // Split into sections
    const { preparedRemarks, qa } = splitTranscript(transcript);
    
    // Analyze sections
    const [management, qaAnalysis] = await Promise.all([
      analyzeText(preparedRemarks, "Management Remarks"),
      analyzeText(qa, "Q&A Session")
    ]);
    
    // Extract themes (combine key phrases from both sections)
    const allPhrases = [
      ...(management.key_phrases || []),
      ...(qaAnalysis.key_phrases || [])
    ];
    
    // Count phrase frequency and get top 5
    const phraseCount = {};
    allPhrases.forEach(phrase => {
      if (phrase) {
        phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
      }
    });
    
    const themes = Object.entries(phraseCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phrase]) => phrase);
    
    // Save results
    const quarterData = {
      quarter,
      management,
      qa: qaAnalysis,
      themes
    };
    
    await fs.writeFile(
      path.join(outDir, `${quarter}.json`),
      JSON.stringify(quarterData, null, 2)
    );
    
    results.push(quarterData);
    console.log(`✅ ${quarter} analysis complete`);
    
    // Add delay to avoid rate limiting (1 request/sec)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
  } catch (error) {
    console.error(`❌ Error processing ${quarter}:`, error.message);
  }
}

// Generate quarter-over-quarter comparison
if (results.length > 1) {
  const comparison = [];
  
  for (let i = 1; i < results.length; i++) {
    const current = results[i];
    const previous = results[i-1];
    
    comparison.push({
      quarter: current.quarter,
      managementChange: current.management.score - previous.management.score,
      qaChange: current.qa.score - previous.qa.score,
      newThemes: current.themes.filter(theme => 
        !previous.themes.includes(theme)
      )
    });
  }
  
  await fs.writeFile(
    path.join(outDir, 'comparison.json'),
    JSON.stringify(comparison, null, 2)
  );
  console.log('✅ Quarter-over-quarter comparison generated');
}

console.log('Analysis complete!');