# NVIDIA Earnings Call Analysis

![App Screenshot](/screenshot.png)

AI-powered application that analyzes NVIDIA's earnings call transcripts to extract key insights.

## Features

- Management sentiment analysis
- Q&A sentiment analysis
- Quarter-over-quarter tone change tracking
- Strategic focus extraction
- Interactive data visualization

## Live Demo

[View Live Demo](https://your-vercel-app.vercel.app)

## How to Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/nvidia-earnings-analysis.git
   cd nvidia-earnings-analysis
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. Place earnings call transcripts in `scripts/raw/` as:
   - `Q2_2025.txt`
   - `Q3_2025.txt`
   - `Q4_2025.txt`
   - `Q1_2026.txt`

5. Run the analysis script:
   ```bash
   node scripts/analyze.mjs
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Technologies Used

- Next.js (React framework)
- Gemini AI for NLP analysis
- Chart.js for data visualization
- Axios for HTTP requests

## Assumptions & Limitations

- Transcripts are manually placed in the raw directory
- Only the first 12,000 characters of each section are analyzed
- Q&A section detection relies on common header patterns
- Sentiment scores are relative (-1 to 1 scale)

## Future Improvements

- Automated transcript scraping
- Multi-company support
- Historical trend analysis
- Sentiment phrase highlighting
