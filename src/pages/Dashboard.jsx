import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AdminPanel from '../components/AdminPanel';
import CanalWireEditor from '../components/CanalWireEditor';
import ReportsGrid from '../components/ReportsGrid';
import AnalyticsPanel from '../components/AnalyticsPanel';
import ReportViewer from '../components/ReportViewer';
import { getAll } from '../db/db';
import { PenTool, FileText, LayoutDashboard } from 'lucide-react';

const Dashboard = ({ user, onLogout }) => {
    const [officials, setOfficials] = useState([]);
    const [activeOfficial, setActiveOfficial] = useState('all');
    const [view, setView] = useState('reports'); // 'reports', 'editor', 'admin', 'viewer'
    const [editingId, setEditingId] = useState(null);
    const [viewingReport, setViewingReport] = useState(null);
    const [editorKey, setEditorKey] = useState(0);

    const loadData = async () => {
        try {
            const allOfficials = await getAll('officials');
            const allReports = await getAll('canalWires');

            const counts = {};
            allReports.forEach(r => {
                counts[r.officialId] = (counts[r.officialId] || 0) + 1;
            });

            const officialsWithCounts = allOfficials.map(o => ({
                ...o,
                reportCount: counts[o.id] || 0
            }));

            setOfficials(officialsWithCounts);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadData();
    }, [view]);

    return (
        <div className="app-container animate-fade">
            <Sidebar
                user={user}
                officials={officials}
                activeOfficial={activeOfficial}
                setActiveOfficial={setActiveOfficial}
                onLogout={onLogout}
                setView={setView}
            />

            <main className="main-content">
                <header className="main-header flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {view === 'reports' && <><LayoutDashboard size={20} className="text-gradient" /> <h3 style={{ margin: 0 }}>Workspace</h3></>}
                        {view === 'editor' && <><PenTool size={20} className="text-gradient" /> <h3 style={{ margin: 0 }}>Wire Editor</h3></>}
                        {view === 'admin' && <><FileText size={20} className="text-gradient" /> <h3 style={{ margin: 0 }}>Management</h3></>}
                        {view === 'viewer' && <><FileText size={20} className="text-gradient" /> <h3 style={{ margin: 0 }}>Document Viewer</h3></>}
                    </div>

                    <div className="flex gap-2">
                        {view === 'reports' && (
                            <button className="btn btn-primary" onClick={() => { setEditingId(null); setEditorKey(prev => prev + 1); setView('editor'); }}>
                                <PenTool size={16} /> Draft New Wire
                            </button>
                        )}
                        {view !== 'reports' && (
                            <button className="btn btn-ghost" onClick={() => { setView('reports'); loadData(); }}>
                                Return to Workspace
                            </button>
                        )}
                    </div>
                </header>

                <div className="main-scroll-area">
                    {view === 'reports' && (
                        <>
                            <AnalyticsPanel refreshTrigger={officials} />
                            <ReportsGrid
                                officials={officials}
                                activeOfficial={activeOfficial}
                                user={user}
                                onEdit={(id) => { setEditingId(id); setView('editor'); }}
                                onView={(report) => { setViewingReport(report); setView('viewer'); }}
                            />
                        </>
                    )}

                    {view === 'viewer' && (
                        <div style={{ height: '100%' }}>
                            <ReportViewer
                                report={viewingReport}
                                officialName={officials.find(o => o.id === viewingReport.officialId)?.name || 'Unknown'}
                                onBack={() => { setViewingReport(null); setView('reports'); }}
                                user={user}
                                onEdit={(id) => {
                                    setEditingId(id);
                                    setViewingReport(null);
                                    setView('editor');
                                }}
                                onDelete={(id) => {
                                    // To simulate the delete action from the dashboard wrapper
                                    if (window.confirm('Delete this Canal Wire?')) {
                                        import('../db/db').then(({ remove }) => {
                                            remove('canalWires', id).then(() => {
                                                setViewingReport(null);
                                                setView('reports');
                                                loadData();
                                            });
                                        });
                                    }
                                }}
                            />
                        </div>
                    )}

                    {view === 'editor' && (
                        <div style={{ height: '100%' }}>
                            <CanalWireEditor
                                key={`editor-${editorKey}`}
                                user={user}
                                officials={officials}
                                editingWire={editingId ? { id: editingId } : null}
                                onSaveComplete={() => { loadData(); setEditorKey(prev => prev + 1); }}
                            />
                        </div>
                    )}

                    {view === 'admin' && user.role === 'Admin' && (
                        <div style={{ height: '100%' }}>
                            <AdminPanel
                                onOfficialUpdate={loadData}
                                onEditReport={(id) => { setEditingId(id); setView('editor'); }}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
