import React, { useState, useEffect } from 'react';
import { add, update, getById } from '../db/db';
import { Save } from 'lucide-react';
import { format } from 'date-fns';

const CanalWireEditor = ({ user, officials, onSaveComplete, editingWire }) => {
    const [formData, setFormData] = useState({
        id: null,
        officialId: '',
        toText: '',
        copyText: '',
        content: ''
    });
    const [saveStatus, setSaveStatus] = useState('');

    // Auto-load editing wire or reset to blank
    useEffect(() => {
        const loadWire = async () => {
            if (editingWire && editingWire.id) {
                // If it only has an ID, fetch the full record from DB
                if (!editingWire.content) {
                    const record = await getById('canalWires', editingWire.id);
                    if (record) setFormData(record);
                } else {
                    setFormData(editingWire);
                }
            } else {
                setFormData({
                    id: null,
                    officialId: '',
                    toText: '',
                    copyText: '',
                    content: ''
                });
            }
        };
        loadWire();
    }, [editingWire]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handeOfficialChange = (e) => {
        const offId = Number(e.target.value);
        const official = officials.find(o => o.id === offId);
        let newContent = formData.content;

        // Auto append signature if selected
        if (official && official.signatureText) {
            const sigToAppend = `\n\n---\n${official.signatureText}`;
            if (!newContent.includes(sigToAppend)) {
                newContent = newContent + sigToAppend;
            }
        }

        setFormData({ ...formData, officialId: offId, content: newContent });
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        console.log("Publish Wire Clicked. Current Form Data:", formData);

        if (!formData.officialId || !formData.content) {
            console.warn("Validation failed: officialId or content is missing.");
            setSaveStatus('Please select From and enter Content.');
            setTimeout(() => setSaveStatus(''), 3000);
            return;
        }

        setSaveStatus('Saving to Database...');
        const record = {
            ...formData,
            officialId: Number(formData.officialId),
            authorId: user.id,
            authorName: user.name,
            updatedAt: new Date().toISOString(),
            status: 'Saved'
        };

        if (!record.createdAt) {
            record.createdAt = new Date().toISOString();
        }

        try {
            console.log("Preparing to save record:", record);
            if (record.id) {
                console.log("Updating existing record ID:", record.id);
                await update('canalWires', record);
                console.log("Update complete.");
            } else {
                delete record.id;
                console.log("Inserting new record...", record);
                const newId = await add('canalWires', record);
                console.log("Insert complete, new ID:", newId);
            }

            console.log("Resetting form data and notifying UI.");
            setFormData({ id: null, officialId: '', toText: '', copyText: '', content: '' });
            setSaveStatus('Successfully Saved!');

            setTimeout(() => {
                setSaveStatus('');
                if (editingWire && editingWire.id) {
                    onSaveComplete();
                } else {
                    // For new drafts, just force the reset via empty state
                    onSaveComplete();
                }
            }, 1200);
        } catch (error) {
            console.error("Database save error:", error);
            setSaveStatus('Error saving data. Check console.');
        }
    };

    return (
        <div className="glass-panel flex-col gap-4" style={{ padding: '1.5rem', height: '100%' }}>

            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                <div className="flex items-center gap-4">
                    <h4 style={{ margin: 0 }}>{editingWire ? 'Edit Canal Wire' : 'Draft New Canal Wire'}</h4>
                    {editingWire && formData.id && (
                        <div className="flex items-center gap-2">
                            <span className="badge">No: {String(formData.id).padStart(4, '0')}</span>
                            <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                                Date: {formData.createdAt ? format(new Date(formData.createdAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                            </span>
                        </div>
                    )}
                </div>
                {saveStatus && <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{saveStatus}</span>}
            </div>

            <div className="flex-col gap-4 flex-1">
                <div className="form-group flex items-center gap-4">
                    <label style={{ margin: 0, minWidth: '60px' }}>From:</label>
                    <select
                        name="officialId"
                        value={formData.officialId}
                        onChange={handeOfficialChange}
                        className="input-field"
                        style={{ flex: 1 }}
                    >
                        <option value="">-- Select Official --</option>
                        {officials.map(o => (
                            <option key={o.id} value={o.id}>{o.name} ({o.designation})</option>
                        ))}
                    </select>
                </div>

                <div className="form-group flex items-center gap-4">
                    <label style={{ margin: 0, minWidth: '60px' }}>To:</label>
                    <select
                        name="toText"
                        value={formData.toText}
                        onChange={handleChange}
                        className="input-field"
                        style={{ flex: 1 }}
                    >
                        <option value="">-- Select Recipient --</option>
                        {officials.map(o => (
                            <option key={o.id} value={`${o.name} (${o.designation})`}>
                                {o.name} ({o.designation})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group flex items-start gap-4">
                    <label style={{ margin: 0, minWidth: '60px', marginTop: '8px' }}>Copy:</label>
                    <div className="input-field flex-col" style={{ flex: 1, maxHeight: '120px', overflowY: 'auto', padding: '8px', gap: '4px', background: 'rgba(255, 255, 255, 0.05)' }}>
                        {officials.map(o => {
                            const optionValue = `${o.name} (${o.designation})`;
                            const isChecked = (formData.copyText || '').split('\n').includes(optionValue);
                            return (
                                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                            let currentCopies = formData.copyText ? formData.copyText.split('\n') : [];
                                            if (isChecked) {
                                                currentCopies = currentCopies.filter(c => c !== optionValue);
                                            } else {
                                                currentCopies.push(optionValue);
                                            }
                                            setFormData({ ...formData, copyText: currentCopies.join('\n') });
                                        }}
                                    />
                                    {o.name} <span className="text-muted" style={{ fontSize: '0.8rem' }}>({o.designation})</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label>Canal Wire Content</label>
                    <textarea
                        name="content"
                        className="input-field"
                        style={{ flex: 1, resize: 'none', lineHeight: '1.5' }}
                        value={formData.content}
                        onChange={handleChange}
                        placeholder="Type your canal wire details here..."
                    ></textarea>
                </div>

                <div className="flex justify-end gap-2" style={{ marginTop: 'auto' }}>
                    <button type="button" onClick={handleSubmit} className="btn btn-primary">
                        <Save size={18} /> Publish Wire
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CanalWireEditor;
