import React, { useState } from 'react';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';

export function UploadArea({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Assuming backend is running on port 8000
      // We might need to proxy this in vite.config.js or just use absolute URL
      const response = await fetch('http://localhost:8000/collection/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onUploadSuccess(data);
    } catch (err) {
      console.error(err);
      setError('Failed to upload collection. Is the backend running?');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <div 
        style={{ 
          border: '2px dashed var(--border-color)', 
          borderRadius: '12px', 
          padding: '2rem',
          cursor: 'pointer',
          position: 'relative',
          transition: 'border-color 0.2s'
        }}
        onClick={() => document.getElementById('fileInput').click()}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
      >
        <input 
          type="file" 
          id="fileInput" 
          accept=".csv" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          {file ? (
            <>
              <FileText size={48} color="var(--primary)" />
              <div>
                <h3 style={{ margin: 0 }}>{file.name}</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </>
          ) : (
            <>
              <UploadCloud size={48} color="var(--text-muted)" />
              <div>
                <h3 style={{ margin: 0 }}>Drop your collection CSV here</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>Supports Moxfield exports</p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <p style={{ color: 'var(--status-fail)', marginTop: '1rem' }}>{error}</p>
      )}

      {file && (
        <button 
          className="primary" 
          style={{ marginTop: '2rem', minWidth: '200px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          onClick={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
               <Loader2 className="spin" size={20} /> Analyzing...
            </>
          ) : (
            "Analyze Collection"
          )}
        </button>
      )}
      
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
