import React, { useEffect, useState } from "react";
import {
  getMyCourses,
  checkExamEligibility,
  updateProgress,
  getCourseMaterials,
  downloadMaterial,
  incrementProgress,
  markContentComplete,
  enrollCourse// ✅ ADDED: Import enrollCourse function
} from "../services/api";

export default function MyCourses({ user }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseContent, setShowCourseContent] = useState(false);
  const [courseMaterials, setCourseMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadMyCourses();
    }
  }, [user?.id]);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const loadMyCourses = async () => {
    try {
      setLoading(true);
      const res = await getMyCourses(user.id);
      console.log("📚 DEBUG - Backend response:", res);
      
      if (res.ok && res.body && res.body.success) {
        const coursesData = res.body.data || [];
        console.log("📚 DEBUG - Courses data structure:", coursesData);
        
        setCourses(coursesData);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 IMPROVED: Handle mandatory course access with enrollment creation
  const handleAccessCourse = async (course) => {
    console.log("🔍 DEBUG - Course object:", course);
    
    // ✅ FIXED: Handle both regular and mandatory courses
    const courseStatus = course.status || (course.enrollmentType === 'MANDATORY' ? 'APPROVED' : course.status);
    
    if (courseStatus !== "APPROVED" && course.enrollmentType !== 'MANDATORY') {
      alert(`❌ COURSE NOT AVAILABLE\n\nCourse: ${course.course?.title}\n\nStatus: ${courseStatus}\n\nYou can only access approved courses.`);
      return;
    }
    
    // 🆕 ADDED: Auto-enroll for mandatory courses without enrollment
    if (course.enrollmentType === 'MANDATORY' && !course.id) {
      try {
        alert(`📚 MANDATORY COURSE ENROLLMENT\n\nCourse: ${course.course?.title}\n\nEnrolling you in this mandatory course...`);
        
        const enrollResponse = await enrollCourse({
          courseId: course.course.id,
          employeeId: user.id
        });
        
        if (enrollResponse.ok && enrollResponse.body && enrollResponse.body.success) {
          alert("✅ Successfully enrolled in mandatory course! Loading course content...");
          // Refresh courses to get the updated enrollment
          await loadMyCourses();
          
          // Find the updated course with enrollment ID
          const updatedCourses = await getMyCourses(user.id);
          if (updatedCourses.ok && updatedCourses.body && updatedCourses.body.success) {
            const updatedCourse = updatedCourses.body.data.find(c => 
              c.course?.id === course.course.id && c.id
            );
            if (updatedCourse) {
              course = updatedCourse;
            }
          }
        } else {
          alert("❌ Failed to enroll in mandatory course. Please try again.");
          return;
        }
      } catch (error) {
        console.error("Failed to enroll in mandatory course:", error);
        alert("❌ Network error during enrollment. Please try again.");
        return;
      }
    }
    
    setSelectedCourse(course);
    setLoadingMaterials(true);
    setCourseMaterials([]);
    
    try {
      const courseId = course.course?.id || course.id;
      if (!courseId) {
        throw new Error("Course ID not found");
      }
      
      const res = await getCourseMaterials(courseId);
      if (res.ok && res.body && res.body.success) {
        const materials = res.body.data || [];
        const materialsWithFlags = materials.map(material => ({
          ...material,
          completed: false
        }));
        setCourseMaterials(materialsWithFlags);
        
        if (materials.length === 0) {
          alert(`📚 COURSE ACCESSED\n\nCourse: ${course.course?.title}\n\nNo study materials available yet.\nPlease check back later.`);
        } else {
          alert(`✅ COURSE ACCESSED\n\nCourse: ${course.course?.title}\n\n📚 ${materials.length} materials loaded\n🎯 Ready to learn!`);
        }
      } else {
        setCourseMaterials([]);
        alert("⚠️ No study materials available for this course yet.");
      }
    } catch (error) {
      console.error("Failed to load materials:", error);
      setCourseMaterials([]);
      alert("❌ Failed to load course materials. Please try again.");
    } finally {
      setLoadingMaterials(false);
    }
    
    setShowCourseContent(true);
  };

  // 🆕 UPDATED: Enhanced material viewing for mandatory courses
  const handleViewMaterial = async (material) => {
    if (!material) {
      alert("❌ Invalid material data.");
      return;
    }

    setSelectedMaterial(material);
    
    const materialType = material.type?.toLowerCase();
    
    if (materialType === 'video') {
      setShowMediaViewer(true);
    } else if (materialType === 'pdf' || materialType === 'document') {
      try {
        if (!material.id) {
          throw new Error("Material ID is missing");
        }

        const blob = await downloadMaterial(material.id);
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
        setPdfViewerOpen(true);
      } catch (error) {
        console.error("Failed to load PDF:", error);
        
        if (material.url) {
          if (material.url.toLowerCase().endsWith('.pdf')) {
            setPdfViewerOpen(true);
          } else {
            window.open(material.url, '_blank');
          }
        } else {
          alert("❌ Unable to load PDF. Please try downloading the file instead.");
          handleDownloadMaterial(material);
        }
      }
    } else {
      alert(`ℹ️ Material Type: ${material.type}\n\nThis material type may need special handling.`);
    }
  };

  // 🆕 UPDATED: Handle PDF/document download for mandatory courses
  const handleDownloadMaterial = async (material) => {
    if (!material?.id) {
      alert("❌ Invalid material data. Cannot download.");
      return;
    }

    try {
      alert(`📥 DOWNLOADING ${material.type?.toUpperCase()}\n\n${material.title}\n\nYour download will start shortly...`);
      
      const blob = await downloadMaterial(material.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = material.title 
        ? `${material.title.replace(/[^a-zA-Z0-9]/g, '_')}.${material.type?.toLowerCase() || 'file'}`
        : `download_${material.id}.${material.type?.toLowerCase() || 'file'}`;
      
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error("Error downloading file:", error);
      
      if (material.url) {
        window.open(material.url, '_blank');
      } else {
        alert(`❌ Failed to download ${material.type?.toLowerCase()}. Please try again.`);
      }
    }
  };

  // Close PDF viewer and clean up
  const handleClosePdfViewer = () => {
    setPdfViewerOpen(false);
    setSelectedMaterial(null);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  // Open PDF in new tab as fallback
  const handleOpenPdfInNewTab = async (material) => {
    if (!material?.id) {
      alert("❌ Invalid material data.");
      return;
    }

    try {
      const blob = await downloadMaterial(material.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error("Failed to open PDF in new tab:", error);
      alert("❌ Failed to open PDF. Please try downloading instead.");
    }
  };

  // 🆕 COMPLETELY UPDATED: Mark content as completed for both regular and mandatory courses
  const handleMarkComplete = async (contentType, contentTitle) => {
    console.log("🔍 DEBUG - selectedCourse in handleMarkComplete:", selectedCourse);
    
    if (!selectedCourse) {
      alert("❌ No course selected. Please select a course first.");
      return;
    }
    
    // 🆕 FIXED: Handle mandatory courses without enrollment ID
    let enrollmentId;
    
    if (selectedCourse.id) {
      enrollmentId = selectedCourse.id;
    } else if (selectedCourse.enrollmentType === 'MANDATORY') {
      // For mandatory courses without enrollment ID, auto-create enrollment
      try {
        alert(`📚 MANDATORY COURSE\n\nCourse: ${selectedCourse.course?.title}\n\nCreating enrollment for this mandatory course...`);
        
        // Call API to create enrollment for mandatory course
        const enrollResponse = await enrollCourse({
          courseId: selectedCourse.course.id,
          employeeId: user.id
        });
        
        if (enrollResponse.ok && enrollResponse.body && enrollResponse.body.success) {
          enrollmentId = enrollResponse.body.data.id;
          alert("✅ Successfully enrolled in mandatory course! You can now track progress.");
          
          // Refresh courses to get the new enrollment ID
          await loadMyCourses();
          
          // Update selected course with new enrollment ID
          const updatedCourses = await getMyCourses(user.id);
          if (updatedCourses.ok && updatedCourses.body && updatedCourses.body.success) {
            const updatedCourse = updatedCourses.body.data.find(c => 
              c.course?.id === selectedCourse.course.id && c.id
            );
            if (updatedCourse) {
              setSelectedCourse(updatedCourse);
            }
          }
        } else {
          alert("❌ Failed to enroll in mandatory course. Please try again.");
          return;
        }
      } catch (error) {
        console.error("Failed to enroll in mandatory course:", error);
        alert("❌ Network error during enrollment. Please try again.");
        return;
      }
    } else {
      console.error("❌ No enrollment ID found in selectedCourse:", selectedCourse);
      alert("❌ Cannot find enrollment ID. Please refresh and try again.");
      return;
    }

    // Validate the ID
    const numericEnrollmentId = Number(enrollmentId);
    if (isNaN(numericEnrollmentId) || numericEnrollmentId <= 0) {
      console.error("❌ Invalid enrollment ID:", enrollmentId);
      alert("❌ Invalid enrollment ID. Please contact support.");
      return;
    }

    console.log("📝 Making API call with enrollment ID:", numericEnrollmentId);
    
    try {
      const res = await markContentComplete(numericEnrollmentId, contentType, contentTitle);
      
      if (res.ok && res.body && res.body.success) {
        const newProgress = res.body.data.progress;
        const newStatus = res.body.data.status;
        
        alert(`✅ CONTENT COMPLETED\n\nCourse: ${selectedCourse.course?.title}\n\n${contentType}: ${contentTitle}\n\nProgress: ${newProgress}%\nStatus: ${newStatus}\n\nGreat job! 🎉`);
        
        // Refresh data
        loadMyCourses();
        
        // Update selected course progress and status
        setSelectedCourse(prev => ({
          ...prev,
          progress: newProgress,
          status: newStatus
        }));
      } else {
        const errorMsg = res.body?.message || "Failed to mark content as completed. Please try again.";
        alert(`❌ ${errorMsg}`);
      }
    } catch (error) {
      console.error("Error marking content complete:", error);
      alert("❌ Network error. Please check your connection.");
    }
  };

  // 🆕 UPDATED: Auto progress tracking for videos
  const handleVideoTimeUpdate = (event, material) => {
    if (!selectedCourse?.id || !material) return;
    
    const video = event.target;
    const duration = video.duration;
    const currentTime = video.currentTime;
    
    // If video has 30 seconds or less remaining, mark as completed
    if (duration - currentTime <= 30 && duration > 0 && !material.completed) {
      material.completed = true;
      
      const progressIncrement = 25;
      
      // Validate enrollment ID
      const numericEnrollmentId = Number(selectedCourse.id);
      if (isNaN(numericEnrollmentId) || numericEnrollmentId <= 0) return;
      
      incrementProgress(numericEnrollmentId, progressIncrement)
        .then(res => {
          if (res.ok && res.body && res.body.success) {
            console.log(`✅ Video "${material.title}" nearly completed - Progress updated`);
            
            loadMyCourses();
            
            if (selectedCourse) {
              setSelectedCourse(prev => ({
                ...prev,
                progress: res.body.data.progress,
                status: res.body.data.status
              }));
            }
          }
        })
        .catch(error => {
          console.error("Failed to update progress:", error);
        });
    }
  };

  // 🆕 UPDATED: Handle video ended
  const handleVideoEnded = (material) => {
    if (!material || !selectedCourse) return;
    
    if (!material.completed) {
      material.completed = true;
      handleMarkComplete("Video", material.title);
    }
  };

  // 🆕 UPDATED: Enhanced exam handling for both course types
  const handleTakeExam = async (enrollmentId, courseTitle) => {
    if (!enrollmentId) {
      alert("❌ Invalid enrollment ID.");
      return;
    }

    const numericEnrollmentId = Number(enrollmentId);
    if (isNaN(numericEnrollmentId) || numericEnrollmentId <= 0) {
      alert("❌ Invalid enrollment ID format.");
      return;
    }

    const course = courses.find(c => c.id === numericEnrollmentId);
    
    if (course?.progress === 100 && (course?.status === "APPROVED" || course?.enrollmentType === 'MANDATORY')) {
      alert(`🎓 EXAM ELIGIBILITY CONFIRMED!\n\nCourse: ${courseTitle}\n\n✅ You can take the exam now!\n📊 Progress: 100%\n📝 Status: ${course.status || 'Mandatory'}\n\nGood luck! 🍀`);
    } else {
      alert(`📝 EXAM REQUIREMENTS\n\nCourse: ${courseTitle}\n\n❌ Cannot take exam yet\n📊 Progress: ${course?.progress || 0}%\n📝 Status: ${course?.status || "Mandatory"}\n\n✅ Complete 100% of course first.`);
    }

    try {
      const res = await checkExamEligibility(numericEnrollmentId);
    } catch (error) {
      console.error("Exam eligibility check failed:", error);
    }
  };

  // 🆕 UPDATED: Progress update for both course types
  const handleUpdateProgress = async (enrollmentId, currentProgress, courseTitle, silent = false) => {
    // 🆕 ADD: Handle mandatory courses without enrollment ID
    if (!enrollmentId && selectedCourse?.enrollmentType === 'MANDATORY') {
      alert("📚 This is a mandatory course. Please access the course first to create enrollment.");
      return;
    }

    const numericEnrollmentId = Number(enrollmentId);
    if (isNaN(numericEnrollmentId) || numericEnrollmentId <= 0) {
      alert("❌ Invalid enrollment ID format.");
      return;
    }

    let progressValue;

    if (!silent) {
      const newProgressInput = prompt(
        `📊 UPDATE PROGRESS\n\nCourse: ${courseTitle}\nCurrent: ${currentProgress}%\n\nEnter new progress (0-100):`,
        currentProgress
      );
      
      if (newProgressInput === null) return;
      
      progressValue = parseInt(newProgressInput);
      if (progressValue < 0 || progressValue > 100 || isNaN(progressValue)) {
        alert("⚠️ Please enter a valid number between 0 and 100.");
        return;
      }
    } else {
      progressValue = currentProgress;
    }

    try {
      const res = await updateProgress(numericEnrollmentId, progressValue);
      if (res.ok && res.body && res.body.success) {
        if (!silent) {
          if (progressValue === 100) {
            alert(`✅ PROGRESS UPDATED!\n\nCourse: ${courseTitle}\nNew Progress: 100%\n\n🎉 Course Completed! You can now take the exam.`);
          } else {
            alert(`✅ PROGRESS UPDATED!\n\nCourse: ${courseTitle}\nNew Progress: ${progressValue}%\n\nKeep learning! 🚀`);
          }
        }
        loadMyCourses();
        
        if (selectedCourse && selectedCourse.id === numericEnrollmentId) {
          setSelectedCourse(prev => ({
            ...prev,
            progress: progressValue
          }));
        }
      } else {
        if (!silent) {
          const errorMsg = res.body?.message || "Failed to update progress. Please try again.";
          alert(`❌ ${errorMsg}`);
        }
      }
    } catch (error) {
      if (!silent) {
        alert("❌ Network error. Please check your connection.");
      }
    }
  };

  // 🆕 ADDED: Get course display title
  const getCourseTitle = (course) => {
    return course.course?.title || course.title || "Untitled Course";
  };

  // 🆕 ADDED: Get course display description
  const getCourseDescription = (course) => {
    return course.course?.description || course.description || "No description available.";
  };

  // 🆕 ADDED: Check if course is mandatory
  const isMandatoryCourse = (course) => {
    return course.enrollmentType === 'MANDATORY' || course.isMandatory;
  };

  // 🆕 ADDED: Get course status for display
  const getDisplayStatus = (course) => {
    if (course.enrollmentType === 'MANDATORY') {
      return 'MANDATORY';
    }
    return course.status || 'UNKNOWN';
  };

  // 🆕 ADDED: Get status badge with mandatory support
  const getStatusBadge = (course) => {
    const status = getDisplayStatus(course);
    
    const statusConfig = {
      MANDATORY: { class: "bg-danger", text: "📗 Mandatory", icon: "📗" },
      PENDING_APPROVAL: { class: "bg-warning", text: "⏳ Pending Approval", icon: "⏳" },
      APPROVED: { class: "bg-success", text: "✅ Approved", icon: "✅" },
      REJECTED: { class: "bg-danger", text: "❌ Rejected", icon: "❌" },
      IN_PROGRESS: { class: "bg-info", text: "📚 In Progress", icon: "📚" },
      COMPLETED: { class: "bg-primary", text: "🎓 Completed", icon: "🎓" },
    };
    
    const config = statusConfig[status] || {
      class: "bg-secondary",
      text: status,
      icon: "📎"
    };
    
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getProgressColor = (progress) => {
    if (progress === 100) return "success";
    if (progress >= 80) return "primary";
    if (progress >= 50) return "warning";
    if (progress > 0) return "info";
    return "secondary";
  };

  const getMaterialIcon = (type) => {
    const typeLower = type?.toLowerCase();
    switch (typeLower) {
      case 'video': return '🎥';
      case 'pdf': return '📄';
      case 'document': return '📝';
      default: return '📎';
    }
  };

  const getProgressText = (progress) => {
    if (progress === 0) return "Not Started";
    if (progress === 100) return "Completed! 🎉";
    if (progress >= 80) return "Almost There!";
    if (progress >= 50) return "Good Progress";
    return "Getting Started";
  };

  if (loading) return (
    <div className="container-fluid">
      <div className="text-center mt-5 py-5">
        <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading your courses...</p>
      </div>
    </div>
  );

  // 🆕 UPDATED: Statistics calculation with mandatory courses
  const allCourses = courses || [];
  const completedCourses = allCourses.filter(c => c.progress === 100).length;
  const inProgressCourses = allCourses.filter(c => c.progress > 0 && c.progress < 100).length;
  const notStartedCourses = allCourses.filter(c => c.progress === 0).length;
  const pendingApprovalCourses = allCourses.filter(c => c.status === 'PENDING_APPROVAL').length;
  const mandatoryCourses = allCourses.filter(c => isMandatoryCourse(c)).length;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">📖 My Courses</h2>
          <small className="text-muted">
            Access your courses, study materials, and track progress
          </small>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <span className="me-3">Welcome, {user?.firstName || 'User'}!</span>
          <div className="btn-group">
            <button
              className={`btn btn-outline-dark ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              ⏹️ Grid
            </button>
            <button
              className={`btn btn-outline-dark ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              📋 List
            </button>
          </div>
          <button className="btn btn-outline-primary" onClick={loadMyCourses}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* 🆕 UPDATED: Statistics Summary with Mandatory Courses */}
      {allCourses.length > 0 && (
        <div className="row mb-4">
          <div className="col-md-2">
            <div className="card bg-primary text-white">
              <div className="card-body text-center py-3">
                <h4>{allCourses.length}</h4>
                <small>Total Courses</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-danger text-white">
              <div className="card-body text-center py-3">
                <h4>{mandatoryCourses}</h4>
                <small>Mandatory</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-success text-white">
              <div className="card-body text-center py-3">
                <h4>{completedCourses}</h4>
                <small>Completed</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-warning text-white">
              <div className="card-body text-center py-3">
                <h4>{inProgressCourses}</h4>
                <small>In Progress</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-info text-white">
              <div className="card-body text-center py-3">
                <h4>{notStartedCourses}</h4>
                <small>Not Started</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-secondary text-white">
              <div className="card-body text-center py-3">
                <h4>{pendingApprovalCourses}</h4>
                <small>Pending Approval</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {allCourses.length === 0 ? (
        <div className="alert alert-info text-center py-5">
          <div className="mb-3" style={{fontSize: '4rem'}}>📚</div>
          <h4>No Courses Enrolled Yet</h4>
          <p className="mb-3">Start your learning journey by enrolling in available courses from the course catalog.</p>
          <a href="/course-enrollment" className="btn btn-primary btn-lg">
            🎯 Browse Available Courses
          </a>
        </div>
      ) : (
        <>
          {/* 🆕 UPDATED: Grid View with Mandatory Course Support */}
          {viewMode === "grid" && (
            <div className="row">
              {allCourses.map((item, index) => {
                const isMandatory = isMandatoryCourse(item);
                const courseTitle = getCourseTitle(item);
                const courseDescription = getCourseDescription(item);
                const displayStatus = getDisplayStatus(item);
                
                return (
                  <div key={index} className="col-md-6 col-lg-4 mb-4">
                    <div className={`card h-100 shadow-sm ${isMandatory ? 'border-danger' : ''}`}>
                      <div className="card-header">
                        <h5 className="card-title mb-1">
                          {courseTitle}
                          {isMandatory && <span className="ms-2">📗</span>}
                        </h5>
                        <div className="d-flex justify-content-between align-items-center">
                          {getStatusBadge(item)}
                          <small className="text-muted">
                            {item.course?.category || "Uncategorized"}
                          </small>
                        </div>
                      </div>
                      <div className="card-body">
                        <p className="card-text small text-muted">
                          {courseDescription}
                        </p>

                        {/* 🆕 UPDATED: Progress section for both course types */}
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <small>Progress</small>
                            <small>
                              <strong>{item.progress || 0}%</strong> - {getProgressText(item.progress || 0)}
                            </small>
                          </div>
                          <div className="progress" style={{ height: "10px" }}>
                            <div
                              className={`progress-bar bg-${getProgressColor(item.progress || 0)}`}
                              style={{ width: `${item.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="course-info small">
                          <div>
                            <strong>Duration:</strong> {item.course?.durationHours || 0}h
                          </div>
                          <div>
                            <strong>Type:</strong> 
                            <span className={`badge ${item.course?.paid ? 'bg-warning' : 'bg-success'} ms-1`}>
                              {item.course?.paid ? 'Paid' : 'Free'}
                            </span>
                            {isMandatory && (
                              <span className="badge bg-danger ms-1">Mandatory</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="card-footer">
                        <div className="d-grid gap-2">
                          {/* 🆕 UPDATED: Access button for mandatory courses */}
                          <button
                            className={`btn btn-sm ${isMandatory ? 'btn-danger' : 'btn-primary'}`}
                            onClick={() => handleAccessCourse(item)}
                            disabled={displayStatus === "PENDING_APPROVAL" && !isMandatory}
                          >
                            {isMandatory ? "📗 Access Mandatory Course" : 
                             displayStatus === "APPROVED" || displayStatus === "MANDATORY" ? "🎓 Access Course" : "⏳ Waiting Approval"}
                          </button>

                          {/* 🆕 UPDATED: Progress update for both course types */}
                          {(displayStatus === "APPROVED" || displayStatus === "MANDATORY" || displayStatus === "IN_PROGRESS") && (
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() =>
                                handleUpdateProgress(item.id, item.progress || 0, courseTitle)
                              }
                            >
                              Update Progress
                            </button>
                          )}

                          {/* 🆕 UPDATED: Exam button for completed courses */}
                          {item.progress === 100 && 
                           (displayStatus === "APPROVED" || displayStatus === "MANDATORY" || displayStatus === "COMPLETED") && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() =>
                                handleTakeExam(item.id, courseTitle)
                              }
                            >
                              🎓 Take Exam
                            </button>
                          )}

                          {item.progress < 100 && (displayStatus === "APPROVED" || displayStatus === "MANDATORY") && (
                            <small className="text-muted text-center">
                              Complete course to unlock exam
                            </small>
                          )}
                          
                          {/* 🆕 ADDED: Mandatory course notice */}
                          {isMandatory && (
                            <small className="text-danger text-center">
                              <strong>📗 Required Course</strong>
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 🆕 UPDATED: List View with Mandatory Course Support */}
          {viewMode === "list" && (
            <div className="card">
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {allCourses.map((item, index) => {
                    const isMandatory = isMandatoryCourse(item);
                    const courseTitle = getCourseTitle(item);
                    const displayStatus = getDisplayStatus(item);
                    
                    return (
                      <div key={index} className={`list-group-item ${isMandatory ? 'bg-light-warning' : ''}`}>
                        <div className="row align-items-center">
                          <div className="col-md-3">
                            <h6 className="mb-1 fw-bold">
                              {courseTitle}
                              {isMandatory && <span className="ms-2 text-danger">📗</span>}
                            </h6>
                            <small className="text-muted">{item.course?.category || "Uncategorized"}</small>
                            {isMandatory && (
                              <div>
                                <small className="text-danger fw-bold">Mandatory Course</small>
                              </div>
                            )}
                          </div>
                          <div className="col-md-2">
                            {getStatusBadge(item)}
                          </div>
                          <div className="col-md-3">
                            <div className="d-flex align-items-center">
                              <div className="progress flex-grow-1 me-2" style={{ height: "8px" }}>
                                <div
                                  className={`progress-bar bg-${getProgressColor(item.progress || 0)}`}
                                  style={{ width: `${item.progress || 0}%` }}
                                ></div>
                              </div>
                              <small><strong>{item.progress || 0}%</strong></small>
                            </div>
                            <small className="text-muted">{getProgressText(item.progress || 0)}</small>
                          </div>
                          <div className="col-md-4">
                            <div className="d-flex gap-1 flex-wrap">
                              <button
                                className={`btn btn-sm ${isMandatory ? 'btn-danger' : 'btn-primary'}`}
                                onClick={() => handleAccessCourse(item)}
                                disabled={displayStatus === "PENDING_APPROVAL" && !isMandatory}
                              >
                                {isMandatory ? "Mandatory" : 
                                 displayStatus === "APPROVED" || displayStatus === "MANDATORY" ? "Access" : "Pending"}
                              </button>
                              
                              {(displayStatus === "APPROVED" || displayStatus === "MANDATORY" || displayStatus === "IN_PROGRESS") && (
                                <button
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() =>
                                    handleUpdateProgress(item.id, item.progress || 0, courseTitle)
                                  }
                                >
                                  Update
                                </button>
                              )}
                              
                              {item.progress === 100 && 
                               (displayStatus === "APPROVED" || displayStatus === "MANDATORY" || displayStatus === "COMPLETED") && (
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() =>
                                    handleTakeExam(item.id, courseTitle)
                                  }
                                >
                                  Exam
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 🆕 UPDATED: Course Content Modal with Mandatory Support */}
      {showCourseContent && selectedCourse && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isMandatoryCourse(selectedCourse) ? "📗 " : "🎓 "}
                  {getCourseTitle(selectedCourse)}
                  {isMandatoryCourse(selectedCourse) && <span className="badge bg-danger ms-2">Mandatory</span>}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowCourseContent(false);
                    setSelectedCourse(null);
                    setCourseMaterials([]);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-8">
                    {/* Course Modules */}
                    <div className="card mb-4">
                      <div className="card-header">
                        <h6>📚 Course Content</h6>
                        <small className="text-muted">Click 'Mark Completed' to track your progress</small>
                        {isMandatoryCourse(selectedCourse) && (
                          <div className="mt-1">
                            <small className="text-danger">
                              <strong>📗 This is a mandatory course and must be completed.</strong>
                            </small>
                          </div>
                        )}
                      </div>
                      <div className="card-body">
                        <div className="list-group">
                          <div className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6>1. Introduction to Course</h6>
                                <p className="mb-0 text-muted">Overview and learning objectives</p>
                              </div>
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => handleMarkComplete("Module", "Introduction to Course")}
                              >
                                ✅ Mark Completed
                              </button>
                            </div>
                          </div>
                          
                          <div className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6>2. Core Concepts</h6>
                                <p className="mb-0 text-muted">Fundamental principles and theories</p>
                              </div>
                              <button 
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => handleMarkComplete("Module", "Core Concepts")}
                              >
                                Mark Complete
                              </button>
                            </div>
                          </div>
                          
                          <div className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6>3. Practical Applications</h6>
                                <p className="mb-0 text-muted">Real-world examples and case studies</p>
                              </div>
                              <button 
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => handleMarkComplete("Module", "Practical Applications")}
                              >
                                Mark Complete
                              </button>
                            </div>
                          </div>
                          
                          <div className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6>4. Final Assessment</h6>
                                <p className="mb-0 text-muted">Test your knowledge</p>
                              </div>
                              {(selectedCourse.progress === 100 || isMandatoryCourse(selectedCourse)) ? (
                                <button 
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleTakeExam(selectedCourse.id, getCourseTitle(selectedCourse))}
                                >
                                  🎓 Take Exam
                                </button>
                              ) : (
                                <span className="badge bg-warning">Complete previous modules</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Study Materials Section */}
                    <div className="card">
                      <div className="card-header">
                        <h6>📁 Study Materials</h6>
                        <small className="text-muted">Click on any material to view/download</small>
                      </div>
                      <div className="card-body">
                        {loadingMaterials ? (
                          <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading materials...</span>
                            </div>
                            <p className="mt-2 text-muted">Loading study materials...</p>
                          </div>
                        ) : courseMaterials.length === 0 ? (
                          <div className="text-center py-4">
                            <div className="text-muted">No study materials available for this course yet.</div>
                            <button 
                              className="btn btn-outline-primary btn-sm mt-2"
                              onClick={() => handleAccessCourse(selectedCourse)}
                            >
                              🔄 Reload Materials
                            </button>
                          </div>
                        ) : (
                          <div className="row">
                            {courseMaterials.map((material, index) => (
                              <div key={index} className="col-md-6 mb-3">
                                <div 
                                  className="card h-100 cursor-pointer"
                                  style={{cursor: 'pointer'}}
                                  onClick={() => handleViewMaterial(material)}
                                >
                                  <div className="card-body text-center">
                                    <div className="display-6 mb-2">
                                      {getMaterialIcon(material.type)}
                                    </div>
                                    <h6 className="card-title">{material.title}</h6>
                                    <span className={`badge ${
                                      material.type?.toLowerCase() === 'video' ? 'bg-danger' : 
                                      material.type?.toLowerCase() === 'pdf' ? 'bg-primary' : 
                                      'bg-success'
                                    }`}>
                                      {material.type || 'Document'}
                                    </span>
                                    {material.description && (
                                      <p className="card-text small text-muted mt-2">
                                        {material.description}
                                      </p>
                                    )}
                                    <div className="mt-2">
                                      <small className="text-muted">
                                        {material.type?.toLowerCase() === 'video' ? 'Click to watch' : 
                                         material.type?.toLowerCase() === 'pdf' ? 'Click to view PDF' : 
                                         'Click to download'}
                                      </small>
                                    </div>
                                    {(material.type?.toLowerCase() === 'pdf' || material.type?.toLowerCase() === 'document') && (
                                      <button
                                        className="btn btn-outline-primary btn-sm mt-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadMaterial(material);
                                        }}
                                      >
                                        📥 Download
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-header">
                        <h6>📊 Course Progress</h6>
                        {isMandatoryCourse(selectedCourse) && (
                          <small className="text-danger">📗 Mandatory Course</small>
                        )}
                      </div>
                      <div className="card-body">
                        <div className="text-center mb-3">
                          <div className="display-4 fw-bold text-primary">
                            {selectedCourse.progress || 0}%
                          </div>
                          <div className="progress mt-2" style={{height: '10px'}}>
                            <div 
                              className={`progress-bar bg-${getProgressColor(selectedCourse.progress || 0)}`}
                              style={{width: `${selectedCourse.progress || 0}%`}}
                            ></div>
                          </div>
                          <small className="text-muted">{getProgressText(selectedCourse.progress || 0)}</small>
                          <div className="mt-1">
                            <small className={`badge bg-${getDisplayStatus(selectedCourse) === 'COMPLETED' ? 'success' : getDisplayStatus(selectedCourse) === 'IN_PROGRESS' ? 'info' : getDisplayStatus(selectedCourse) === 'MANDATORY' ? 'danger' : 'secondary'}`}>
                              Status: {getDisplayStatus(selectedCourse)}
                            </small>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <button
                            className="btn btn-outline-info w-100 mb-2"
                            onClick={() => handleUpdateProgress(selectedCourse.id, selectedCourse.progress || 0, getCourseTitle(selectedCourse))}
                          >
                            📊 Manual Progress Update
                          </button>
                          
                          {(selectedCourse.progress === 100 || isMandatoryCourse(selectedCourse)) && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleTakeExam(selectedCourse.id, getCourseTitle(selectedCourse))}
                            >
                              🎓 Take Final Exam
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Viewer Modal for Videos */}
      {showMediaViewer && selectedMaterial && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.9)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content bg-dark">
              <div className="modal-header bg-dark border-secondary">
                <h5 className="modal-title text-white">
                  🎥 {selectedMaterial.title}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => {
                    setShowMediaViewer(false);
                    setSelectedMaterial(null);
                  }}
                ></button>
              </div>
              <div className="modal-body text-center p-0">
                {selectedMaterial.type?.toLowerCase() === 'video' && (
                  <div>
                    <video 
                      controls 
                      autoPlay 
                      style={{maxWidth: '100%', maxHeight: '70vh'}}
                      className="w-100"
                      onTimeUpdate={(e) => handleVideoTimeUpdate(e, selectedMaterial)}
                      onEnded={() => handleVideoEnded(selectedMaterial)}
                    >
                      <source src={selectedMaterial.url} type="video/mp4" />
                      <source src={selectedMaterial.url} type="video/webm" />
                      <source src={selectedMaterial.url} type="video/ogg" />
                      Your browser does not support the video tag.
                    </video>
                    <div className="p-3 bg-dark">
                      <small className="text-white-50 d-block mb-2">
                        💡 Progress will auto-update when video is nearly completed (30 seconds remaining)
                      </small>
                      <button 
                        className="btn btn-success me-2"
                        onClick={() => handleMarkComplete("Video", selectedMaterial.title)}
                      >
                        ✅ Mark Video as Completed
                      </button>
                      <button 
                        className="btn btn-outline-light"
                        onClick={() => {
                          setShowMediaViewer(false);
                          setSelectedMaterial(null);
                        }}
                      >
                        ❌ Close Video
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF/Document Viewer Modal */}
      {pdfViewerOpen && selectedMaterial && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.9)'}}>
          <div className="modal-dialog modal-xl" style={{height: '90vh'}}>
            <div className="modal-content bg-dark h-100">
              <div className="modal-header bg-dark border-secondary">
                <h5 className="modal-title text-white">
                  {selectedMaterial.type?.toLowerCase() === 'pdf' ? '📄' : '📝'} {selectedMaterial.title}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={handleClosePdfViewer}
                ></button>
              </div>
              <div className="modal-body p-0" style={{height: 'calc(100% - 120px)'}}>
                {selectedMaterial.type?.toLowerCase() === 'pdf' ? (
                  <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                    {pdfBlobUrl ? (
                      <iframe
                        src={pdfBlobUrl}
                        title={selectedMaterial.title}
                        width="100%"
                        height="100%"
                        style={{border: 'none'}}
                        onLoad={() => console.log("PDF loaded successfully")}
                        onError={(e) => {
                          console.error("PDF iframe error:", e);
                          alert("❌ PDF failed to load in viewer. Opening in new tab instead...");
                          handleOpenPdfInNewTab(selectedMaterial);
                          handleClosePdfViewer();
                        }}
                      />
                    ) : (
                      <div className="text-center text-white py-5 h-100 d-flex flex-column justify-content-center">
                        <div className="display-1 mb-3">📄</div>
                        <h4>PDF Loading...</h4>
                        <p>Preparing PDF for viewing...</p>
                        <div className="spinner-border text-primary mb-3" role="status">
                          <span className="visually-hidden">Loading PDF...</span>
                        </div>
                        <div className="mt-3">
                          <button 
                            className="btn btn-primary me-2"
                            onClick={() => handleOpenPdfInNewTab(selectedMaterial)}
                          >
                            🚀 Open in New Tab
                          </button>
                          <button 
                            className="btn btn-outline-light"
                            onClick={handleClosePdfViewer}
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-white py-5 h-100 d-flex flex-column justify-content-center">
                    <div className="display-1 mb-3">📄</div>
                    <h4>Document Viewer</h4>
                    <p>This document is ready for download.</p>
                    <div className="mt-3">
                      <button 
                        className="btn btn-primary me-2"
                        onClick={() => handleDownloadMaterial(selectedMaterial)}
                      >
                        📥 Download Document
                      </button>
                      <button 
                        className="btn btn-outline-light"
                        onClick={handleClosePdfViewer}
                      >
                        ❌ Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-dark border-secondary">
                <button 
                  className="btn btn-success me-2"
                  onClick={() => {
                    handleMarkComplete(
                      selectedMaterial.type?.charAt(0).toUpperCase() + selectedMaterial.type?.slice(1).toLowerCase(), 
                      selectedMaterial.title
                    );
                    handleClosePdfViewer();
                  }}
                >
                  ✅ Mark as Completed
                </button>
                <button 
                  className="btn btn-primary me-2"
                  onClick={() => handleOpenPdfInNewTab(selectedMaterial)}
                >
                  🚀 Open in New Tab
                </button>
                <button 
                  className="btn btn-outline-light me-2"
                  onClick={() => handleDownloadMaterial(selectedMaterial)}
                >
                  📥 Download
                </button>
                <button 
                  className="btn btn-outline-light"
                  onClick={handleClosePdfViewer}
                >
                  ❌ Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}