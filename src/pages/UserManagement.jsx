// UserManagement.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { getUsers, getManagers, updateUser, softDeleteUser, activateUser } from '../services/api';
import CreateUserModal from '../components/CreateUserModal';

export default function UserManagement({ currentUser }) {
  const [allUsers, setAllUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'firstName', direction: 'asc' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const mgrRes = await getManagers();
      console.log("Get manager:",mgrRes);
      if (mgrRes?.success) setManagers(mgrRes.data || []);
      
      const usersRes = await getUsers();
      console.log("Get users:",usersRes);
      if (usersRes?.success) setAllUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate role counts
  const roleCounts = useMemo(() => {
    const employees = allUsers.filter(user => user.role === 'EMPLOYEE' && user.status === 'ACTIVE').length;
    const managers = allUsers.filter(user => user.role === 'MANAGER' && user.status === 'ACTIVE').length;
    const total = employees + managers;
    
    return {
      employees,
      managers,
      total
    };
  }, [allUsers]);

  // Filter and sort users
  const processedUsers = useMemo(() => {
    let filtered = allUsers.filter(u => u.role !== 'ADMIN');
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(u => {
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        return (
          fullName.includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.role && u.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (u.status && u.status.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle nested objects or special cases
        if (sortConfig.key === 'manager') {
          aValue = managers.find(m => m.id === a.managerId);
          bValue = managers.find(m => m.id === b.managerId);
          aValue = aValue ? `${aValue.firstName} ${aValue.lastName}` : '';
          bValue = bValue ? `${bValue.firstName} ${bValue.lastName}` : '';
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [allUsers, searchTerm, sortConfig, managers]);

  // Get current page data
  const currentUsers = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return processedUsers.slice(startIndex, startIndex + pageSize);
  }, [processedUsers, currentPage, pageSize]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, pageSize]);

  // Pagination calculations
  const totalPages = Math.ceil(processedUsers.length / pageSize);
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, processedUsers.length);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  async function handleUpdate(userId, payload) {
    if (payload.role === 'ADMIN') {
      alert('Admin role cannot be changed');
      return;
    }

    const res = await updateUser(userId, payload);
    if (res?.success) {
      setEditUser(null);
      loadData();
    } else {
      alert(res.body?.message || 'Failed to update user');
    }
  }

  async function handleDelete(user) {
    if (user.role === 'ADMIN') {
      alert('Admin cannot be deleted');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    const res = await softDeleteUser(user.id);
    if (res.ok) loadData();
    else alert(res.body?.message || 'Failed to delete user');
  }

  async function handleToggleStatus(user) {
    if (user.role === 'ADMIN') {
      alert('Admin status cannot be changed');
      return;
    }

    try {
      if (user.status === 'ACTIVE') {
        await softDeleteUser(user.id);
      } else {
        await activateUser(user.id);
      }
      loadData();
    } catch (err) {
      alert('Failed to change status');
    }
  }

  // Pagination controls component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 20,
        padding: '16px 0',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{ color: '#6b7280', fontSize: 14 }}>
          Showing {startItem} to {endItem} of {processedUsers.length} entries
          {searchTerm && ' (filtered)'}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, color: '#6b7280' }}>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                background: 'white'
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                background: 'white',
                color: currentPage === 0 ? '#9ca3af' : '#374151',
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                fontSize: 14
              }}
            >
              « First
            </button>
            
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                background: 'white',
                color: currentPage === 0 ? '#9ca3af' : '#374151',
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                fontSize: 14
              }}
            >
              ‹ Previous
            </button>

            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' ? setCurrentPage(page - 1) : null}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  background: currentPage + 1 === page ? '#1a56db' : 'white',
                  color: currentPage + 1 === page ? 'white' : 
                         page === '...' ? '#9ca3af' : '#374151',
                  cursor: page === '...' ? 'default' : 'pointer',
                  minWidth: 40,
                  fontSize: 14
                }}
                disabled={page === '...'}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                background: 'white',
                color: currentPage >= totalPages - 1 ? '#9ca3af' : '#374151',
                cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                fontSize: 14
              }}
            >
              Next ›
            </button>
            
            <button
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                background: 'white',
                color: currentPage >= totalPages - 1 ? '#9ca3af' : '#374151',
                cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                fontSize: 14
              }}
            >
              Last »
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 20, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, color: '#1a56db' }}>User Management</h3>
          <p style={{ color: '#6b7280' }}>Manage users and their access to the platform</p>
        </div>
        <div>
          <button 
            onClick={() => setOpenCreate(true)} 
            style={{ background: '#0b063f', color: '#fff', padding: '10px 12px', borderRadius: 8, border: 'none' }}
          >
            + Create User
          </button>
        </div>
      </div>

      {/* User Count Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '16px', 
        marginBottom: '20px' 
      }}>
        {/* Total Users Card */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Total Users</h6>
                <h3 className="fw-bold text-primary">{roleCounts.total}</h3>
                <small className="text-muted">Employees + Managers</small>
              </div>
              <div className="bg-primary bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-primary">👥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Count Card */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Total Employees</h6>
                <h3 className="fw-bold text-success">{roleCounts.employees}</h3>
                <small className="text-muted">Active employees</small>
              </div>
              <div className="bg-success bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-success">💼</span>
              </div>
            </div>
          </div>
        </div>

        {/* Manager Count Card */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Total Managers</h6>
                <h3 className="fw-bold text-warning">{roleCounts.managers}</h3>
                <small className="text-muted">Team leaders</small>
              </div>
              <div className="bg-warning bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-warning">👨‍💼</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
        <input
          type="text"
          placeholder="Search by name, email, role or status..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            width: 300,
            outline: 'none',
            fontSize: 14
          }}
        />
        
        <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#6b7280' }}>
          <span>Showing: {currentUsers.length} of {processedUsers.length}</span>
          {searchTerm && <span style={{ color: '#ef4444' }}>Filtered</span>}
        </div>
      </div>

      <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #eef2f7', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            Loading users...
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', backgroundColor: '#f8fafc', color: '#374151', fontSize: 14 }}>
                    <th 
                      style={{ padding: 12, cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('firstName')}
                    >
                      Name {getSortIcon('firstName')}
                    </th>
                    <th 
                      style={{ padding: 12, cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('email')}
                    >
                      Email {getSortIcon('email')}
                    </th>
                    <th style={{ padding: 12 }}>Role</th>
                    <th style={{ padding: 12 }}>Manager</th>
                    <th 
                      style={{ padding: 12, cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('status')}
                    >
                      Status {getSortIcon('status')}
                    </th>
                    <th style={{ padding: 12 }}>ID</th>
                    <th style={{ padding: 12 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map(u => {
                    const manager = managers.find(m => m.id === u.managerId);
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              backgroundColor: '#1a56db', color: 'white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 600
                            }}>
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: 12 }}>{u.email}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{
                            padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                            backgroundColor: u.role === 'MANAGER' ? '#dbeafe' : u.role === 'HR' ? '#f3e8ff' : '#f0fdf4',
                            color: u.role === 'MANAGER' ? '#1e40af' : u.role === 'HR' ? '#7e22ce' : '#166534'
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>{manager ? `${manager.firstName} ${manager.lastName}` : '-'}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{
                            padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                            backgroundColor: u.status === 'INACTIVE' ? '#fee2e2' : '#d1fae5',
                            color: u.status === 'INACTIVE' ? '#b91c1c' : '#166534'
                          }}>
                            {u.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>
                          <code style={{ fontSize: 12, color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{u.id}</code>
                        </td>
                        <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                          <button
                            style={{ padding: '6px 10px', background: '#1a56db', color: '#fff', border: 'none', borderRadius: 6 }}
                            onClick={() => setEditUser(u)}
                            disabled={u.role === 'ADMIN'}
                          >
                            Edit
                          </button>
                          <button
                            style={{ padding: '6px 10px', background: u.status === 'ACTIVE' ? '#ef4444' : '#10b981', color: '#fff', border: 'none', borderRadius: 6 }}
                            onClick={() => handleToggleStatus(u)}
                            disabled={u.role === 'ADMIN'}
                          >
                            {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {currentUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#6b7280' }}>
                        {searchTerm ? 'No users found matching your search' : 'No users found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <PaginationControls />
          </>
        )}
      </div>

      {/* Create User Modal */}
      {openCreate && (
        <CreateUserModal 
          creator={currentUser} 
          managers={managers}
          onClose={() => setOpenCreate(false)} 
          onCreated={loadData} 
        />
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: 30, borderRadius: 12, width: 400 }}>
            <h3>Edit User</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <input
                placeholder="First Name"
                value={editUser.firstName}
                onChange={e => setEditUser({ ...editUser, firstName: e.target.value })}
                style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
                disabled={editUser.role === 'ADMIN'}
              />
              <input
                placeholder="Last Name"
                value={editUser.lastName}
                onChange={e => setEditUser({ ...editUser, lastName: e.target.value })}
                style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
                disabled={editUser.role === 'ADMIN'}
              />
              <input
                placeholder="Email"
                value={editUser.email}
                onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
                disabled={editUser.role === 'ADMIN'}
              />
              <select
                value={editUser.role}
                onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
                disabled={editUser.role === 'ADMIN'}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="HR">HR</option>
              </select>
              {editUser.role === 'EMPLOYEE' && (
                <select
                  value={editUser.managerId || ''}
                  onChange={e => setEditUser({ ...editUser, managerId: e.target.value })}
                  style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
                >
                  <option value="">-- Select Manager --</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                  ))}
                </select>
              )}
              <select
                value={editUser.status || 'ACTIVE'}
                onChange={e => setEditUser({ ...editUser, status: e.target.value })}
                style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
                disabled={editUser.role === 'ADMIN'}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setEditUser(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', color: 'white', background: 'rgb(26, 86, 219)' }}>Cancel</button>
              <button
                onClick={() => handleUpdate(editUser.id, editUser)}
                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#1a56db', color: '#fff' }}
                disabled={editUser.role === 'ADMIN'}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}