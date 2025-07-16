import { useState } from 'react';

export default function TranscriptViewer({ management, qa }) {
  const [activeTab, setActiveTab] = useState('management');

  return (
    <div className="transcript-viewer">
      <div className="tabs">
        <button 
          className={activeTab === 'management' ? 'active' : ''}
          onClick={() => setActiveTab('management')}
        >
          Management Remarks
        </button>
        <button 
          className={activeTab === 'qa' ? 'active' : ''}
          onClick={() => setActiveTab('qa')}
        >
          Q&A Session
        </button>
      </div>

      <div className="transcript-content">
        {activeTab === 'management' ? (
          <>
            <div className="sentiment-summary">
              <strong>Sentiment:</strong> {management.label} (Score: {management.score.toFixed(2)})
            </div>
            <h3>Key Phrases:</h3>
            <ul>
              {management.key_phrases.map((phrase, i) => (
                <li key={i}>{phrase}</li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <div className="sentiment-summary">
              <strong>Sentiment:</strong> {qa.label} (Score: {qa.score.toFixed(2)})
            </div>
            <h3>Key Phrases:</h3>
            <ul>
              {qa.key_phrases.map((phrase, i) => (
                <li key={i}>{phrase}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}