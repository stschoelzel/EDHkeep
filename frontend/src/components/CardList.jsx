import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { ExportPanel } from './ExportPanel';

export function CardList({ title, cards, color, defaultOpen = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (!cards || cards.length === 0) return null;

    const sortedCards = [...cards].sort((a, b) => {
        const colorA = a.color_identity || 'Z';
        const colorB = b.color_identity || 'Z';
        if (colorA < colorB) return -1;
        if (colorA > colorB) return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="glass-panel" style={{ marginBottom: '1rem', overflow: 'hidden' }}>
            <div
                style={{
                    padding: '1rem 1.5rem',
                    background: `${color}15`,
                    borderBottom: isOpen ? '1px solid var(--glass-border)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}
                >
                    {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <h3 style={{ margin: 0, color }}>{title} ({cards.length})</h3>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                    <ExportPanel cards={sortedCards} />
                </div>
            </div>

            {isOpen && (
                <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '0.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <tbody>
                            {sortedCards.map((card, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ fontWeight: 500, fontSize: '1rem' }}>{card.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
                                            <span>{card.set?.toUpperCase()}</span>
                                            <span>{card.color_identity ? `Colors: ${card.color_identity}` : ''}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold' }}>
                                            {card.edhrec_rank ? `#${card.edhrec_rank}` : '-'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EDHRec Rank</div>
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', minWidth: '80px' }}>
                                        {card.inclusion_rate ? (
                                            <div style={{ color: 'var(--text-main)' }}>{card.inclusion_rate.toLocaleString()} decks</div>
                                        ) : <span>-</span>}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                            <a
                                                href={card.edhrec_url || `https://edhrec.com/cards/${card.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="EDHRec"
                                                style={{ color: '#2563eb' }}
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                            <a
                                                href={`https://scryfall.com/search?q=${encodeURIComponent(card.name)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="Scryfall"
                                                style={{ color: '#d97706' }}
                                            >
                                                <img src="https://scryfall.com/favicon.ico" alt="Scryfall" width="16" height="16" style={{ filter: 'grayscale(100%) brightness(1.5)' }} />
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
