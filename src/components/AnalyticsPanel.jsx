import React, { useState, useEffect } from 'react';
import { format, isThisMonth, isThisYear, parseISO } from 'date-fns';
import { Calendar, Hash, FileCheck, Layers } from 'lucide-react';
import { getAll } from '../db/db';

const AnalyticsPanel = ({ refreshTrigger }) => {
    const [stats, setStats] = useState({
        total: 0,
        thisMonth: 0,
        thisYear: 0,
        nextId: 1
    });

    const currentDate = format(new Date(), 'EEEE, MMMM do, yyyy');

    useEffect(() => {
        const calculateStats = async () => {
            const wires = await getAll('canalWires');
            let tMonth = 0;
            let tYear = 0;
            let maxId = 0;

            wires.forEach(w => {
                const d = parseISO(w.createdAt);
                if (isThisMonth(d)) tMonth++;
                if (isThisYear(d)) tYear++;
                if (w.id > maxId) maxId = w.id;
            });

            setStats({
                total: wires.length,
                thisMonth: tMonth,
                thisYear: tYear,
                nextId: maxId + 1
            });
        };

        calculateStats();
    }, [refreshTrigger]);

    return (
        <div className="flex gap-4" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>

            {/* Date Card */}
            <div className="glass-panel items-center justify-between" style={{ padding: '1.25rem', flex: '1 1 200px', display: 'flex', gap: '1rem' }}>
                <div>
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Date</p>
                    <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{currentDate}</h4>
                </div>
                <div style={{ background: 'rgba(79, 70, 229, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                    <Calendar size={20} color="var(--primary)" />
                </div>
            </div>

            {/* Next ID Card */}
            <div className="glass-panel items-center justify-between" style={{ padding: '1.25rem', flex: '1 1 200px', display: 'flex', gap: '1rem' }}>
                <div>
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Wire No.</p>
                    <h4 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>#{stats.nextId}</h4>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                    <Hash size={20} color="var(--secondary)" />
                </div>
            </div>

            {/* Monthly Stats */}
            <div className="glass-panel items-center justify-between" style={{ padding: '1.25rem', flex: '1 1 200px', display: 'flex', gap: '1rem' }}>
                <div>
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Month</p>
                    <h4 style={{ fontSize: '1.5rem', margin: 0 }}>{stats.thisMonth}</h4>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                    <FileCheck size={20} color="var(--danger)" />
                </div>
            </div>

            {/* Yearly/Total Stats */}
            <div className="glass-panel items-center justify-between" style={{ padding: '1.25rem', flex: '1 1 200px', display: 'flex', gap: '1rem' }}>
                <div>
                    <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
                        <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Year:</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{stats.thisYear}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>All Time:</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{stats.total}</span>
                    </div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                    <Layers size={20} color="var(--text-main)" />
                </div>
            </div>

        </div>
    );
};

export default AnalyticsPanel;
