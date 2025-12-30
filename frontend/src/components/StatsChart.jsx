import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
    Keep: '#22c55e',   // Green 500
    Pending: '#f59e0b',// Amber 500
    Fail: '#ef4444'    // Red 500
};

export function StatsChart({ stats }) {
    const data = [
        { name: 'Keep', value: stats.Keep },
        { name: 'Pending', value: stats.Pending },
        { name: 'Fail', value: stats.Fail },
    ].filter(d => d.value > 0);

    return (
        <div className="glass-panel" style={{ padding: '1rem', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Composition</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }}
                        itemStyle={{ color: '#f8fafc' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
