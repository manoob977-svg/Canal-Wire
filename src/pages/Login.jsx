import React, { useState, useEffect } from 'react';
import { getAll } from '../db/db';
import { Shield, User, Lock, ArrowRight } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const loadUsers = async () => {
            const allUsers = await getAll('users');
            setUsers(allUsers);
        };
        loadUsers();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!selectedUser) {
            setError('Please select a user');
            return;
        }

        const userRecord = users.find(u => u.id.toString() === selectedUser);

        if (userRecord && userRecord.pin === pin) {
            onLogin(userRecord);
        } else {
            setError('Invalid PIN code');
        }
    };

    return (
        <div className="app-container items-center justify-center animate-fade">
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <div className="flex-col items-center gap-2 mb-6" style={{ textAlign: 'center' }}>
                    <div style={{ background: 'rgba(79, 70, 229, 0.2)', padding: '1rem', borderRadius: '50%', marginBottom: '0.5rem' }}>
                        <Shield size={40} color="var(--primary)" />
                    </div>
                    <h2 className="text-gradient">Canal Wire System</h2>
                    <p className="text-muted">Office Management Application</p>
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: '#FECACA', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <div className="form-group">
                        <label className="flex items-center gap-2"><User size={16} /> Select Account</label>
                        <select
                            className="input-field"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                        >
                            <option value="">-- Choose Account --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="flex items-center gap-2"><Lock size={16} /> PIN Code</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Enter PIN (e.g., 1234)"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-full" style={{ padding: '12px' }}>
                        Access Workspace <ArrowRight size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
