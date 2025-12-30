import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { UploadArea } from './components/UploadArea';
import { Dashboard } from './components/Dashboard';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);

  return (
    <div className="App">
      {/* Navbar */}
      <nav style={{
        padding: '1.5rem 2rem',
        borderBottom: '1px solid var(--glass-border)',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="container" style={{ padding: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            padding: '8px',
            borderRadius: '8px',
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)'
          }}>
            <Layers color="white" size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: 0, background: 'linear-gradient(to right, white, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            EDHKeep
          </h1>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        {!analysisResult ? (
          <section style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', lineHeight: 1.1 }}>
              Optimize Your <span style={{ color: 'var(--primary)' }}>Collection</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 4rem auto' }}>
              Upload your card list and let our algorithm separate the staples from the bulk using real EDHRec data.
            </p>

            <UploadArea onUploadSuccess={setAnalysisResult} />
          </section>
        ) : (
          <Dashboard data={analysisResult} onReset={() => setAnalysisResult(null)} />
        )}
      </main>
    </div>
  );
}

export default App;
