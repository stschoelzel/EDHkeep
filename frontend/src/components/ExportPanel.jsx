import React, { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';

export function ExportPanel({ cards }) {
    const [format, setFormat] = useState('moxfield');
    const [isOpen, setIsOpen] = useState(false);

    const handleExport = (listType) => {
        // Filter cards based on button click (Keep, Fail, or specific)
        // Actually, normally you export a specific filtered list.
        // Let's assume 'cards' passed here is the "Keep" list or "Fail" list.

        if (cards.length === 0) {
            alert("Nothing to export!");
            return;
        }

        // Convert to CSV string (Simple Frontend generation for now to avoid roundtrip)
        // OR call backend. 
        // Backend is better for robust formatting.

        const csvContent = generateCSV(cards, format);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `edhkeep_export_${format}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Frontend CSV Generator (mirroring backend logic for speed/demo)
    const generateCSV = (data, fmt) => {
        let headers = [];
        let rows = [];

        if (fmt === 'moxfield') {
            headers = ["Count", "Name", "Edition", "Condition", "Language", "Tag", "Collector Number"];
            rows = data.map(c => [
                "1",
                `"${c.name}"`, // Quote names with commas
                c.set || 'UNK',
                "Near Mint",
                "English",
                c.category,
                c.collector_number || "0"
            ]);
        } else if (fmt === 'dragonshield') {
            headers = ["Card Name", "Set Code", "Quantity", "Card Number"];
            rows = data.map(c => [
                `"${c.name}"`,
                c.set || 'UNK',
                "1",
                c.collector_number || "0"
            ]);
        } else if (fmt === 'manabox') {
            headers = ["Name", "Set Code", "Quantity", "Collector Number"];
            rows = data.map(c => [
                `"${c.name}"`,
                c.set || 'UNK',
                "1",
                c.collector_number || "0"
            ]);
        }

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    };

    return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
                className="primary"
                onClick={() => handleExport()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            >
                <Download size={16} /> Export ({format})
            </button>

            <div style={{ position: 'relative' }}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ padding: '0.5rem', background: 'var(--bg-surface)' }}
                >
                    <ChevronDown size={16} />
                </button>

                {isOpen && (
                    <div className="glass-panel" style={{ position: 'absolute', right: 0, top: '100%', width: '150px', zIndex: 50, overflow: 'hidden', padding: 0 }}>
                        {['moxfield', 'dragonshield', 'manabox'].map(f => (
                            <div
                                key={f}
                                onClick={() => { setFormat(f); setIsOpen(false); }}
                                style={{ padding: '0.75rem', cursor: 'pointer', background: format === f ? 'var(--primary)' : 'transparent' }}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
