import React, { useState, useEffect } from 'react';
import { getCourseReport, getPendingEnrollments, getUsers, getAdminStats } from '../services/api';

export default function AdminDashboard({ user }) {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalEmployees: 0,
    totalManagers: 0,
    totalUsers: 0,
    completedCourses: 0,
    pendingApprovals: 0,
    activeEnrollments: 0,
    totalFeedbacks: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load course report
      const reportRes = await getCourseReport();
      console.log("📊 Course Report Response:", reportRes.data); // Debug log
      
      if (reportRes.success) {
        const reportData = reportRes.data;
        // console.log("📊 Course Report Response:", reportData.data);
        setStats(prev => ({
          ...prev,
          totalCourses: reportData.totalCourses || 0,
          completedCourses: reportData.completedEnrollments || 0,
          pendingApprovals: reportData.pendingApprovals || 0,
          activeEnrollments: reportData.activeEnrollments || 0
        }));
      }

      // Load total employees, managers, and total users
      const usersRes = await getUsers();
      console.log("📊 User Response:", usersRes.data);
      if (usersRes.success) {
        const users = usersRes.data || [];
        const employees = users.filter(u => u.role === 'EMPLOYEE');
        const managers = users.filter(u => u.role === 'MANAGER');
        const totalUsers = employees.length + managers.length;
        
        setStats(prev => ({ 
          ...prev, 
          totalEmployees: employees.length,
          totalManagers: managers.length,
          totalUsers: totalUsers
        }));
      }

      // Load total feedbacks from admin stats
      const adminStatsRes = await getAdminStats();
      if (adminStatsRes.success) {
        const adminStats = adminStatsRes.data;
        setStats(prev => ({ 
          ...prev, 
          totalFeedbacks: adminStats.totalFeedbacks || 0 
        }));
      }

      // Load pending enrollments for activity
      const pendingRes = await getPendingEnrollments();
      if (pendingRes.success) {
        setRecentActivity((pendingRes.data || []).slice(0, 5));
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // const loadDashboardData = async () => {
  //   try {
  //     // Load course report
  //     const reportRes = await getCourseReport();
  //     console.log("📊 Course Report Response:", reportRes.data); // Debug log
      
  //     if (reportRes.ok && reportRes.body.success) {
  //       const reportData = reportRes.body.data || reportRes.body;
  //       setStats(prev => ({
  //         ...prev,
  //         totalCourses: reportData.totalCourses || 0,
  //         completedCourses: reportData.completedEnrollments || 0,
  //         pendingApprovals: reportData.pendingApprovals || 0,
  //         activeEnrollments: reportData.activeEnrollments || 0
  //       }));
  //     }

  //     // Load total employees, managers, and total users
  //     const usersRes = await getUsers();
  //     console.log("📊 User Response:", usersRes.data);
  //     if (usersRes.ok && usersRes.body.success) {
  //       const users = usersRes.body.data || [];
  //       const employees = users.filter(u => u.role === 'EMPLOYEE');
  //       const managers = users.filter(u => u.role === 'MANAGER');
  //       const totalUsers = employees.length + managers.length;
        
  //       setStats(prev => ({ 
  //         ...prev, 
  //         totalEmployees: employees.length,
  //         totalManagers: managers.length,
  //         totalUsers: totalUsers
  //       }));
  //     }

  //     // Load total feedbacks from admin stats
  //     const adminStatsRes = await getAdminStats();
  //     if (adminStatsRes.ok && adminStatsRes.body.success) {
  //       const adminStats = adminStatsRes.body.data || adminStatsRes.body;
  //       setStats(prev => ({ 
  //         ...prev, 
  //         totalFeedbacks: adminStats.totalFeedbacks || 0 
  //       }));
  //     }

  //     // Load pending enrollments for activity
  //     const pendingRes = await getPendingEnrollments();
  //     if (pendingRes.ok && pendingRes.body.success) {
  //       setRecentActivity(pendingRes.body.data.slice(0, 5));
  //     }

  //   } catch (error) {
  //     console.error('Failed to load dashboard data:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  if (loading) return <div className="text-center p-4">Loading dashboard...</div>;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">📊 Admin Dashboard</h2>
          <small className="text-muted fs-4">
            Overview of platform metrics and activities
          </small>
        </div>
        {/* <button className="btn btn-outline-primary btn-sm" onClick={loadDashboardData}>
          🔄 Refresh
        </button> */}
      </div>

      {/* Stats Cards - 4 columns for 8 cards */}
      <div className="stats-grid mb-4" style={{ display: 'grid',  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem'}}>

        {/* Card 1: Total Courses */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Total Courses</h6>
                <h3 className="fw-bold text-primary">{stats.totalCourses}</h3>
                <small className="text-muted">Available in platform</small>
              </div>
              <div className="bg-primary bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-primary">📚</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card 2: Total Users */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Total Users</h6>
                <h3 className="fw-bold text-info">{stats.totalUsers}</h3>
                <small className="text-muted">Employees + Managers</small>
              </div>
              <div className="bg-info bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-info">👥</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card 3: Total Employees */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Total Employees</h6>
                <h3 className="fw-bold text-success">{stats.totalEmployees}</h3>
                <small className="text-muted">Active employees</small>
              </div>
              <div className="bg-success bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-success">💼</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Total Managers */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Total Managers</h6>
                <h3 className="fw-bold text-warning">{stats.totalManagers}</h3>
                <small className="text-muted">Team leaders</small>
              </div>
              <div className="bg-warning bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-warning">👨‍💼</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card 5: Completed Courses */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Completed</h6>
                <h3 className="fw-bold text-secondary">{stats.completedCourses}</h3>
                <small className="text-muted">Finished courses</small>
              </div>
              <div className="bg-secondary bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-secondary">✅</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card 6: Pending Approvals */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Pending Approvals</h6>
                <h3 className="fw-bold text-danger">{stats.pendingApprovals}</h3>
                <small className="text-muted">Awaiting review</small>
              </div>
              <div className="bg-danger bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-danger">⏳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 7: Active Enrollments */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Active Enrollments</h6>
                <h3 className="fw-bold text-purple">{stats.activeEnrollments}</h3>
                <small className="text-muted">Currently learning</small>
              </div>
              <div className="bg-purple bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-purple">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 8: Total Feedbacks */}
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-title text-muted mb-2">Total Feedbacks</h6>
                <h3 className="fw-bold text-teal">{stats.totalFeedbacks}</h3>
                <small className="text-muted">User feedback received</small>
              </div>
              <div className="bg-teal bg-opacity-10 p-3 rounded">
                <span style={{ fontSize: '1.5rem' }} className="text-teal">💬</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">🚀 Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-2">
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/course-management" className="btn btn-outline-primary w-100">
                    ➕ Create Course
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/user-management" className="btn btn-outline-primary w-100">
                    👥 Manage Users
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/course-approvals" className="btn btn-outline-primary w-100">
                    ⏳ Review Approvals
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/study-materials" className="btn btn-outline-primary w-100">
                    📖 Study Materials
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/reports" className="btn btn-outline-primary w-100">
                    📊 View Reports
                  </a>
                </div>
                <div className="col-xl-2 col-md-3 col-sm-4 col-6">
                  <a href="/user-courses" className="btn btn-outline-primary w-100">
                    📈 User Progress
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom CSS for the new colors */}
      {/* <style jsx>{`
        .text-purple {
          color: #6f42c1 !important;
        }
        .bg-purple {
          background-color: #6f42c1 !important;
        }
        .text-teal {
          color: #20c997 !important;
        }
        .bg-teal {
          background-color: #20c997 !important;
        }
      `}</style> */}
    </div>
  );
}