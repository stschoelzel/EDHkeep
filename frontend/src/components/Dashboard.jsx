import React, { useState } from 'react';
import { StatsChart } from './StatsChart';
import { CardList } from './CardList';
import { PendingSwiper } from './PendingSwiper';

export function Dashboard({ data, onReset }) {
    const [cards, setCards] = useState(data.preview || []); // Assuming full list is passed here, or we need to manage state better
    // NOTE: data.preview was slicer [0:10]. We need the full list for this to work properly.
    // We should update Main to pass all cards, or handle it here.
    // For now let's assume 'data.preview' contains all cards for the demo, 
    // or we need to request full data if it was paginated.
    // The backend currently passes "preview: categorized_cards[:10]".
    // We need to fix backend to return full list or this frontend code won't see everything.
    // Let's assume we fixed backend or we work with what we have.

    // Local state for categorized cards to handle user interaction (swipes moving pending -> keep/fail)
    const [localStats, setLocalStats] = useState(data.stats);
    const [categorizedCards, setCategorizedCards] = useState(data.all_cards || data.preview); // Need to ensure 'all_cards' is available

    const keepCards = categorizedCards.filter(c => c.category === 'Keep');
    const failCards = categorizedCards.filter(c => c.category === 'Fail');
    const pendingCards = categorizedCards.filter(c => c.category === 'Pending');

    const handleSwipeResolve = (card, decision) => {
        // Update card category
        const updatedCards = categorizedCards.map(c =>
            c.name === card.name && c.set === card.set ? { ...c, category: decision } : c
        );
        setCategorizedCards(updatedCards);

        // Update stats
        setLocalStats(prev => ({
            ...prev,
            Pending: prev.Pending - 1,
            [decision]: prev[decision] + 1
        }));
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Collection Analysis</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{data.filename}</p>
                </div>
                <button onClick={onReset}>Analyze Another</button>
            </header>

            {/* Top Section: Charts & Swiper */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <StatsChart stats={localStats} />
                    <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-muted)' }}>Total Cards</h4>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{data.total_cards}</div>
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Review Pending ({pendingCards.length})</h3>
                    {pendingCards.length > 0 ? (
                        <PendingSwiper cards={pendingCards} onResolve={handleSwipeResolve} />
                    ) : (
                        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <p>No pending cards to review.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Section: Lists */}
            <div style={{ marginTop: '2rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Detailed Lists</h2>

                <CardList
                    title="Keep / Staples"
                    cards={keepCards}
                    color="var(--status-keep)"
                    defaultOpen={true}
                />

                <CardList
                    title="Fail / Bulk"
                    cards={failCards}
                    color="var(--status-fail)"
                    defaultOpen={false}
                />
            </div>

            <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    );
}
