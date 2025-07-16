// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import SentimentChart from './components/SentimentChart';
import ThemeHighlights from './components/ThemeHighlights';
import ComparisonTable from './components/ComparisonTable';
import TranscriptViewer from './components/TranscriptViewer';

export default function Home() {
  const [quarters, setQuarters] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load quarter data
        const quarterFiles = ['Q2_2025', 'Q3_2025', 'Q4_2025', 'Q1_2026'];
        const quarterData = [];
        
        for (const q of quarterFiles) {
          try {
            const res = await fetch(`/data/${q}.json`);
            if (!res.ok) throw new Error(`Failed to load ${q}.json: ${res.status}`);
            const data = await res.json();
            quarterData.push(data);
          } catch (err) {
            console.error(`Error loading ${q}.json:`, err);
            // Create placeholder data for missing files
            quarterData.push({
              quarter: q,
              management: {
                label: "Data Missing",
                score: 0,
                key_phrases: ["Data file not found"]
              },
              qa: {
                label: "Data Missing",
                score: 0,
                key_phrases: ["Data file not found"]
              },
              themes: ["Data not available"]
            });
          }
        }
        
        setQuarters(quarterData);
        
        // Set initial selected quarter to most recent
        setSelectedQuarter(quarterData[quarterData.length - 1]);
        
        // Load comparison data
        try {
          const compRes = await fetch('/data/comparison.json');
          if (compRes.ok) {
            const compData = await compRes.json();
            setComparison(compData);
          }
        } catch (err) {
          console.error('Error loading comparison data:', err);
        }
        
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Failed to load analysis data. Please check the console for details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="loading">
        <p>Loading NVIDIA earnings analysis...</p>
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <p>Please check:</p>
        <ul>
          <li>JSON files exist in public/data/ directory</li>
          <li>Files are named correctly (Q2_2025.json, etc.)</li>
          <li>Analysis script was run successfully</li>
        </ul>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <div className="logo-container">
          <div className="nvidia-logo">NVIDIA</div>
        </div>
        <h1>Earnings Call Analysis</h1>
        <p>AI-powered insights from the last four quarters</p>
      </header>

      <main>
        <section className="chart-section">
          <h2>Sentiment Analysis</h2>
          <div className="chart-container">
            <SentimentChart data={quarters} />
          </div>
        </section>

        <section className="comparison-section">
          <h2>Quarter-over-Quarter Changes</h2>
          <ComparisonTable data={comparison} />
        </section>

        <div className="quarter-selector">
          <h2>Select Quarter</h2>
          <div className="buttons">
            {quarters.map(q => (
              <button 
                key={q.quarter} 
                onClick={() => setSelectedQuarter(q)}
                className={selectedQuarter?.quarter === q.quarter ? 'active' : ''}
              >
                {q.quarter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {selectedQuarter && (
          <>
            <section className="themes-section">
              <h2>Key Themes: {selectedQuarter.quarter.replace('_', ' ')}</h2>
              <ThemeHighlights themes={selectedQuarter.themes} />
            </section>

            <section className="transcript-section">
              <h2>Transcript Highlights</h2>
              <TranscriptViewer 
                management={selectedQuarter.management} 
                qa={selectedQuarter.qa} 
              />
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <p>Data powered by Gemini AI • Last updated {new Date().toLocaleDateString()}</p>
      </footer>
    </div>
  );
}