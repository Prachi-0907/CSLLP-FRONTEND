// src/components/Layout.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
 
export default function Layout({ user, onLogout, children }) {
  const location = useLocation();
 
  // Helper to apply active link style
  const getLinkStyle = (path) => ({
    ...styles.navItem,
    ...(location.pathname === path ? styles.active : {}),
  });
 
  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarContent}>
          <div style={styles.sidebarHeader}>
            <div style={styles.logo}>CSLLP</div>
            <div style={styles.userInfo}>
              <strong>{user.firstName} {user.lastName}</strong>
              <small style={styles.roleBadge}>{user.role}</small>
            </div>
          </div>
          
          <nav style={styles.navContainer}>
            <ul style={styles.navList}>
              {/* Dashboard */}
              <li>
                <Link to="/" style={getLinkStyle('/')}>
                  📊 Dashboard
                </Link>
              </li>

              {/* 🆕 UPDATED: Role-based Course Navigation */}
              {user.role === "EMPLOYEE" ? (
                // 👤 Employee Navigation
                <>
                  <li>
                    <Link to="/my-courses" style={getLinkStyle('/my-courses')}>
                      📖 My Courses
                    </Link>
                  </li>
                  {/* <li>
                    <Link to="/study-materials" style={getLinkStyle('/study-materials')}>
                      📚 Study Materials
                    </Link>
                  </li> */}
                  <li>
                    <Link to="/course-enrollment" style={getLinkStyle('/course-enrollment')}>
                      ➕ Course Enrollment
                    </Link>
                  </li>
                </>
              ) : (
                // 👨‍💼 Admin/Manager Navigation  
                <>
                  <li>
                    <Link to="/study-materials" style={getLinkStyle('/study-materials')}>
                      📚 Study Materials
                    </Link>
                  </li>
                  <li>
                    <Link to="/user-courses" style={getLinkStyle('/user-courses')}>
                      👥 User Courses
                    </Link>
                  </li>
                  <li>
                    <Link to="/course-management" style={getLinkStyle('/course-management')}>
                      🎯 Course Management
                    </Link>
                  </li>
                  <li>
                    <Link to="/course-approvals" style={getLinkStyle('/course-approvals')}>
                      ✅ Course Approvals
                    </Link>
                  </li>
                </>
              )}

              {/* Common Pages for All Roles */}
              {/* Common Pages for All Roles */}

              {/* ... other common links ... */}
              <li>
                <Link to="/examinations" style={getLinkStyle('/examinations')}>
                  📝 Examinations
                </Link>
              </li>
              <li>
                <Link to="/certifications" style={getLinkStyle('/certifications')}>
                  🏆 Certifications
                </Link>
              </li>
              {/* <li>
                <Link to="/leaderboards" style={getLinkStyle('/leaderboards')}>
                  🏅 Leaderboards
                </Link>
              </li> */}

              <hr style={styles.divider} />

              {/* 🆕 UPDATED: Admin Only Links */}
              {user.role === 'ADMIN' && (
                <>
                  <li>
                    <Link to="/user-management" style={getLinkStyle('/user-management')}>
                      👥 User Management
                    </Link>
                  </li>
                  {/* <li>
                    <Link to="/admin-panel" style={getLinkStyle('/admin-panel')}>
                      ⚙️ Admin Panel
                    </Link>
                  </li> */}
                </>
              )}

              {/* Common Pages for Managers & Admin */}
              {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                <>
                  <li>
                    <Link to="/reports" style={getLinkStyle('/reports')}>
                      📈 Reports
                    </Link>
                  </li>
                </>
              )}

              {/* Common for All */}
              <li>
                <Link to="/feedback" style={getLinkStyle('/feedback')}>
                  💬 Feedback
                </Link>
              </li>

              <hr style={styles.divider} />

              {/* Profile */}
              <li>
                <Link to="/profile" style={getLinkStyle('/profile')}>
                  👤 Profile
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Sidebar Footer - Fixed at bottom */}
        <div style={styles.footer}>
          <button style={styles.logoutBtn} onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>
 
      {/* Main Content */}
      <main style={styles.main}>{children}</main>
    </div>
  );
}
 
const styles = {
  wrapper: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'sans-serif',
    overflow: 'hidden',
  },
  sidebar: {
    width: '280px', // Slightly wider for better readability
    backgroundColor: '#1f2937',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
  },
  sidebarContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '20px',
    flexShrink: 0,
    borderBottom: '1px solid #374151',
  },
  logo: {
    fontWeight: '700',
    fontSize: '24px',
    marginBottom: '10px',
    color: '#3b82f6',
  },
  userInfo: {
    fontSize: '14px',
  },
  roleBadge: {
    display: 'block',
    color: '#9ca3af',
    marginTop: '2px',
  },
  navContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 0',
  },
  navList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    margin: 0,
  },
  navItem: {
    display: 'block',
    padding: '12px 20px',
    cursor: 'pointer',
    color: '#d1d5db',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    borderLeft: '3px solid transparent',
  },
  active: {
    fontWeight: 'bold',
    color: '#3b82f6',
    backgroundColor: '#374151',
    borderLeft: '3px solid #3b82f6',
  },
  divider: {
    margin: '15px 20px',
    border: 'none',
    borderTop: '1px solid #374151',
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid #374151',
    flexShrink: 0,
    backgroundColor: '#1f2937',
  },
  logoutBtn: {
    padding: '10px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    width: '100%',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
  main: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: '30px',
    marginLeft: '280px',
    overflowY: 'auto',
    height: '100vh',
  },
};