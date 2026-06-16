import React, { useEffect, useState } from 'react';
import { getUsers, authRegister } from '../services/api';

export default function ManagerDashboard({ user }) {
  const [team, setTeam] = useState([]);
  const [filteredTeam, setFilteredTeam] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    firstName: '', 
    lastName: '', 
    role: 'EMPLOYEE' 
  });
  const [msg, setMsg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => { 
    loadTeam(); 
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredTeam(team);
    } else {
      const filtered = team.filter(member => 
        member.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTeam(filtered);
    }
  }, [searchTerm, team]);

  async function loadTeam() {
    setLoading(true);
    try {
      const res = await getUsers(user.id);
      console.log("get team member :",res);
      if (res.success) {
        const teamData = res.data || [];
        setTeam(teamData);
        setFilteredTeam(teamData);
      }
    } catch (error) {
      console.error('Error loading team:', error);
    } finally {
      setLoading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    const payload = { 
      email: form.email, 
      password: form.password, 
      firstName: form.firstName, 
      lastName: form.lastName, 
      role: 'EMPLOYEE' 
    };
    
    const res = await authRegister(payload, user.id, 'MANAGER');
    if (!res.success) { 
      setMsg({ type: 'error', text: res.body?.message ? res.body.message : 'Error creating employee' }); 
      return; 
    }
    
    // Show success popup
    setSuccessMessage(`Employee created successfully: ${res.data.email}`);
    setShowSuccessPopup(true);
    
    // Reset form and close modal
    setForm({ email: '', password: '', firstName: '', lastName: '', role: 'EMPLOYEE' });
    setShowModal(false);
    setMsg(null);
    
    // Reload team data
    await loadTeam();
    
    // Hide popup after 3 seconds
    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 3000);
  }

  const resetForm = () => {
    setForm({ email: '', password: '', firstName: '', lastName: '', role: 'EMPLOYEE' });
    setMsg(null);
    setShowModal(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div style={styles.container}>
      {/* Success Popup */}
      {showSuccessPopup && (
        <div style={styles.successPopup}>
          <div style={styles.successContent}>
            <div style={styles.successIcon}>✓</div>
            <div style={styles.successText}>
              <div style={styles.successTitle}>Success!</div>
              <div style={styles.successMessage}>{successMessage}</div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerMain}>
            <h1 style={styles.title}>Team Management</h1>
            <p style={styles.subtitle}>Manage your team members and their accounts</p>
          </div>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </div>
            <div style={styles.userDetails}>
              <span style={styles.userName}>{user.firstName} {user.lastName}</span>
              <span style={styles.userRole}>Manager</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Team Overview Card */}
        <div style={styles.overviewCard}>
          <div style={styles.overviewContent}>
            <div style={styles.teamCountSection}>
              <div style={styles.teamCount}>
                <div style={styles.countNumber}>{team.length}</div>
                <div style={styles.countLabel}>Team Members</div>
              </div>
            </div>
            <button 
              style={styles.createBtn} 
              onClick={() => setShowModal(true)}
            >
              <span style={styles.btnIcon}>+</span>
              Add Member
            </button>
          </div>
        </div>

        {/* Team Management Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitleSection}>
              <h3 style={styles.cardTitle}>Team Members</h3>
              <span style={styles.countBadge}>{team.length} members</span>
            </div>
            
            {/* Search Bar */}
            <div style={styles.searchContainer}>
              <div style={styles.searchBox}>
                <span style={styles.searchIcon}>🔍</span>
                <input
                  style={styles.searchInput}
                  type="text"
                  placeholder="Search employees by name, email or role..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                {searchTerm && (
                  <button 
                    style={styles.clearSearch}
                    onClick={() => setSearchTerm('')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Team List */}
          {loading ? (
            <div style={styles.loadingState}>
              <div style={styles.loadingSpinner}></div>
              <span>Loading team data...</span>
            </div>
          ) : filteredTeam.length > 0 ? (
            <div style={styles.teamTable}>
              <div style={styles.tableHeader}>
                <div style={styles.tableRow}>
                  <div style={styles.tableHeaderCell}>Employee</div>
                  <div style={styles.tableHeaderCell}>Email</div>
                  <div style={styles.tableHeaderCell}>Role</div>
                  <div style={styles.tableHeaderCell}>Status</div>
                </div>
              </div>
              <div style={styles.tableBody}>
                {filteredTeam.map(member => (
                  <div key={member.id} style={styles.tableRow}>
                    <div style={styles.tableCell}>
                      <div style={styles.employeeInfo}>
                        <div style={styles.avatar}>
                          {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                        </div>
                        <div style={styles.employeeDetails}>
                          <div style={styles.employeeName}>
                            {member.firstName} {member.lastName}
                          </div>
                          <div style={styles.employeeId}>ID: {member.id}</div>
                        </div>
                      </div>
                    </div>
                    <div style={styles.tableCell}>
                      <div style={styles.email}>{member.email}</div>
                    </div>
                    <div style={styles.tableCell}>
                      <div style={styles.role}>
                        {member.role || 'EMPLOYEE'}
                      </div>
                    </div>
                    <div style={styles.tableCell}>
                      <span style={styles.statusBadge}>
                        ● Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>
              {searchTerm ? (
                <>
                  <div style={styles.emptyIcon}>🔍</div>
                  <h4 style={styles.emptyTitle}>No matching team members</h4>
                  <p style={styles.emptyText}>
                    No employees found matching "{searchTerm}"
                  </p>
                  <button 
                    style={styles.emptyStateBtn} 
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <div style={styles.emptyIcon}>👥</div>
                  <h4 style={styles.emptyTitle}>No team members yet</h4>
                  <p style={styles.emptyText}>
                    Start building your team by creating new employee accounts
                  </p>
                  <button 
                    style={styles.emptyStateBtn} 
                    onClick={() => setShowModal(true)}
                  >
                    Add First Member
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Employee Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add Team Member</h3>
              <button 
                style={styles.closeButton}
                onClick={resetForm}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={submit} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>First Name *</label>
                  <input
                    style={styles.input}
                    placeholder="Enter first name"
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Last Name *</label>
                  <input
                    style={styles.input}
                    placeholder="Enter last name"
                    value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="team.member@company.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Password *</label>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="Enter temporary password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <div style={styles.helperText}>
                  Employee can change password after first login
                </div>
              </div>

              {/* Message Display */}
              {msg && (
                <div style={msg.type === 'error' ? styles.errorMsg : styles.successMsg}>
                  {msg.text}
                </div>
              )}
              
              <div style={styles.formActions}>
                <button 
                  type="button" 
                  style={styles.cancelBtn} 
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={styles.saveBtn}
                >
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  // Success Popup Styles
  successPopup: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    padding: '24px',
    zIndex: 1002,
    border: '1px solid #e2e8f0',
    minWidth: '400px',
    animation: 'popIn 0.3s ease-out',
  },
  successContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  successIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '24px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  successText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  successTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
  },
  successMessage: {
    fontSize: '14px',
    color: '#64748b',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '32px 0',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerMain: {
    flex: 1,
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '16px',
    opacity: 0.9,
    margin: 0,
    fontWeight: '400',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '16px',
    fontWeight: '600',
  },
  userRole: {
    fontSize: '14px',
    opacity: 0.8,
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px',
  },
  overviewCard: {
    background: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '24px',
    padding: '24px',
  },
  overviewContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamCountSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  teamCount: {
    textAlign: 'center',
  },
  countNumber: {
    fontSize: '42px',
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: '1',
    marginBottom: '8px',
  },
  countLabel: {
    fontSize: '16px',
    color: '#64748b',
    fontWeight: '500',
  },
  createBtn: {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
    height: '36px',
    minWidth: '120px',
    justifyContent: 'center',
  },
  btnIcon: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '24px 24px 0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    gap: '20px',
  },
  cardTitleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  countBadge: {
    background: '#f1f5f9',
    color: '#475569',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
  },
  searchContainer: {
    flex: 1,
    maxWidth: '400px',
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    fontSize: '16px',
    color: '#64748b',
  },
  searchInput: {
    width: '100%',
    padding: '10px 40px 10px 40px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  },
  clearSearch: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamTable: {
    padding: '0 24px 24px 24px',
  },
  tableHeader: {
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '12px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 2fr 1fr 1fr',
    gap: '16px',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  tableHeaderCell: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  tableCell: {
    fontSize: '14px',
    color: '#1e293b',
  },
  employeeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
  },
  employeeDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  employeeName: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1e293b',
    marginBottom: '2px',
  },
  employeeId: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  email: {
    fontWeight: '500',
    fontSize: '14px',
    color: '#64748b',
  },
  role: {
    fontSize: '14px',
    color: '#1e293b',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusBadge: {
    color: '#059669',
    fontSize: '12px',
    fontWeight: '600',
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '60px 32px',
    color: '#64748b',
    fontSize: '16px',
  },
  loadingSpinner: {
    width: '24px',
    height: '24px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 32px',
    color: '#64748b',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#475569',
    margin: '0 0 8px 0',
  },
  emptyText: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: '0 0 20px 0',
  },
  emptyStateBtn: {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    minWidth: '140px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  modalHeader: {
    padding: '24px 24px 0 24px',
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#64748b',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
  },
  form: {
    padding: '24px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  },
  helperText: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
    fontStyle: 'italic',
  },
  errorMsg: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    border: '1px solid #fecaca',
    marginBottom: '16px',
  },
  successMsg: {
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    border: '1px solid #bbf7d0',
    marginBottom: '16px',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
  cancelBtn: {
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
  },
  saveBtn: {
    background: '#10b981',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
};

// Add CSS for animations
const additionalStyles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes popIn {
  0% { 
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
  }
  100% { 
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}
`;