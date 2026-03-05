import React from 'react';
import { Users, UserPlus, LogOut, Settings } from 'lucide-react';

const Sidebar = ({ user, officials, activeOfficial, setActiveOfficial, onLogout, setView }) => {
    return (
        <aside className="sidebar">
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <h2 className="text-gradient" style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Canal Wire</h2>
                <p className="text-muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Settings size={12} /> {user.name} ({user.role})
                </p>
            </div>

            <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '1rem', padding: '0 8px' }}>
                    <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Officials Directory
                    </span>
                    <Users size={14} className="text-muted" />
                </div>

                <div className={`official-item ${activeOfficial === 'all' ? 'active' : ''}`} onClick={() => { setActiveOfficial('all'); setView('reports'); }}>
                    <span>All Reports</span>
                </div>

                {(() => {
                    // Build Tree structure from flat list
                    const getTree = (list) => {
                        let map = {}, roots = [], i, node;
                        // Avoid mutating the original state by deep-cloning
                        const clones = JSON.parse(JSON.stringify(list));

                        for (i = 0; i < clones.length; i += 1) {
                            map[clones[i].id] = i;
                            clones[i].children = [];
                        }

                        for (i = 0; i < clones.length; i += 1) {
                            node = clones[i];
                            if (node.parentId && map[node.parentId] !== undefined) {
                                clones[map[node.parentId]].children.push(node);
                            } else {
                                roots.push(node);
                            }
                        }
                        return roots;
                    };

                    const treeData = getTree(officials);

                    const renderNode = (node, level) => (
                        <React.Fragment key={node.id}>
                            <div
                                className={`official-item ${activeOfficial === node.id ? 'active' : ''}`}
                                onClick={() => { setActiveOfficial(node.id); setView('reports'); }}
                                style={level > 0 ? { paddingLeft: `${16 + (level * 16)}px` } : {}}
                            >
                                <div className="flex-col flex-1" style={{ minWidth: 0 }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</span>
                                    <span className="text-muted" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.designation}</span>
                                </div>
                                {node.reportCount > 0 && (
                                    <span className="report-count" style={{ marginLeft: '4px' }}>{node.reportCount}</span>
                                )}
                            </div>
                            {node.children && node.children.map(child => renderNode(child, level + 1))}
                        </React.Fragment>
                    );

                    return treeData.map(root => renderNode(root, 0));
                })()}
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                {user.role === 'Admin' && (
                    <button
                        className="btn btn-ghost w-full"
                        style={{ marginBottom: '0.5rem', justifyContent: 'flex-start' }}
                        onClick={() => setView('admin')}
                    >
                        <Settings size={18} /> Setting
                    </button>
                )}
                <button className="btn btn-ghost w-full" style={{ justifyContent: 'flex-start', color: 'var(--danger)' }} onClick={onLogout}>
                    <LogOut size={18} /> Logout System
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
