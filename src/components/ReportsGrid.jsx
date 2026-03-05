import React, { useState, useEffect } from 'react';
import { getAll, remove } from '../db/db';
import { format } from 'date-fns';
import { Edit2, Trash2, Search, Filter, Printer } from 'lucide-react';

const ReportsGrid = ({ officials, activeOfficial, onEdit, onView, user }) => {
    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [authorFilter, setAuthorFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = newest first, 'asc' = oldest first
    const [selectedIds, setSelectedIds] = useState([]);

    const loadReports = async () => {
        let data = await getAll('canalWires');

        // Sort logic
        if (sortOrder === 'desc') {
            data.sort((a, b) => b.id - a.id);
        } else {
            data.sort((a, b) => a.id - b.id);
        }

        setReports(data);
    };

    useEffect(() => {
        loadReports();
    }, [sortOrder]);

    const handleDelete = async (id) => {
        if (window.confirm('Delete this Canal Wire?')) {
            await remove('canalWires', id);
            await loadReports();
        }
    };

    // Derived filtered data
    const filteredReports = reports.filter(r => {
        // Exact match for official if not 'all'
        if (activeOfficial !== 'all' && r.officialId !== activeOfficial) return false;

        // Search term matching content
        if (searchTerm && !r.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;

        // Optional Author Filter
        if (authorFilter && r.authorName !== authorFilter) return false;

        return true;
    });

    // Unique authors for the dropdown
    const uniqueAuthors = [...new Set(reports.map(r => r.authorName))];

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredReports.map(r => r.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (e, id) => {
        e.stopPropagation(); // don't trigger row click
        if (e.target.checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    };

    const handlePrintSelected = () => {
        if (selectedIds.length === 0) return;
        // The printing logic relies on hiding the app-wrapper and showing the hidden print-wrapper via CSS
        window.print();
    };

    return (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Grid Toolbar */}
            <div className="flex items-center justify-between no-print" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: 0 }}>Canal Wire Reports</h4>

                <div className="flex gap-4">
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 animate-fade" style={{ background: 'rgba(79, 70, 229, 0.15)', padding: '4px 12px', borderRadius: '8px', border: '1px solid var(--primary)' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'white' }}>{selectedIds.length} Selected</span>
                            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={handlePrintSelected}>
                                <Printer size={14} /> Print
                            </button>
                        </div>
                    )}
                    <div className="input-field flex items-center gap-2" style={{ width: '250px', padding: '8px 12px' }}>
                        <Search size={16} className="text-muted" />
                        <input
                            type="text"
                            placeholder="Search wires..."
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', width: '100%' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="input-field flex items-center gap-2" style={{ width: '200px', padding: '8px 12px' }}>
                        <Filter size={16} className="text-muted" />
                        <select
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', width: '100%' }}
                            value={authorFilter}
                            onChange={(e) => setAuthorFilter(e.target.value)}
                        >
                            <option value="" style={{ color: 'black' }}>All Operators</option>
                            {uniqueAuthors.map(a => (
                                <option key={a} value={a} style={{ color: 'black' }}>Op: {a}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-field flex items-center gap-2" style={{ width: '150px', padding: '8px 12px' }}>
                        <select
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', width: '100%' }}
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="desc" style={{ color: 'black' }}>Newest First</option>
                            <option value="asc" style={{ color: 'black' }}>Oldest First</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Grid Table Workspace */}
            <div className="no-print" style={{ flex: 1, overflowY: 'auto' }}>
                {filteredReports.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted">
                        No reports found for the selected criteria.
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px', textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={filteredReports.length > 0 && selectedIds.length === filteredReports.length}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </th>
                                <th style={{ width: '80px' }}>ID</th>
                                <th style={{ width: '150px' }}>Date</th>
                                <th>From Official</th>
                                <th>Excerpt</th>
                                <th style={{ width: '150px' }}>Created By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.map(report => {
                                const officialName = officials.find(o => o.id === report.officialId)?.name || 'Unknown';
                                const isSelected = selectedIds.includes(report.id);

                                return (
                                    <tr
                                        key={report.id}
                                        onClick={() => onView(report)}
                                        style={{ cursor: 'pointer', background: isSelected ? 'rgba(79, 70, 229, 0.1)' : '' }}
                                    >
                                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => handleSelectOne(e, report.id)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td><span className="badge">#{report.id}</span></td>
                                        <td>{format(new Date(report.createdAt), 'MMM dd, yyyy')}</td>
                                        <td style={{ fontWeight: 500 }}>{officialName}</td>
                                        <td className="text-muted">
                                            {report.content.substring(0, 60)}...
                                        </td>
                                        <td><span className="badge primary">{report.authorName}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* HIDDEN PRINT CONTAINER - Only visible during @media print */}
            <div className="print-only">
                {reports.filter(r => selectedIds.includes(r.id)).map(report => {
                    const officialName = officials.find(o => o.id === report.officialId)?.name || 'Unknown';
                    return (
                        <div key={`print-${report.id}`} style={{ pageBreakAfter: 'always', padding: '2cm', background: 'white', color: 'black', fontFamily: 'serif' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '1rem' }}>
                                <div>C.W No.<span style={{ marginLeft: '1rem', fontWeight: 'normal' }}>{String(report.id).padStart(2, '0')}</span></div>
                                <div>Dated:<span style={{ marginLeft: '1rem', fontWeight: 'normal' }}>{format(new Date(report.createdAt), 'dd-MMM-yyyy')}</span></div>
                            </div>

                            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '1rem' }}>
                                <div>
                                    <strong>From:</strong>
                                    <div style={{ paddingLeft: '40px', whiteSpace: 'pre-wrap', marginTop: '2px' }}>{officialName}</div>
                                </div>
                                {report.toText && (
                                    <div>
                                        <strong>To:</strong>
                                        <div style={{ paddingLeft: '40px', whiteSpace: 'pre-wrap', marginTop: '2px' }}>{report.toText}</div>
                                    </div>
                                )}
                                {report.copyText && (
                                    <div>
                                        <strong>Copy:</strong>
                                        <div style={{ paddingLeft: '40px', whiteSpace: 'pre-wrap', marginTop: '2px' }}>{report.copyText}</div>
                                    </div>
                                )}
                            </div>

                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '1rem', minHeight: '300px' }}>
                                {(() => {
                                    let text = report.content;
                                    if (text.includes('\n\n---\n')) {
                                        text = text.split('\n\n---\n')[0];
                                    }
                                    return text;
                                })()}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4rem', pageBreakInside: 'avoid' }}>
                                <div style={{ textAlign: 'center', fontSize: '1rem', minWidth: '250px' }}>
                                    {(() => {
                                        let sigText = '';
                                        if (report.content.includes('\n\n---\n')) {
                                            sigText = report.content.split('\n\n---\n')[1];
                                        }
                                        if (sigText) {
                                            return <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center' }}>---- Sd ----{'\n'}{sigText}</div>;
                                        } else {
                                            return (
                                                <>
                                                    <div style={{ borderBottom: '1px solid black', width: '200px', margin: '0 auto 8px auto' }}></div>
                                                    <strong>Signature</strong>
                                                </>
                                            );
                                        }
                                    })()}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ReportsGrid;
