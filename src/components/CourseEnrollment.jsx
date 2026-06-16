import React, { useEffect, useState } from "react";
import { getCourses, enrollCourse, getMyCourses } from "../services/api";

// 🆕 NEW: Professional Popup Modal Component
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
        title: "Pending Approval"
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
      ENROLLED: {
        icon: "✅",
        bgColor: "bg-success",
        btnColor: "btn-success",
        title: "Already Enrolled"
      },
      PENDING: {
        icon: "📝",
        bgColor: "bg-warning",
        btnColor: "btn-warning",
        title: "Enrollment Request"
      },
      REJECTED: {
        icon: "🚫",
        bgColor: "bg-danger",
        btnColor: "btn-danger",
        title: "Enrollment Rejected"
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
            <button 
              type="button" 
              className={`btn ${config.btnColor} w-100`}
              onClick={onConfirm || onClose}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseEnrollment({ user }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [viewMode, setViewMode] = useState("grid");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  
  // 🆕 NEW: Popup state management
  const [popup, setPopup] = useState({
    show: false,
    type: "INFO",
    title: "",
    message: "",
    onConfirm: null
  });

  useEffect(() => {
    loadCourses();
    loadMyEnrollments();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await getCourses();
      if (res.success) {
        setCourses(res.data || []);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
      setCourses([]);
      showPopup("ERROR", "Load Error", "Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadMyEnrollments = async () => {
    try {
      const res = await getMyCourses(user.id);
      if (res.success) {
        setEnrolledCourses(res.data || []);
      }
    } catch (error) {
      console.error("Failed to load enrollments:", error);
      showPopup("ERROR", "Load Error", "Failed to load your enrollments.");
    }
  };

  // 🆕 NEW: Professional popup system
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

  const showMessage = (text, type = "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.some(enrollment => enrollment.course?.id === courseId);
  };

  const getEnrollmentStatus = (courseId) => {
    const enrollment = enrolledCourses.find(enrollment => enrollment.course?.id === courseId);
    return enrollment ? enrollment.status : null;
  };

  const getEnrollmentData = (courseId) => {
    return enrolledCourses.find(enrollment => enrollment.course?.id === courseId);
  };

  const handleEnroll = async (course) => {
    // Check if already enrolled
    if (isEnrolled(course.id)) {
      const enrollment = getEnrollmentData(course.id);
      const status = enrollment?.status;
      
      if (status === "APPROVED") {
        showPopup(
          "ENROLLED",
          "Already Enrolled",
          <div className="text-start">
            <p><strong>Course:</strong> {course.title}</p>
            <p><strong>Status:</strong> <span className="text-success">Approved</span></p>
            <p className="mb-0">🎯 You can access this course in "My Courses"</p>
          </div>
        );
      } else if (status === "PENDING_APPROVAL") {
        showPopup(
          "PENDING",
          "Enrollment Pending",
          <div className="text-start">
            <p><strong>Course:</strong> {course.title}</p>
            <p><strong>Status:</strong> <span className="text-warning">Waiting for Manager Approval</span></p>
            <p className="mb-0">⏰ You will be notified once approved</p>
          </div>
        );
      } else if (status === "REJECTED") {
        showPopup(
          "REJECTED",
          "Enrollment Rejected",
          <div className="text-start">
            <p><strong>Course:</strong> {course.title}</p>
            <p><strong>Status:</strong> <span className="text-danger">Rejected</span></p>
            <p className="mb-0">📞 Contact your manager for details</p>
          </div>
        );
      } else {
        showPopup(
          "INFO",
          "Already Enrolled",
          <div className="text-start">
            <p><strong>Course:</strong> {course.title}</p>
            <p><strong>Status:</strong> {status || "Unknown"}</p>
          </div>
        );
      }
      return;
    }

    setEnrollingCourseId(course.id);

    try {
      const enrollmentData = {
        courseId: course.id,
        employeeId: user.id,
      };

      // 🆕 NEW: Show immediate feedback popup
      if (course.paid) {
        showPopup(
          "PENDING",
          "Enrollment Request Submitted",
          <div className="text-start">
            <p><strong>Course:</strong> {course.title}</p>
            <p><strong>Type:</strong> <span className="text-warning">Paid Course</span></p>
            <p><strong>Status:</strong> <span className="text-warning">Pending Manager Approval</span></p>
            <p className="mb-0">📧 You will receive an email once approved</p>
          </div>
        );
      } else {
        showPopup(
          "SUCCESS",
          "Successfully Enrolled!",
          <div className="text-start">
            <p><strong>Course:</strong> {course.title}</p>
            <p><strong>Type:</strong> <span className="text-success">Free Course</span></p>
            <p><strong>Status:</strong> <span className="text-success">Auto Approved</span></p>
            <p className="mb-0">🚀 Start learning immediately in 'My Courses'!</p>
          </div>
        );
      }

      const res = await enrollCourse(enrollmentData);

      if (res.success) {
        const enrollment = res.data;
        
        setEnrolledCourses(prev => [...prev, enrollment]);
        
        if (course.paid && enrollment.status === "PENDING_APPROVAL") {
          showMessage(
            `⏳ Enrollment request submitted for "${course.title}"! Waiting for approval.`,
            "warning"
          );
        } else {
          showMessage(
            `✅ Successfully enrolled in "${course.title}"!`,
            "success"
          );
        }
      } else {
        const errorMsg = res.body?.message || "Unknown error";
        if (errorMsg.includes("Already enrolled")) {
          loadMyEnrollments();
          showPopup(
            "INFO",
            "Already Enrolled",
            <div className="text-start">
              <p><strong>Course:</strong> {course.title}</p>
              <p className="mb-0">You are already enrolled in this course. Check 'My Courses' to continue.</p>
            </div>
          );
        } else {
          showPopup(
            "ERROR",
            "Enrollment Failed",
            <div className="text-start">
              <p><strong>Course:</strong> {course.title}</p>
              <p><strong>Error:</strong> {errorMsg}</p>
              <p className="mb-0">Please try again.</p>
            </div>
          );
        }
      }
    } catch (error) {
      showPopup(
        "ERROR",
        "Network Error",
        <div className="text-start">
          <p><strong>Course:</strong> {course.title}</p>
          <p className="mb-0">Unable to enroll. Please check your internet connection and try again.</p>
        </div>
      );
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const getEnrollButtonText = (course) => {
    if (enrollingCourseId === course.id) {
      return "⏳ Processing...";
    }
    
    if (isEnrolled(course.id)) {
      const status = getEnrollmentStatus(course.id);
      switch (status) {
        case "APPROVED":
          return "✅ Enrolled";
        case "PENDING_APPROVAL":
          return "⏳ Pending Approval";
        case "REJECTED":
          return "❌ Rejected";
        default:
          return "📝 Enrolled";
      }
    }
    
    return course.paid ? "📩 Request Enrollment" : "🎯 Enroll Now";
  };

  const getEnrollButtonClass = (course) => {
    if (enrollingCourseId === course.id) {
      return "btn-secondary";
    }
    
    if (isEnrolled(course.id)) {
      const status = getEnrollmentStatus(course.id);
      switch (status) {
        case "APPROVED":
          return "btn-success";
        case "PENDING_APPROVAL":
          return "btn-warning";
        case "REJECTED":
          return "btn-danger";
        default:
          return "btn-info";
      }
    }
    
    return course.paid ? "btn-warning" : "btn-success";
  };

  const isEnrollButtonDisabled = (course) => {
    return enrollingCourseId === course.id || isEnrolled(course.id);
  };

  if (loading) return (
    <div className="container-fluid">
      <div className="text-center mt-5 py-5">
        <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading available courses...</p>
      </div>
    </div>
  );

  return (
    <div className="container-fluid">
      {/* 🆕 NEW: Professional Popup Modal */}
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
          <h2 className="mb-1 fw-bold">📚 Course Enrollment</h2>
          <small className="text-muted">
            Browse and enroll in available courses
          </small>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <span className="me-3">Welcome, {user.name}</span>
          <div className="btn-group">
            <button
              className={`btn btn-outline-dark ${
                viewMode === "grid" ? "active" : ""
              }`}
              onClick={() => setViewMode("grid")}
            >
              ⏹️ Grid
            </button>
            <button
              className={`btn btn-outline-dark ${
                viewMode === "list" ? "active" : ""
              }`}
              onClick={() => setViewMode("list")}
            >
              📋 List
            </button>
            <button
              className={`btn btn-outline-dark ${
                viewMode === "horizontal" ? "active" : ""
              }`}
              onClick={() => setViewMode("horizontal")}
            >
              ➡️ Horizontal
            </button>
          </div>
          <button 
            className="btn btn-outline-primary" 
            onClick={() => {
              loadCourses();
              loadMyEnrollments();
              showMessage("Data refreshed successfully", "success");
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {message.text && (
        <div
          className={`alert alert-${
            message.type === "error" ? "danger" : message.type
          } mt-3`}
        >
          {message.text}
        </div>
      )}

      {/* Enrollment Status Summary */}
      {enrolledCourses.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card bg-light">
              <div className="card-body py-3">
                <div className="row text-center">
                  <div className="col-md-3">
                    <h5 className="mb-1 text-primary">{enrolledCourses.length}</h5>
                    <small className="text-muted">Total Enrolled</small>
                  </div>
                  <div className="col-md-3">
                    <h5 className="mb-1 text-success">
                      {enrolledCourses.filter(e => e.status === "APPROVED").length}
                    </h5>
                    <small className="text-muted">Approved</small>
                  </div>
                  <div className="col-md-3">
                    <h5 className="mb-1 text-warning">
                      {enrolledCourses.filter(e => e.status === "PENDING_APPROVAL").length}
                    </h5>
                    <small className="text-muted">Pending</small>
                  </div>
                  <div className="col-md-3">
                    <h5 className="mb-1 text-danger">
                      {enrolledCourses.filter(e => e.status === "REJECTED").length}
                    </h5>
                    <small className="text-muted">Rejected</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="row">
          {courses.length === 0 ? (
            <div className="col-12">
              <div className="alert alert-info text-center py-5">
                <div className="mb-3" style={{fontSize: '4rem'}}>📚</div>
                <h5>No courses available at the moment.</h5>
                <p>Please check back later or contact administrator.</p>
              </div>
            </div>
          ) : (
            courses.map((course) => {
              const isCourseEnrolled = isEnrolled(course.id);
              const enrollmentStatus = getEnrollmentStatus(course.id);
              
              return (
                <div key={course.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header bg-transparent">
                      <h5 className="card-title mb-1">{course.title}</h5>
                      <small className="text-muted">{course.category}</small>
                      {isCourseEnrolled && (
                        <div className="mt-2">
                          <span className={`badge ${
                            enrollmentStatus === "APPROVED" ? "bg-success" :
                            enrollmentStatus === "PENDING_APPROVAL" ? "bg-warning" :
                            enrollmentStatus === "REJECTED" ? "bg-danger" : "bg-info"
                          }`}>
                            {enrollmentStatus === "APPROVED" ? "✅ Approved" :
                             enrollmentStatus === "PENDING_APPROVAL" ? "⏳ Pending Approval" :
                             enrollmentStatus === "REJECTED" ? "❌ Rejected" : "Enrolled"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="card-body">
                      <p className="card-text">
                        {course.description || "No description available."}
                      </p>
                      <div className="mb-2">
                        <strong>Duration:</strong> {course.durationHours} hours
                      </div>
                      <div className="mb-3">
                        <strong>Type:</strong>
                        <span
                          className={`badge ${
                            course.paid ? "bg-warning" : "bg-success"
                          } ms-2`}
                        >
                          {course.paid ? `Paid - $${course.price}` : "Free"}
                        </span>
                      </div>
                      <div className="mb-2">
                        <strong>Status:</strong>
                        <span
                          className={`badge ${
                            course.status === "ACTIVE"
                              ? "bg-success"
                              : "bg-secondary"
                          } ms-2`}
                        >
                          {course.status}
                        </span>
                      </div>
                    </div>
                    <div className="card-footer bg-transparent">
                      <button
                        className={`btn w-100 ${getEnrollButtonClass(course)}`}
                        onClick={() => handleEnroll(course)}
                        disabled={isEnrollButtonDisabled(course)}
                      >
                        {getEnrollButtonText(course)}
                      </button>
                      {isCourseEnrolled && enrollmentStatus === "APPROVED" && (
                        <div className="text-center mt-2">
                          <small className="text-success">
                            ✅ Access this course in "My Courses"
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="card">
          <div className="card-body p-0">
            {courses.length === 0 ? (
              <div className="text-center py-5">
                <div className="alert alert-info">
                  <h5>No courses available at the moment.</h5>
                  <p>Please check back later or contact administrator.</p>
                </div>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {courses.map((course) => {
                  const isCourseEnrolled = isEnrolled(course.id);
                  const enrollmentStatus = getEnrollmentStatus(course.id);
                  
                  return (
                    <div key={course.id} className="list-group-item">
                      <div className="row align-items-center">
                        <div className="col-md-3">
                          <h6 className="mb-1 fw-bold">{course.title}</h6>
                          <p className="text-muted small mb-0">
                            {course.description}
                          </p>
                          {isCourseEnrolled && (
                            <small className={`${
                              enrollmentStatus === "APPROVED" ? "text-success" :
                              enrollmentStatus === "PENDING_APPROVAL" ? "text-warning" :
                              "text-danger"
                            }`}>
                              {enrollmentStatus === "APPROVED" ? "✅ Approved" :
                               enrollmentStatus === "PENDING_APPROVAL" ? "⏳ Pending Approval" :
                               "❌ Rejected"}
                            </small>
                          )}
                        </div>
                        <div className="col-md-2">
                          <span className="badge bg-secondary">
                            {course.category}
                          </span>
                        </div>
                        <div className="col-md-1">
                          <small>
                            <strong>{course.durationHours}h</strong>
                          </small>
                        </div>
                        <div className="col-md-2">
                          <span
                            className={`badge ${
                              course.paid ? "bg-warning" : "bg-success"
                            }`}
                          >
                            {course.paid ? `Paid - $${course.price}` : "Free"}
                          </span>
                        </div>
                        <div className="col-md-2">
                          <span
                            className={`badge ${
                              course.status === "ACTIVE"
                                ? "bg-success"
                                : "bg-secondary"
                            }`}
                          >
                            {course.status}
                          </span>
                        </div>
                        <div className="col-md-2">
                          <button
                            className={`btn btn-sm ${getEnrollButtonClass(course)}`}
                            onClick={() => handleEnroll(course)}
                            disabled={isEnrollButtonDisabled(course)}
                          >
                            {getEnrollButtonText(course)}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Horizontal View */}
      {viewMode === "horizontal" && (
        <div className="horizontal-view-container">
          {courses.length === 0 ? (
            <div className="alert alert-info text-center">
              <h5>No courses available at the moment.</h5>
              <p>Please check back later or contact administrator.</p>
            </div>
          ) : (
            <div className="horizontal-scroll-wrapper">
              {courses.map((course) => {
                const isCourseEnrolled = isEnrolled(course.id);
                const enrollmentStatus = getEnrollmentStatus(course.id);
                
                return (
                  <div key={course.id} className="horizontal-card">
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className="badge bg-secondary">
                            {course.category}
                          </span>
                          <div>
                            <span
                              className={`badge ${
                                course.status === "ACTIVE"
                                  ? "bg-success"
                                  : "bg-secondary"
                              } me-1`}
                            >
                              {course.status}
                            </span>
                            {isCourseEnrolled && (
                              <span className={`badge ${
                                enrollmentStatus === "APPROVED" ? "bg-success" :
                                enrollmentStatus === "PENDING_APPROVAL" ? "bg-warning" :
                                "bg-danger"
                              }`}>
                                {enrollmentStatus === "APPROVED" ? "✅" :
                                 enrollmentStatus === "PENDING_APPROVAL" ? "⏳" : "❌"}
                              </span>
                            )}
                          </div>
                        </div>

                        <h6 className="fw-bold mb-2">{course.title}</h6>
                        <p className="text-muted small mb-3">
                          {course.description || "No description available."}
                        </p>

                        <div className="mb-3">
                          <div className="small">
                            <strong>Duration:</strong> {course.durationHours}{" "}
                            hours
                          </div>
                          <div className="small">
                            <strong>Type:</strong>
                            <span
                              className={`badge ${
                                course.paid ? "bg-warning" : "bg-success"
                              } ms-1`}
                            >
                              {course.paid ? `Paid - $${course.price}` : "Free"}
                            </span>
                          </div>
                          {isCourseEnrolled && (
                            <div className="small mt-1">
                              <strong>Status:</strong>
                              <span className={`${
                                enrollmentStatus === "APPROVED" ? "text-success" :
                                enrollmentStatus === "PENDING_APPROVAL" ? "text-warning" :
                                "text-danger"
                              } ms-1`}>
                                {enrollmentStatus}
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          className={`btn w-100 ${getEnrollButtonClass(course)}`}
                          onClick={() => handleEnroll(course)}
                          disabled={isEnrollButtonDisabled(course)}
                        >
                          {getEnrollButtonText(course)}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}