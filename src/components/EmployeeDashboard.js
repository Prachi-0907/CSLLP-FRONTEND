
import React, { useState, useEffect } from 'react';
import { getMyCourses, getEnrollmentsByEmployee,getUserById} from '../services/api';

export default function EmployeeDashboard({ user, onLogout }) {
  const [manager, setManager] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchManager() {
      if (user.managerId) {
        setLoading(true);
        try {
          const res = await getUserById(user.managerId);
          console.log("Manager data:",res);
          if (res.data) {
            setManager(res.data);
          }
        } catch (error) {
          console.error('Error fetching manager:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchManager();
  }, [user.managerId]);


  useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  const loadDashboardData = async () => {
    try {
      // Load my courses
      const coursesRes = await getMyCourses(user.id);
      if (coursesRes.success) {
        setMyCourses(coursesRes.data);
      }

      // Load enrollments for progress calculation
      const enrollRes = await getEnrollmentsByEmployee(user.id);
      if (enrollRes.success) {
        setEnrollments(enrollRes.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalCourses = myCourses.length;
  const completedCourses = enrollments.filter(e => e.progress === 100).length;
  const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100).length;
  const averageProgress = enrollments.length > 0 
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
    : 0;

  if (loading) return <div className="text-center p-4">Loading your dashboard...</div>;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">🎯 My Learning Dashboard</h2>
          <small className="text-muted">
            Track your learning progress and achievements
          </small>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <span>Welcome, {user.name}</span>
          <button className="btn btn-outline-primary btn-sm" onClick={loadDashboardData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards - 3 Cards in One Row */}
      <div className="row mb-4">
        <div className="col-xl-4 col-md-4 mb-3">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Courses
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{totalCourses}</div>
                  <div className="mt-2">
                    <small className="text-muted">
                      Enrolled in platform
                    </small>
                  </div>
                </div>
                <div className="col-auto">
                  <span style={{ fontSize: '2rem' }}>📚</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-xl-4 col-md-4 mb-3">
          <div className="card border-left-success shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Completed Courses
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{completedCourses}</div>
                  <div className="mt-2">
                    <small className="text-muted">
                      Finished courses
                    </small>
                  </div>
                </div>
                <div className="col-auto">
                  <span style={{ fontSize: '2rem' }}>✅</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-xl-4 col-md-4 mb-3">
          <div className="card border-left-info shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Average Progress
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{averageProgress}%</div>
                  <div className="mt-2">
                    <small className="text-muted">
                      Overall learning progress
                    </small>
                  </div>
                </div>
                <div className="col-auto">
                  <span style={{ fontSize: '2rem' }}>📊</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - All with Same Border as Browse Courses */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-left-primary shadow">
            <div className="card-header">
              <h5 className="card-title mb-0">🎯 Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-2">
                  <a href="/course-enrollment" className="btn btn-outline-primary w-100 border">
                    📚 Browse Courses
                  </a>
                </div>
                <div className="col-md-4 mb-2">
                  <a href="/my-courses" className="btn btn-outline-primary w-100 border">
                    🎓 My Courses
                  </a>
                </div>
                <div className="col-md-4 mb-2">
                  <a href="/examinations" className="btn btn-outline-primary w-100 border">
                    📝 Take Exams
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Progress */}
      <div className="row">
        <div className="col-md-6">
          <div className="card border-left-primary shadow">
            <div className="card-header">
              <h5 className="card-title mb-0">📈 Course Progress</h5>
            </div>
            <div className="card-body">
              {myCourses.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No courses enrolled yet.</p>
                  <a href="/course-enrollment" className="btn btn-primary">
                    Browse Courses
                  </a>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {myCourses.slice(0, 5).map((item, index) => (
                    <div key={index} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong>{item.course.title}</strong>
                        <span className="badge bg-primary">{item.progress}%</span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div 
                          className="progress-bar" 
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card border-left-primary shadow">
            <div className="card-header">
              <h5 className="card-title mb-0">🏆 Achievements</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {completedCourses > 0 && (
                  <div className="list-group-item">
                    <span className="badge bg-success me-2">✅</span>
                    Completed {completedCourses} course(s)
                  </div>
                )}
                {inProgressCourses > 0 && (
                  <div className="list-group-item">
                    <span className="badge bg-info me-2">🚀</span>
                    {inProgressCourses} course(s) in progress
                  </div>
                )}
                {averageProgress >= 75 && (
                  <div className="list-group-item">
                    <span className="badge bg-warning me-2">⭐</span>
                    Great progress! Keep it up
                  </div>
                )}
                <div className="list-group-item">
                  <span className="badge bg-primary me-2">🎯</span>
                  Overall progress: {averageProgress}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '32px 0' },
  headerContent: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px' },
  title: { fontSize: '28px', fontWeight: '700', marginBottom: '16px', margin: 0 },
  userInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
  welcomeSection: { flex: 1 },
  welcomeText: { fontSize: '16px', opacity: 0.9, margin: '0 0 4px 0' },
  userName: { fontSize: '24px', fontWeight: '600', margin: 0 },
  logoutBtn: { background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' },
  logoutText: { fontSize: '14px' },
  logoutIcon: { fontSize: '16px' },
  content: { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' },
  card: { background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' },
  cardTitle: { fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 },
  statusBadge: { background: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  managerStatus: { background: '#dbeafe', color: '#1e40af', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  infoLabel: { fontSize: '12px', fontWeight: '500', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue: { fontSize: '14px', fontWeight: '600', color: '#1e293b' },
  activeStatus: { color: '#059669', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' },
  managerSection: { padding: '8px 0' },
  loadingState: { display: 'flex', alignItems: 'center', gap: '12px', padding: '20px', color: '#64748b', fontSize: '14px' },
  loadingSpinner: { width: '20px', height: '20px', border: '2px solid #e2e8f0', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  managerInfo: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' },
  managerAvatar: { width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '14px' },
  managerDetails: { flex: 1 },
  managerName: { fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' },
  managerRole: { fontSize: '14px', color: '#64748b', margin: '0 0 2px 0' },
  managerEmail: { fontSize: '12px', color: '#94a3b8', margin: 0 },
  noManager: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' },
  noManagerIcon: { fontSize: '24px' },
  noManagerText: { flex: 1 },
  noManagerTitle: { fontSize: '16px', fontWeight: '600', color: '#dc2626', margin: '0 0 4px 0' },
  noManagerDesc: { fontSize: '14px', color: '#ef4444', margin: 0 },
};
