import React, { useState, useEffect } from 'react';
import { getAll, add, update, remove, restoreDatabase } from '../db/db';
import { Plus, Edit2, Trash2, Users, UserCog, Check, X, FileText, Download, Upload } from 'lucide-react';
import { format } from 'date-fns';

const AdminPanel = ({ onOfficialUpdate, onEditReport }) => {
    const [activeTab, setActiveTab] = useState('officials'); // 'officials' | 'users' | 'reports'

    // Officials State
    const [officials, setOfficials] = useState([]);
    const [officialFormData, setOfficialFormData] = useState({ id: null, name: '', designation: '', signatureText: '', parentId: null });
    const [isEditingOfficial, setIsEditingOfficial] = useState(false);

    // Users State
    const [users, setUsers] = useState([]);
    const [userFormData, setUserFormData] = useState({ name: '', pin: '' });

    // Reports State
    const [reports, setReports] = useState([]);

    // File Upload Ref
    const fileInputRef = React.useRef(null);

    const loadData = async () => {
        const dataO = await getAll('officials');
        setOfficials(dataO);
        const dataU = await getAll('users');
        setUsers(dataU);
        let dataR = await getAll('canalWires');
        dataR.sort((a, b) => b.id - a.id);
        setReports(dataR);
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    // --- OFFICIALS LOGIC ---
    const handleOfficialChange = (e) => setOfficialFormData({ ...officialFormData, [e.target.name]: e.target.value });

    const handleOfficialSave = async (e) => {
        e.preventDefault();
        if (isEditingOfficial) {
            await update('officials', officialFormData);
        } else {
            const { id, ...newOfficial } = officialFormData;
            await add('officials', newOfficial);
        }
        setOfficialFormData({ id: null, name: '', designation: '', signatureText: '', parentId: null });
        setIsEditingOfficial(false);
        await loadData();
        onOfficialUpdate();
    };

    const handleOfficialEdit = (off) => { setOfficialFormData(off); setIsEditingOfficial(true); };

    const handleOfficialDelete = async (id) => {
        if (window.confirm('Delete official?')) {
            await remove('officials', id);
            await loadData();
            onOfficialUpdate();
        }
    };

    // --- USERS LOGIC ---
    const handleUserChange = (e) => setUserFormData({ ...userFormData, [e.target.name]: e.target.value });

    const handleUserSave = async (e) => {
        e.preventDefault();
        if (!userFormData.name || !userFormData.pin) return;

        await add('users', {
            ...userFormData,
            role: 'Operator',
            canEdit: false,
            canDelete: false
        });

        setUserFormData({ name: '', pin: '' });
        await loadData();
    };

    const handleUserDelete = async (id) => {
        if (window.confirm('Delete this user?')) {
            await remove('users', id);
            await loadData();
        }
    };

    const toggleUserPermission = async (user, field) => {
        const updatedUser = { ...user, [field]: !user[field] };
        await update('users', updatedUser);
        await loadData();
    };

    // --- REPORTS LOGIC ---
    const handleReportDelete = async (id) => {
        if (window.confirm('Are you sure you want to permanently delete this report?')) {
            await remove('canalWires', id);
            await loadData();
        }
    };

    // --- BACKUP LOGIC ---
    const handleBackupData = () => {
        const backupData = {
            officials,
            users,
            canalWires: reports,
            exportedAt: new Date().toISOString()
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');

        const a = document.createElement('a');
        a.href = url;
        a.download = `Canal_Wires_Backup_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleRestoreData = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);
                if (jsonData.officials && jsonData.users && jsonData.canalWires) {
                    if (window.confirm("WARNING: This will overwrite EVERYTHING currently in the system with the backup file data. Are you sure you want to proceed?")) {
                        await restoreDatabase(jsonData);
                        await loadData();
                        alert("Database restored successfully!");
                    }
                } else {
                    alert("Invalid backup file format.");
                }
            } catch (err) {
                console.error("Failed to parse JSON backup:", err);
                alert("Failed to read the backup file. It may be corrupted.");
            }
        };
        reader.readAsText(file);

        // Reset input so the exact same file can be selected again if needed
        e.target.value = null;
    };

    return (
        <div className="flex-col gap-4" style={{ height: '100%' }}>

            {/* Tabs Menu */}
            <div className="flex gap-4" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <button
                    className={`btn ${activeTab === 'officials' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('officials')}
                ><Users size={16} /> Manage Officials</button>

                <button
                    className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('users')}
                ><UserCog size={16} /> Manage Operators</button>

                <button
                    className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('reports')}
                ><FileText size={16} /> Manage Reports</button>

                <button
                    className={`btn ${activeTab === 'backup' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('backup')}
                ><Download size={16} /> Backup Data</button>
            </div>

            {/* OFFICIALS VIEW */}
            {activeTab === 'officials' && (
                <div className="flex gap-4 flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                    <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', alignSelf: 'flex-start' }}>
                        <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isEditingOfficial ? <Edit2 size={18} /> : <Plus size={18} />}
                            {isEditingOfficial ? 'Edit Official' : 'Add New Official'}
                        </h4>

                        <form onSubmit={handleOfficialSave} className="flex-col gap-4">
                            <div className="form-group">
                                <label>Parent Category / Reports To</label>
                                <select
                                    className="input-field"
                                    value={officialFormData.parentId || ''}
                                    onChange={(e) => setOfficialFormData({ ...officialFormData, parentId: e.target.value ? Number(e.target.value) : null })}
                                >
                                    <option value="">-- None (Top Level) --</option>
                                    {officials.filter(o => o.id !== officialFormData.id).map(o => (
                                        <option key={o.id} value={o.id}>{o.name} ({o.designation})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input required type="text" name="name" className="input-field" value={officialFormData.name} onChange={handleOfficialChange} />
                            </div>
                            <div className="form-group">
                                <label>Designation</label>
                                <input required type="text" name="designation" className="input-field" value={officialFormData.designation} onChange={handleOfficialChange} />
                            </div>
                            <div className="form-group">
                                <label>Signature Text</label>
                                <textarea required name="signatureText" className="input-field" rows="4" value={officialFormData.signatureText} onChange={handleOfficialChange}></textarea>
                            </div>
                            <div className="flex gap-2" style={{ marginTop: '0.5rem' }}>
                                <button type="submit" className="btn btn-primary flex" style={{ flex: 1 }}>{isEditingOfficial ? 'Update' : 'Save'}</button>
                                {isEditingOfficial && <button type="button" className="btn btn-ghost" onClick={() => { setIsEditingOfficial(false); setOfficialFormData({ id: null, name: '', designation: '', signatureText: '', parentId: null }) }}>Cancel</button>}
                            </div>
                        </form>
                    </div>

                    <div className="glass-panel" style={{ flex: '1.5', padding: '1rem', overflowY: 'auto' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Officials Roster</h4>
                        <div className="flex-col gap-2">
                            {officials.map(off => (
                                <div key={off.id} className="flex items-center justify-between" style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{off.name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                            {off.designation}
                                            {off.parentId && officials.find(o => o.id === off.parentId) && ` • Under: ${officials.find(o => o.id === off.parentId).name}`}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => handleOfficialEdit(off)}><Edit2 size={16} className="text-primary" /></button>
                                        <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => handleOfficialDelete(off.id)}><Trash2 size={16} className="text-danger" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* USERS / PERMISSIONS VIEW */}
            {activeTab === 'users' && (
                <div className="flex gap-4 flex-1 overflow-hidden" style={{ minHeight: 0 }}>

                    {/* ADD NEW USER FORM */}
                    <div className="glass-panel" style={{ flex: '1', padding: '1.5rem', alignSelf: 'flex-start' }}>
                        <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UserCog size={18} /> Add New Operator
                        </h4>

                        <form onSubmit={handleUserSave} className="flex-col gap-4">
                            <div className="form-group">
                                <label>Operator Name</label>
                                <input required type="text" name="name" className="input-field" value={userFormData.name} onChange={handleUserChange} placeholder="e.g., Operator 2" />
                            </div>
                            <div className="form-group">
                                <label>PIN Code</label>
                                <input required type="text" name="pin" className="input-field" value={userFormData.pin} onChange={handleUserChange} placeholder="e.g., 5678" />
                            </div>
                            <div style={{ marginTop: '0.5rem' }}>
                                <button type="submit" className="btn btn-primary w-full">Create Operator</button>
                            </div>
                            <small className="text-muted" style={{ display: 'block', marginTop: '8px' }}>New operators will have 'Edit' and 'Delete' rights denied by default.</small>
                        </form>
                    </div>

                    {/* USERS TABLE */}
                    <div className="glass-panel" style={{ flex: '2', padding: '1.5rem', overflowY: 'auto' }}>
                        <h4 style={{ marginBottom: '1.5rem' }}>Operator Permissions</h4>
                        <table className="data-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>System User</th>
                                    <th>Role</th>
                                    <th style={{ textAlign: 'center' }}>Can Edit</th>
                                    <th style={{ textAlign: 'center' }}>Can Delete</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td style={{ fontWeight: 500 }}>{u.name}</td>
                                        <td><span className={`badge ${u.role === 'Admin' ? 'primary' : ''}`}>{u.role}</span></td>
                                        <td style={{ textAlign: 'center' }}>
                                            {u.role === 'Admin' ? (
                                                <span className="text-muted">Always</span>
                                            ) : (
                                                <button
                                                    className={`btn ${u.canEdit ? 'btn-primary' : 'btn-ghost'}`}
                                                    style={{ padding: '4px 8px', minWidth: '80px' }}
                                                    onClick={() => toggleUserPermission(u, 'canEdit')}
                                                >
                                                    {u.canEdit ? <Check size={14} /> : <X size={14} />} {u.canEdit ? 'Allowed' : 'Denied'}
                                                </button>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {u.role === 'Admin' ? (
                                                <span className="text-muted">Always</span>
                                            ) : (
                                                <button
                                                    className={`btn ${u.canDelete ? 'btn-danger' : 'btn-ghost'}`}
                                                    style={{ padding: '4px 8px', minWidth: '80px' }}
                                                    onClick={() => toggleUserPermission(u, 'canDelete')}
                                                >
                                                    {u.canDelete ? <Check size={14} /> : <X size={14} />} {u.canDelete ? 'Allowed' : 'Denied'}
                                                </button>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {u.role !== 'Admin' && (
                                                <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => handleUserDelete(u.id)}>
                                                    <Trash2 size={16} className="text-danger" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* REPORTS VIEW */}
            {activeTab === 'reports' && (
                <div className="flex-col gap-4 flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                    <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
                        <h4 style={{ marginBottom: '1.5rem' }}>All Canal Wires Register (Admin Access)</h4>

                        <table className="data-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '80px' }}>ID</th>
                                    <th>Date</th>
                                    <th>Excerpt</th>
                                    <th>Author</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.length === 0 && (
                                    <tr><td colSpan="5" className="text-center text-muted">No reports found.</td></tr>
                                )}
                                {reports.map(r => (
                                    <tr key={r.id}>
                                        <td><span className="badge">#{r.id}</span></td>
                                        <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                                        <td className="text-muted">{r.content.substring(0, 50)}...</td>
                                        <td><span className="badge primary">{r.authorName}</span></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="flex justify-end gap-2">
                                                <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => onEditReport(r.id)} title="Edit Report">
                                                    <Edit2 size={16} className="text-primary" />
                                                </button>
                                                <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => handleReportDelete(r.id)} title="Delete Report">
                                                    <Trash2 size={16} className="text-danger" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* BACKUP VIEW */}
            {activeTab === 'backup' && (
                <div className="flex gap-8 flex-1 overflow-hidden p-6" style={{ minHeight: 0 }}>
                    {/* DOWNLOAD BACKUP WIDGET */}
                    <div className="glass-panel flex-col items-center justify-center p-8" style={{ flex: 1, textAlign: 'center', height: 'fit-content' }}>
                        <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '1.5rem' }}>
                            <Download size={48} className="text-secondary" />
                        </div>
                        <h3 style={{ marginBottom: '1rem' }}>Download Backup</h3>
                        <p className="text-muted" style={{ maxWidth: '400px', marginBottom: '2rem', lineHeight: '1.6' }}>
                            Download a complete JSON snapshot of all Officials, Operators, and Reports. Keep this safe!
                        </p>
                        <button className="btn btn-secondary flex gap-2 w-full max-w-sm" style={{ padding: '12px 24px', fontSize: '1.1rem' }} onClick={handleBackupData}>
                            <Download size={20} /> Download Complete Backup
                        </button>
                    </div>

                    {/* RESTORE BACKUP WIDGET */}
                    <div className="glass-panel flex-col items-center justify-center p-8" style={{ flex: 1, textAlign: 'center', height: 'fit-content' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '1.5rem' }}>
                            <Upload size={48} className="text-primary" />
                        </div>
                        <h3 style={{ marginBottom: '1rem' }}>Restore Backup</h3>
                        <p className="text-muted" style={{ maxWidth: '400px', marginBottom: '2rem', lineHeight: '1.6' }}>
                            Upload a previously saved Canal Wire JSON backup. <br /><strong className="text-danger">Warning:</strong> This will instantly overwrite all current data.
                        </p>

                        <input
                            type="file"
                            accept=".json"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />

                        <button className="btn btn-primary flex gap-2 w-full max-w-sm" style={{ padding: '12px 24px', fontSize: '1.1rem' }} onClick={handleRestoreData}>
                            <Upload size={20} /> Upload Backup File
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
