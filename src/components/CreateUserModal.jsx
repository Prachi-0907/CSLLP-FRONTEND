// src/components/CreateUserModal.jsx
import React, { useEffect, useState } from 'react';
import { getUsersByRole, authRegister } from '../services/api';

export default function CreateUserModal({ creator, onClose, onCreated }) {
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: creator?.role === 'MANAGER' ? 'EMPLOYEE' : 'EMPLOYEE',
    managerId: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await getUsersByRole('MANAGER');
      if (res.data) setManagers(res.data);
    })();
  }, []);

  useEffect(() => {
    if (creator?.role === 'MANAGER') {
      setForm(f => ({
        ...f,
        role: 'EMPLOYEE',
        managerId: String(creator.id)
      }));
    }
  }, [creator]);

  const update = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const splitName = (full) => {
    const parts = (full || '').trim().split(/\s+/);
    const first = parts.shift() || '';
    const last = parts.join(' ') || '';
    return { first, last };
  };

  async function submit(e) {
    e.preventDefault();
    setError(null);

    const { first, last } = splitName(form.fullName);
    if (!first) return setError('Full name is required');
    if (!form.email) return setError('Email is required');
    if (!form.password) form.password = Math.random().toString(36).slice(-8);

    const payload = {
      email: form.email,
      password: form.password,
      firstName: first,
      lastName: last,
      role: form.role,
      managerId:
        form.role === 'EMPLOYEE'
          ? (creator?.role === 'MANAGER'
              ? creator.id
              : form.managerId
              ? Number(form.managerId)
              : null)
          : null,
    };

    setBusy(true);
    try {
      const res = await authRegister(payload, creator?.id, creator?.role);
      console.log("New user:", res);
      if (!res.success) {
        const msg = res.body?.message || 'Failed to create user';
        setError(msg);
      } else {
        onCreated && onCreated();
        onClose && onClose();
      }
    } catch (ex) {
      setError(String(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>

        {/* HEADER */}
        <div style={styles.header}>
          <h2 style={styles.title}>Create New User</h2>
        </div>

        <form onSubmit={submit} style={{ marginTop: 20 }}>

          <label style={styles.label}>Full Name</label>
          <input
            style={styles.input}
            value={form.fullName}
            onChange={e => update('fullName', e.target.value)}
            placeholder="John Doe"
          />

          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            placeholder="example@domain.com"
          />

          <label style={styles.label}>Role</label>
          {creator?.role === 'MANAGER' ? (
            <input style={styles.input} disabled value="Employee" />
          ) : (
            <select
              style={styles.input}
              value={form.role}
              onChange={e => update('role', e.target.value)}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="HR">HR</option>
              <option value="ADMIN">Admin</option>
            </select>
          )}

          {form.role === 'EMPLOYEE' && creator?.role !== 'MANAGER' && (
            <>
              <label style={styles.label}>Reporting Manager</label>
              <select
                style={styles.input}
                value={form.managerId}
                onChange={e => update('managerId', e.target.value)}
              >
                <option value="">Select Manager</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({m.email})
                  </option>
                ))}
              </select>
            </>
          )}

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="text"
            value={form.password}
            onChange={e => update('password', e.target.value)}
            placeholder="Enter password "
          />

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={busy} style={styles.btnPrimary}>
              {busy ? 'Creating...' : 'Create'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

/* -------- LIGHT THEME STYLES -------- */
const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backdropFilter: 'blur(5px)',
    background: 'rgba(0,0,0,0.25)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 150,
  },

  modal: {
    width: 580,
    background: '#ffffff',
    borderRadius: 16,
    padding: 25,
    boxShadow: '0 10px 35px rgba(0,0,0,0.12)',
  },

  /* ✅ New light mint color ONLY for header */
  header: {
    background: 'linear-gradient(90deg, #e6f5ec, #ffffff)',
    border: '1px solid #d4e9dd',
    padding: '15px 20px',
    borderRadius: 12,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: '#333',
    textAlign: 'center'
  },

  label: {
    marginTop: 15,
    fontSize: 15,
    fontWeight: 600,
    color: '#444'
  },

  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #d8dee5',
    background: '#f9fafb',
    fontSize: 15,
    outline: 'none',
    transition: '0.2s'
  },

  error: {
    marginTop: 12,
    color: '#b00020',
    fontWeight: 600
  },

  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 25
  },

  btnPrimary: {
    background: '#4aa3f0',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600
  },

  btnSecondary: {
    background: '#e9eef5',
    color: '#333',
    padding: '12px 24px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: 15
  }
};
