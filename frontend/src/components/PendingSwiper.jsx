import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, X, ArrowUp, Link as LinkIcon, AlertCircle } from 'lucide-react';

export function SwipeCard({ card, onSwipe }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0); // For skip (up)

    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
    const opacityY = useTransform(y, [0, -200], [1, 0]); // Fade out when swiping up

    // Background feedback colors
    const borderColor = useTransform(x, [-150, 0, 150], ["#22c55e", "transparent", "#ef4444"]);
    const skipFeedback = useTransform(y, [0, -100], [0, 1]);

    const [exitDirection, setExitDirection] = useState(null);

    const handleDragEnd = (_, info) => {
        const { offset, velocity } = info;

        // Swipe Keep (Left per user request: "links dann keep")
        if (offset.x < -100 || velocity.x < -500) {
            setExitDirection({ x: -500, y: 0 });
            onSwipe('Keep');
        }
        // Swipe Fail (Right)
        else if (offset.x > 100 || velocity.x > 500) {
            setExitDirection({ x: 500, y: 0 });
            onSwipe('Fail');
        }
        // Swipe Skip (Up)
        else if (offset.y < -100 || velocity.y < -500) {
            setExitDirection({ x: 0, y: -500 });
            onSwipe('Pending'); // Keeping as Pending means Skip/Later
        }
    };

    const handleButtonClick = (decision) => {
        if (decision === 'Keep') setExitDirection({ x: -500, y: 0 });
        if (decision === 'Fail') setExitDirection({ x: 500, y: 0 });
        if (decision === 'Pending') setExitDirection({ x: 0, y: -500 });
        onSwipe(decision);
    };

    // Image Source
    // Backend provides card.image_uris.normal
    const imgSrc = card.image_uris?.normal || 'https://via.placeholder.com/300x420?text=No+Image';

    return (
        <motion.div
            style={{
                x, y,
                rotate,
                opacity: useTransform(y, [0, -200], [1, 0]), // Opacity controlled by Y too
                position: 'absolute',
                top: 0,
                zIndex: 100
            }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            // Lock drag axis roughly? No, free drag better for diagonal feel.
            onDragEnd={handleDragEnd}
            animate={exitDirection ? { x: exitDirection.x, y: exitDirection.y, opacity: 0 } : { x: 0, y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                className="glass-panel"
                style={{
                    width: '320px',
                    height: '520px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    border: '2px solid',
                    borderColor: borderColor, // visual feedback
                    background: '#0f172a',
                    position: 'relative'
                }}
            >
                {/* OVERLAY INDICATORS */}
                <div style={{ position: 'absolute', top: 20, left: 20, opacity: x.get() < -50 ? 1 : 0, transition: '0.2s' }}>
                    <span style={{ color: '#22c55e', fontSize: '2rem', fontWeight: 900, border: '4px solid #22c55e', padding: '5px 10px', transform: 'rotate(-15deg)' }}>KEEP</span>
                </div>
                <div style={{ position: 'absolute', top: 20, right: 20, opacity: x.get() > 50 ? 1 : 0, transition: '0.2s' }}>
                    <span style={{ color: '#ef4444', fontSize: '2rem', fontWeight: 900, border: '4px solid #ef4444', padding: '5px 10px', transform: 'rotate(15deg)' }}>FAIL</span>
                </div>
                <div style={{ position: 'absolute', bottom: 100, opacity: y.get() < -50 ? 1 : 0, transition: '0.2s' }}>
                    <span style={{ color: '#f59e0b', fontSize: '2rem', fontWeight: 900, border: '4px solid #f59e0b', padding: '5px 10px' }}>SKIP</span>
                </div>

                {/* HEADER */}
                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                    {card.name}
                </h3>

                {/* IMAGE */}
                <div style={{ width: '100%', height: '300px', display: 'flex', justifyContent: 'center', overflow: 'hidden', borderRadius: '8px', marginBottom: '1rem', background: '#000' }}>
                    <img
                        src={imgSrc}
                        alt={card.name}
                        style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
                        draggable={false}
                    />
                </div>

                {/* STATS */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <span>{card.set?.toUpperCase()}</span>
                    <span>#{card.edhrec_rank || 'N/A'} in {card.color_identity || 'C'}</span>
                </div>

                {/* BUTTONS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', width: '100%' }}>
                    <button
                        onClick={() => handleButtonClick('Keep')}
                        style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid #22c55e', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem' }}
                    >
                        <Check size={20} />
                        <span style={{ fontSize: '0.8rem' }}>KEEP</span>
                    </button>
                    <button
                        onClick={() => handleButtonClick('Pending')}
                        style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem' }}
                    >
                        <ArrowUp size={20} />
                        <span style={{ fontSize: '0.8rem' }}>SKIP</span>
                    </button>
                    <button
                        onClick={() => handleButtonClick('Fail')}
                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem' }}
                    >
                        <X size={20} />
                        <span style={{ fontSize: '0.8rem' }}>FAIL</span>
                    </button>
                </div>

            </motion.div>
        </motion.div>
    );
}

export function PendingSwiper({ cards, onResolve }) {
    const [index, setIndex] = useState(0);

    const handleSwipe = (decision) => {
        // If decision is 'Pending', we just skip it (keep it in Pending list).
        // If Keep/Fail, we categorize it.

        // UI Wait for animation
        setTimeout(() => {
            onResolve(cards[index], decision);
            setIndex(prev => prev + 1);
        }, 300);
    };

    if (index >= cards.length) {
        return (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', height: '520px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Check size={64} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
                <h3>All Pending Cards Reviewed!</h3>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', height: '540px', width: '100%', maxWidth: '350px', margin: '0 auto' }}>
            {/* Render only current and next for performance */}
            {[...cards].slice(index, index + 2).reverse().map((card, idx) => {
                const isTop = idx === 1; // Reverse means index 0 is bottom, index 1 is top (current)
                // Actually, map slice returns [Current, Next]. Reverse makes [Next, Current].
                // So last element is top.

                // Wait, simpler:
                // Key is critical. 
                // We render Current on top of Next.
                return (
                    <SwipeCard
                        key={card.name}
                        card={card}
                        onSwipe={handleSwipe}
                    // Disable interaction for the card below
                    />
                );
            })}
            {/* Simple placeholder if only 1 left */}
            {index + 1 >= cards.length && (
                <div className="glass-panel" style={{ width: '320px', height: '520px', position: 'absolute', top: 0, zIndex: -1, opacity: 0.3 }}></div>
            )}
        </div>
    );
}
