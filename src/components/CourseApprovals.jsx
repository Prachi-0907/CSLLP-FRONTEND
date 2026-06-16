import React, { useEffect, useState } from "react";
import { getPendingEnrollments, approveEnrollment, rejectEnrollment } from "../services/api";

// 🆕 ADD POPUP MODAL COMPONENT
function PopupModal({ show, type, title, message, onClose, onConfirm }) {
  if (!show) return null;

  const getModalConfig = () => {
    const config = {
      SUCCESS: {
        icon: "✅",
        bgColor: "bg-success",
        btnColor: "btn-success",
        title: "Success"
      },
      WARNING: {
        icon: "⏳",
        bgColor: "bg-warning",
        btnColor: "btn-warning",
        title: "Warning"
      },
      ERROR: {
        icon: "❌",
        bgColor: "bg-danger",
        btnColor: "btn-danger",
        title: "Error"
      },
      INFO: {
        icon: "ℹ️",
        bgColor: "bg-info",
        btnColor: "btn-info",
        title: "Information"
      },
      CONFIRM: {
        icon: "❓",
        bgColor: "bg-primary",
        btnColor: "btn-primary",
        title: "Please Confirm"
      }
    };
    return config[type] || config.INFO;
  };

  const config = getModalConfig();

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className={`modal-header text-white ${config.bgColor}`}>
            <h5 className="modal-title">
              <span className="me-2">{config.icon}</span>
              {title || config.title}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="text-center mb-3">
              <div style={{ fontSize: '3rem' }}>{config.icon}</div>
            </div>
            <div className="text-center">
              {typeof message === 'string' ? (
                <p className="mb-0">{message}</p>
              ) : (
                <div>{message}</div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            {type === "CONFIRM" ? (
              <>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className={`btn ${config.btnColor}`}
                  onClick={onConfirm}
                >
                  Confirm
                </button>
              </>
            ) : (
              <button 
                type="button" 
                className={`btn ${config.btnColor} w-100`}
                onClick={onConfirm || onClose}
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseApprovals({ user }) {
  const [enrollments, setEnrollments] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  // 🆕 ADD POPUP STATE
  const [popup, setPopup] = useState({
    show: false,
    type: "INFO",
    title: "",
    message: "",
    onConfirm: null
  });
  // 🆕 ADD LOADING STATE FOR ACTIONS
  const [actionLoading, setActionLoading] = useState(null);
  // 🆕 ADD STATE TO TRACK CURRENT ACTION TYPE
  const [currentAction, setCurrentAction] = useState(null);

  // 🆕 POPUP HELPER FUNCTIONS
  const showPopup = (type, title, message, onConfirm = null) => {
    setPopup({
      show: true,
      type,
      title,
      message,
      onConfirm
    });
  };

  const hidePopup = () => {
    setPopup({
      show: false,
      type: "INFO",
      title: "",
      message: "",
      onConfirm: null
    });
  };

  const showSuccess = (title, message) => {
    showPopup("SUCCESS", title, message);
  };

  const showError = (title, message) => {
    showPopup("ERROR", title, message);
  };

  const showConfirm = (title, message, onConfirm) => {
    showPopup("CONFIRM", title, message, onConfirm);
  };

  useEffect(() => {
    loadEnrollments();
  }, [filter]);

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      const res = await getPendingEnrollments();
      if (res.success) {
        let filteredData = res.data || [];
        
        if (filter !== "ALL") {
          filteredData = filteredData.filter(e => e.status === filter);
        }
        
        setEnrollments(filteredData);
      } else {
        setEnrollments([]);
        showError("Load Error", "Failed to load enrollments. Please try again.");
      }
    } catch (error) {
      console.error("Failed to load enrollments:", error);
      setEnrollments([]);
      showError("Load Error", "Failed to load enrollments. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // 🆕 FIXED: Improved approve function with better state management
  const handleApprove = async (enrollment) => {
    // 🆕 PREVENT MULTIPLE CLICKS
    if (actionLoading === enrollment.id && currentAction === 'approve') return;
    
    setActionLoading(enrollment.id);
    setCurrentAction('approve');
    
    try {
      console.log(`Approving enrollment ${enrollment.id}`);
      const res = await approveEnrollment(enrollment.id);
      
      if (res.success) {
        // 🆕 IMMEDIATE UI UPDATE
        setEnrollments(prev => 
          prev.map(e => 
            e.id === enrollment.id 
              ? { ...e, status: 'APPROVED' }
              : e
          )
        );
        
        showSuccess(
          "Enrollment Approved!",
          <div className="text-start">
            <p><strong>Enrollment ID:</strong> #{enrollment.id}</p>
            <p><strong>Employee:</strong> #{enrollment.employeeId}</p>
            <p><strong>Course:</strong> #{enrollment.courseId}</p>
            <p className="mb-0 text-success">✅ Employee can now access the course!</p>
          </div>
        );
      } else {
        showError(
          "Approval Failed",
          <div className="text-start">
            <p><strong>Enrollment ID:</strong> #{enrollment.id}</p>
            <p><strong>Error:</strong> {res.body?.message || 'Unknown error'}</p>
            <p className="mb-0">Please try again.</p>
          </div>
        );
      }
    } catch (error) {
      console.error("Approve error:", error);
      showError(
        "Network Error",
        <div className="text-start">
          <p><strong>Enrollment ID:</strong> #{enrollment.id}</p>
          <p><strong>Error:</strong> {error.message}</p>
          <p className="mb-0">Please check your connection and try again.</p>
        </div>
      );
    } finally {
      setActionLoading(null);
      setCurrentAction(null);
    }
  };

  // 🆕 FIXED: Improved reject function with better state management
  const handleReject = async (enrollment) => {
    // 🆕 PREVENT MULTIPLE CLICKS
    if (actionLoading === enrollment.id && currentAction === 'reject') return;
    
    showConfirm(
      "Confirm Rejection",
      <div className="text-start">
        <p><strong>Enrollment ID:</strong> #{enrollment.id}</p>
        <p><strong>Employee:</strong> #{enrollment.employeeId}</p>
        <p><strong>Course:</strong> #{enrollment.courseId}</p>
        <div className="alert alert-warning mt-2">
          <strong>⚠️ Note:</strong> The employee will be notified about this rejection.
        </div>
      </div>,
      async () => {
        setActionLoading(enrollment.id);
        setCurrentAction('reject');
        
        try {
          console.log(`Rejecting enrollment ${enrollment.id}`);
          const res = await rejectEnrollment(enrollment.id);
          
          if (res.ok && res.body && res.body.success) {
            // 🆕 IMMEDIATE UI UPDATE
            setEnrollments(prev => 
              prev.map(e => 
                e.id === enrollment.id 
                  ? { ...e, status: 'REJECTED' }
                  : e
              )
            );
            
            showSuccess(
              "Enrollment Rejected",
              <div className="text-start">
                <p><strong>Enrollment ID:</strong> #{enrollment.id}</p>
                <p><strong>Employee:</strong> #{enrollment.employeeId}</p>
                <p><strong>Course:</strong> #{enrollment.courseId}</p>
                <p className="mb-0 text-danger">❌ Enrollment request has been rejected.</p>
              </div>
            );
          } else {
            showError(
              "Rejection Failed",
              <div className="text-start">
                <p><strong>Enrollment ID:</strong> #{enrollment.id}</p>
                <p><strong>Error:</strong> {res.body?.message || 'Unknown error'}</p>
                <p className="mb-0">Please try again.</p>
              </div>
            );
          }
        } catch (error) {
          console.error("Reject error:", error);
          showError(
            "Network Error",
            <div className="text-start">
              <p><strong>Enrollment ID:</strong> #{enrollment.id}</p>
              <p><strong>Error:</strong> {error.message}</p>
              <p className="mb-0">Please check your connection and try again.</p>
            </div>
          );
        } finally {
          setActionLoading(null);
          setCurrentAction(null);
        }
      }
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING_APPROVAL': { class: 'bg-warning', text: '⏳ Pending' },
      'APPROVED': { class: 'bg-success', text: '✅ Approved' },
      'REJECTED': { class: 'bg-danger', text: '❌ Rejected' },
      'IN_PROGRESS': { class: 'bg-info', text: '📚 In Progress' },
      'COMPLETED': { class: 'bg-primary', text: '🎓 Completed' }
    };
    const config = statusConfig[status] || { class: 'bg-secondary', text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  if (loading) return <div className="text-center mt-4">Loading enrollments...</div>;

  return (
    <div className="container-fluid">
      {/* 🆕 ADD POPUP MODAL */}
      <PopupModal
        show={popup.show}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={hidePopup}
        onConfirm={popup.onConfirm}
      />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">✅ Course Enrollment Approvals</h2>
          <small className="text-muted">
            Review and manage course enrollment requests
          </small>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <span className="me-3">Welcome, {user.name}</span>
          <button className="btn btn-outline-secondary" onClick={loadEnrollments}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-3">
          <label className="form-label">Filter by Status:</label>
          <select 
            className="form-select" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Enrollments</option>
            <option value="PENDING_APPROVAL">⏳ Pending Approval</option>
            <option value="APPROVED">✅ Approved</option>
            <option value="REJECTED">❌ Rejected</option>
            <option value="IN_PROGRESS">📚 In Progress</option>
            <option value="COMPLETED">🎓 Completed</option>
          </select>
        </div>
        <div className="col-md-9 d-flex align-items-end">
          <small className="text-muted">
            📊 Showing {enrollments.length} enrollment(s)
          </small>
        </div>
      </div>

      {/* LIST VIEW ONLY */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>Enrollment ID</th>
              <th>Employee ID</th>
              <th>Course ID</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Enrolled Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  <div className="text-muted">
                    No enrollments found for the selected filter.
                  </div>
                </td>
              </tr>
            ) : (
              enrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td>#{enrollment.id}</td>
                  <td>
                    <span className="badge bg-primary">#{enrollment.employeeId}</span>
                  </td>
                  <td>
                    <span className="badge bg-info">#{enrollment.courseId}</span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                        <div 
                          className="progress-bar" 
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                      <small>{enrollment.progress}%</small>
                    </div>
                  </td>
                  <td>{getStatusBadge(enrollment.status)}</td>
                  <td>
                    {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </td>
                  <td>
                    {enrollment.status === 'PENDING_APPROVAL' && (
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-success"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(enrollment);
                          }}
                          disabled={actionLoading === enrollment.id}
                          title="Approve Enrollment"
                        >
                          {actionLoading === enrollment.id && currentAction === 'approve' ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            '✅ Approve'
                          )}
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(enrollment);
                          }}
                          disabled={actionLoading === enrollment.id}
                          title="Reject Enrollment"
                        >
                          {actionLoading === enrollment.id && currentAction === 'reject' ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            '❌ Reject'
                          )}
                        </button>
                      </div>
                    )}
                    {enrollment.status !== 'PENDING_APPROVAL' && (
                      <small className="text-muted">No actions available</small>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <small className="text-muted">
          📊 Total: {enrollments.length} enrollment(s)
        </small>
      </div>
    </div>
  );
}