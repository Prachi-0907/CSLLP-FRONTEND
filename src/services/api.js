// src/services/api.js - COMPLETE UPDATED VERSION WITH CERTIFICATE SERVICE

// --- Base URLs ---
const USER_BASE = process.env.REACT_APP_USER_SERVICE || 'http://localhost:8081';
const COURSE_BASE = process.env.REACT_APP_COURSE_SERVICE || 'http://localhost:8090';
const MATERIAL_BASE = process.env.REACT_APP_MATERIAL_SERVICE || 'http://localhost:8082';
const EXAM_BASE = process.env.REACT_APP_EXAM_SERVICE || 'http://localhost:8083/api/exams';
const NOTIF_BASE = process.env.REACT_APP_NOTIFICATION_SERVICE || 'http://localhost:8089';
const FEEDBACK_BASE = process.env.REACT_APP_FEEDBACK_SERVICE || 'http://localhost:8087';
const CERTIFICATE_BASE = process.env.REACT_APP_CERTIFICATE_SERVICE || 'http://localhost:8085/api/certifications';

// 🆕 ADD: Proper response parser for different content types
async function parseResponse(response) {
  const contentType = response.headers.get('content-type');
  
  try {
    if (contentType && contentType.includes('application/json')) {
      const body = await response.json();
      return {
        ok: response.ok,
        status: response.status,
        body: body,
        data: body.data || body,
        success: body.success !== undefined ? body.success : response.ok,
        message: body.message || ''
      };
    } else if (contentType && contentType.includes('application/pdf')) {
      // Handle PDF responses for certificate downloads
      const blob = await response.blob();
      return {
        ok: response.ok,
        status: response.status,
        body: blob,
        data: blob,
        success: response.ok,
        message: 'PDF downloaded successfully'
      };
    } else {
      // For non-JSON responses (like file downloads, text, etc.)
      const text = await response.text();
      return {
        ok: response.ok,
        status: response.status,
        body: text,
        data: text,
        success: response.ok,
        message: ''
      };
    }
  } catch (error) {
    return {
      ok: false,
      status: 500,
      body: null,
      data: null,
      success: false,
      message: 'Failed to parse response'
    };
  }
}

// --- Enhanced Helper to parse JSON responses ---
async function parseJson(res) {
  return await parseResponse(res);
}

// =====================
// 🆕 CERTIFICATE SERVICE - COMPLETE INTEGRATION
// =====================

export const certificateAPI = {
  // ✅ Get employee certificates
  getEmployeeCertificates: async (employeeId) => {
    try {
      const res = await fetch(`${CERTIFICATE_BASE}/employee/${employeeId}`);
      return await parseJson(res);
    } catch (error) {
      return {
        ok: false,
        body: null,
        data: [],
        success: false,
        message: 'Failed to fetch employee certificates'
      };
    }
  },

  // ✅ Download employee certificate (returns blob for PDF)
  downloadEmployeeCertificate: async (employeeId, certificationId) => {
    try {
      const res = await fetch(`${CERTIFICATE_BASE}/employee/${employeeId}/download/${certificationId}`);
      return await parseResponse(res);
    } catch (error) {
      return {
        ok: false,
        body: null,
        data: null,
        success: false,
        message: 'Failed to download certificate'
      };
    }
  },

  // ✅ Generate certificate (Admin/Manager only)
  generateCertificate: async (certificateData, creatorId) => {
    try {
      const res = await fetch(`${CERTIFICATE_BASE}/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Creator-Id': creatorId.toString()
        },
        body: JSON.stringify(certificateData)
      });
      return await parseJson(res);
    } catch (error) {
      return {
        ok: false,
        body: null,
        data: null,
        success: false,
        message: 'Failed to generate certificate'
      };
    }
  },

  // ✅ Auto-generate certificate
  autoGenerateCertificate: async (employeeId, courseId) => {
    try {
      const res = await fetch(`${CERTIFICATE_BASE}/auto-generate/${employeeId}/${courseId}`, {
        method: 'POST'
      });
      return await parseJson(res);
    } catch (error) {
      return {
        ok: false,
        body: null,
        data: null,
        success: false,
        message: 'Failed to auto-generate certificate'
      };
    }
  },

  // ✅ Get all certificates (Admin/Manager with filters)
  getAllCertificates: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const url = `${CERTIFICATE_BASE}/admin${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      return await parseJson(res);
    } catch (error) {
      return {
        ok: false,
        body: null,
        data: [],
        success: false,
        message: 'Failed to fetch certificates'
      };
    }
  },

  // ✅ Download certificate as admin (Admin only)
  downloadCertificateAdmin: async (certificateId) => {
    try {
      const res = await fetch(`${CERTIFICATE_BASE}/admin/${certificateId}/download`);
      return await parseResponse(res);
    } catch (error) {
      return {
        ok: false,
        body: null,
        data: null,
        success: false,
        message: 'Failed to download certificate'
      };
    }
  },

  // ✅ Revoke certificate (Admin only)
  revokeCertificate: async (certificateId, creatorId) => {
    try {
      const res = await fetch(`${CERTIFICATE_BASE}/admin/${certificateId}/revoke`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Creator-Id': creatorId.toString()
        }
      });
      return await parseJson(res);
    } catch (error) {
      return {
        ok: false,
        body: null,
        data: null,
        success: false,
        message: 'Failed to revoke certificate'
      };
    }
  },

  // ✅ Check certificate eligibility
  checkEligibility: async (employeeId, courseId) => {
    try {
      // This would call your backend to check if employee is eligible for certificate
      const res = await fetch(`${CERTIFICATE_BASE}/check-eligibility?employeeId=${employeeId}&courseId=${courseId}`);
      return await parseJson(res);
    } catch (error) {
      return {
        ok: false,
        body: null,
        data: { isEligible: false, message: 'Unable to check eligibility' },
        success: false,
        message: 'Failed to check eligibility'
      };
    }
  }
};

// =====================
// 🆕 PROGRESS TRACKING ENDPOINTS
// =====================

/**
 * Increment progress by specific amount (for video auto-tracking)
 */
export async function incrementProgress(enrollmentId, incrementBy) {
  try {
    const res = await fetch(
      `${COURSE_BASE}/courses/enrollments/${enrollmentId}/increment-progress?incrementBy=${incrementBy}`, 
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return await parseJson(res);
  } catch (error) {
    return {
      ok: false,
      body: null,
      data: null,
      success: false,
      message: 'Failed to increment progress'
    };
  }
}

/**
 * Mark specific content as completed (for manual completion buttons)
 */
export async function markContentComplete(enrollmentId, contentType, contentTitle) {
  try {
    const res = await fetch(
      `${COURSE_BASE}/courses/enrollments/${enrollmentId}/mark-complete?contentType=${encodeURIComponent(contentType)}&contentTitle=${encodeURIComponent(contentTitle)}`, 
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return await parseJson(res);
  } catch (error) {
    return {
      ok: false,
      body: null,
      data: null,
      success: false,
      message: 'Failed to mark content as completed'
    };
  }
}

// =====================
// STORAGE HELPERS
// =====================
export function saveUserToStorage(user) {
  localStorage.setItem('csllp_user', JSON.stringify(user));
}

export function loadUserFromStorage() {
  const s = localStorage.getItem('csllp_user');
  return s ? JSON.parse(s) : null;
}

export function clearUser() {
  localStorage.removeItem('csllp_user');
}

// =====================
// ROLE & PERMISSION HELPERS
// =====================
export function hasUploadPermission(user) {
  return user?.role && ['ADMIN', 'MANAGER', 'HR'].includes(user.role.toUpperCase());
}

export function canEditMaterials(user) {
  return hasUploadPermission(user);
}

export function canDeleteMaterials(user) {
  return hasUploadPermission(user);
}

export function isAdmin(user) {
  return user?.role === 'ADMIN';
}

export function isManager(user) {
  return user?.role === 'MANAGER';
}

export function isAdminOrManager(user) {
  return user?.role && ['ADMIN', 'MANAGER'].includes(user.role.toUpperCase());
}

// =====================
// USER SERVICE
// =====================
export async function authLogin(payload) {
  const res = await fetch(`${USER_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function authRegister(payload, creatorId, creatorRole) {
  const headers = { 'Content-Type': 'application/json' };
  if (creatorId) headers['X-Creator-Id'] = String(creatorId);
  if (creatorRole) headers['X-Creator-Role'] = creatorRole;

  const res = await fetch(`${USER_BASE}/api/auth/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

// =====================
// AUTHENTICATION - FORGOT PASSWORD
// =====================

// Forgot Password - Send OTP
export async function forgotPassword(email) {
  try {
    const response = await fetch(`${USER_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    return {
      success: response.ok,
      message: data.message,
      data: data.data
    };
  } catch (error) {
    return {
      success: false,
      message: 'Network error occurred'
    };
  }
}

// Verify OTP
export async function verifyOtp(email, otp) {
  try {
    const response = await fetch(`${USER_BASE}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });
    
    const data = await response.json();
    return {
      success: response.ok,
      message: data.message,
      data: data.data
    };
  } catch (error) {
    return {
      success: false,
      message: 'Network error occurred'
    };
  }
}

// Reset Password
export async function resetPassword(email, otp, newPassword) {
  try {
    const response = await fetch(`${USER_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    
    const data = await response.json();
    return {
      success: response.ok,
      message: data.message,
      data: data.data
    };
  } catch (error) {
    return {
      success: false,
      message: 'Network error occurred'
    };
  }
}

export async function getUsers(managerId) {
  const url = managerId
    ? `${USER_BASE}/api/users?managerId=${managerId}`
    : `${USER_BASE}/api/users/role/ALL`;
  return parseJson(await fetch(url));
}

export async function getUsersByRole(role) {
  return parseJson(await fetch(`${USER_BASE}/api/users/role/${role}`));
}

export async function getUserById(id) {
  return parseJson(await fetch(`${USER_BASE}/api/users/${id}`));
}

// 🆕 ADDED: User Management Functions
export async function updateUser(id, payload) {
  const res = await fetch(`${USER_BASE}/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function softDeleteUser(id) {
  const res = await fetch(`${USER_BASE}/api/users/${id}`, { method: 'DELETE' });
  return parseJson(res);
}

export async function getManagers() {
  return parseJson(await fetch(`${USER_BASE}/api/users/role/MANAGER`));
}

export async function activateUser(id) {
  const res = await fetch(`${USER_BASE}/api/users/${id}/activate`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  return parseJson(res);
}

// =====================
// PROFILE ENDPOINTS
// =====================
export async function getUserProfile(userId) {
  return parseJson(await fetch(`${USER_BASE}/api/users/profile/${userId}`));
}

export async function updateUserProfile(userId, payload) {
  const res = await fetch(`${USER_BASE}/api/users/profile/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function getUserDashboard(userId) {
  return parseJson(await fetch(`${USER_BASE}/api/users/dashboard/${userId}`));
}

export async function searchUsers(query) {
  return parseJson(await fetch(`${USER_BASE}/api/users/search?query=${query}`));
}

export async function checkUserExists(userId) {
  const res = await fetch(`${USER_BASE}/api/users/${userId}/exists`);
  return parseJson(res);
}

// =====================
// COURSE SERVICE - UPDATED FOR BACKEND COMPATIBILITY
// =====================

// Fetch all courses - FIXED response handling
export async function getCourses() {
  try {
    const res = await fetch(`${COURSE_BASE}/courses`);
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: null, 
      success: false, 
      message: 'Failed to fetch courses' 
    };
  }
}

// Fetch course by ID
export async function getCourseById(id) {
  return parseJson(await fetch(`${COURSE_BASE}/courses/${id}`));
}

// Create new course - UPDATED to match CourseRequest DTO
export async function createCourse(payload) {
  const res = await fetch(`${COURSE_BASE}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      category: payload.category,
      durationHours: payload.durationHours,
      paid: payload.paid || payload.isPaid || false,
      price: payload.price || 0,
      createdBy: payload.createdBy,
      materials: payload.materials || [],
      is_mandatory: payload.isMandatory,
      isMandatory: payload.isMandatory
    }),
  });
  return parseJson(res);
}

// Update course
export async function updateCourse(id, payload) {
  const res = await fetch(`${COURSE_BASE}/courses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

// Delete course (soft delete - sets status to INACTIVE)
export async function deleteCourse(id) {
  const res = await fetch(`${COURSE_BASE}/courses/${id}`, { 
    method: 'DELETE' 
  });
  return parseJson(res);
}

// =====================
// COURSE SERVICE - ADDITIONAL METHODS
// =====================
export async function getAllCourses() {
  return parseJson(await fetch(`${COURSE_BASE}/courses`));
}

// Add this to your api.js file - Get ALL courses for admin
export async function getAllCoursesForAdmin() {
  try {
    const res = await fetch(`${COURSE_BASE}/courses/admin/all`);
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: [], 
      success: false, 
      message: 'Failed to fetch all courses' 
    };
  }
}

export async function getMyAvailableCourses(userId) {
  return parseJson(await fetch(`${COURSE_BASE}/courses/available/${userId}`));
}

// =====================
// ENROLLMENTS & EXAM ELIGIBILITY - UPDATED
// =====================

// Enroll employee to course - FIXED payload structure
export async function enrollCourse(payload) {
  const res = await fetch(`${COURSE_BASE}/courses/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseId: payload.courseId,
      employeeId: payload.employeeId
    }),
  });
  return parseJson(res);
}

// Get "My Courses" for employee - FIXED response handling
export async function getMyCourses(employeeId) {
  try {
    const res = await fetch(`${COURSE_BASE}/courses/my/${employeeId}`);
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: [], 
      success: false, 
      message: 'Failed to load courses' 
    };
  }
}

// Get enrollments by employee - FIXED response handling
export async function getEnrollmentsByEmployee(employeeId) {
  try {
    const res = await fetch(`${COURSE_BASE}/courses/enrollments/${employeeId}`);
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: [], 
      success: false, 
      message: 'Failed to load enrollments' 
    };
  }
}

// Update progress - FIXED parameter format
export async function updateProgress(enrollmentId, progress) {
  const res = await fetch(`${COURSE_BASE}/courses/enrollments/${enrollmentId}/progress?progress=${progress}`, {
    method: 'PUT'
  });
  return parseJson(res);
}

// =====================
// ASSIGNMENTS - UPDATED
// =====================

// Assign course to employee - FIXED payload structure
export async function createAssignment(payload) {
  const res = await fetch(`${COURSE_BASE}/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseId: payload.courseId,
      employeeId: payload.employeeId,
      priority: payload.priority || 'MEDIUM',
      dueDate: payload.dueDate,
      notes: payload.notes,
      assignedBy: payload.assignedBy
    }),
  });
  return parseJson(res);
}

// Get all assignments with filters - FIXED parameter handling
export async function getAssignments(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });
  
  const url = `${COURSE_BASE}/assignments${params.toString() ? `?${params.toString()}` : ''}`;
  return parseJson(await fetch(url));
}

export async function getAssignmentsByStatus(status) {
  return parseJson(await fetch(`${COURSE_BASE}/assignments?status=${status}`));
}

export async function getPendingAssignments() {
  return parseJson(await fetch(`${COURSE_BASE}/assignments/pending`));
}

// Approve assignment - FIXED parameter format
export async function approveAssignment(id, approverId) {
  const res = await fetch(`${COURSE_BASE}/assignments/${id}/approve?approverId=${approverId}`, {
    method: 'PUT'
  });
  return parseJson(res);
}

// Reject assignment - FIXED parameter format
export async function rejectAssignment(id, approverId) {
  const res = await fetch(`${COURSE_BASE}/assignments/${id}/reject?approverId=${approverId}`, {
    method: 'PUT'
  });
  return parseJson(res);
}

// =====================
// 🆕 BULK ASSIGNMENT ENDPOINTS
// =====================

// Search employees by name/ID for bulk assignment
export async function searchEmployeesForAssignment(query) {
  try {
    const res = await fetch(`${COURSE_BASE}/assignments/search/employees?query=${encodeURIComponent(query)}`);
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: [], 
      success: false, 
      message: 'Failed to search employees' 
    };
  }
}

// Create bulk assignments
export async function createBulkAssignment(payload) {
  try {
    const res = await fetch(`${COURSE_BASE}/assignments/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: null, 
      success: false, 
      message: 'Failed to create bulk assignments' 
    };
  }
}

// =====================
// APPROVALS - UPDATED
// =====================

// Get pending enrollments - FIXED response handling
export async function getPendingEnrollments() {
  try {
    const res = await fetch(`${COURSE_BASE}/courses/enrollments/pending`);
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: [], 
      success: false, 
      message: 'Failed to load pending enrollments' 
    };
  }
}

export async function approveEnrollment(id) {
  const res = await fetch(`${COURSE_BASE}/courses/enrollments/${id}/approve`, {
    method: 'PUT'
  });
  return parseJson(res);
}

export async function rejectEnrollment(id) {
  const res = await fetch(`${COURSE_BASE}/courses/enrollments/${id}/reject`, {
    method: 'PUT'
  });
  return parseJson(res);
}

// =====================
// COURSE CATALOG & SEARCH
// =====================
export async function getCoursesByCategory(category) {
  return parseJson(await fetch(`${COURSE_BASE}/courses/category/${category}`));
}

export async function searchCourses(keyword) {
  return parseJson(await fetch(`${COURSE_BASE}/courses/search?keyword=${keyword}`));
}

// 🆕 FIXED: Get course materials with validation
export async function getCourseMaterials(courseId) {
  // Validate courseId to prevent "undefined" being sent
  if (!courseId || courseId === 'undefined' || courseId === 'null') {
    return {
      ok: false,
      body: null,
      data: [],
      success: false,
      message: 'Invalid course ID'
    };
  }

  try {
    const numericCourseId = Number(courseId);
    if (isNaN(numericCourseId) || numericCourseId <= 0) {
      return {
        ok: false,
        body: null,
        data: [],
        success: false,
        message: 'Course ID must be a valid number'
      };
    }

    const res = await fetch(`${COURSE_BASE}/courses/${numericCourseId}/materials`);
    return await parseJson(res);
  } catch (error) {
    console.error("Failed to fetch course materials:", error);
    return { 
      ok: false, 
      body: null, 
      data: [], 
      success: false, 
      message: 'Failed to load course materials' 
    };
  }
}

// =====================
// REPORTS - UPDATED
// =====================

// Generate summary report - FIXED response handling
export async function getCourseReport() {
  try {
    const res = await fetch(`${COURSE_BASE}/courses/reports/summary`);
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: {}, 
      success: false, 
      message: 'Failed to generate report' 
    };
  }
}

// =====================
// MATERIAL SERVICE - COMPLETE WITH ALL FIXED METHODS
// =====================

// Fetch all study materials
export async function getMaterials() {
  try {
    const res = await fetch(`${MATERIAL_BASE}/api/materials`);
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: [], 
      success: false, 
      message: 'Failed to fetch materials' 
    };
  }
}

// 🆕 FIXED: Upload/Add a new material (multipart/form-data)
export async function uploadMaterial(formData) {
  try {
    const res = await fetch(`${MATERIAL_BASE}/api/materials/upload`, {
      method: "POST",
      body: formData,
    });
    return await parseJson(res);
  } catch (error) {
    console.error("Upload material error:", error);
    return { 
      ok: false, 
      body: null, 
      data: null, 
      success: false, 
      message: 'Failed to upload material' 
    };
  }
}

// Get material by ID
export async function getMaterialById(id) {
  try {
    const res = await fetch(`${MATERIAL_BASE}/api/materials/${id}`);
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: null, 
      success: false, 
      message: 'Failed to fetch material' 
    };
  }
}

// 🆕 FIXED: UPDATE MATERIAL - Multipart form data for file upload
export async function updateMaterial(id, formData) {
  try {
    const res = await fetch(`${MATERIAL_BASE}/api/materials/${id}`, {
      method: 'PUT',
      body: formData,
    });
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: null, 
      success: false, 
      message: 'Failed to update material' 
    };
  }
}

// Delete material
export async function deleteMaterial(id) {
  try {
    const res = await fetch(`${MATERIAL_BASE}/api/materials/${id}`, { 
      method: 'DELETE' 
    });
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: null, 
      success: false, 
      message: 'Failed to delete material' 
    };
  }
}

// 🆕 FIXED: Download material - returns blob for viewing
export async function downloadMaterial(id) {
  try {
    const res = await fetch(`${MATERIAL_BASE}/api/materials/download/${id}`);
    if (!res.ok) throw new Error("Download failed");
    
    // Return the blob for viewing/download
    const blob = await res.blob();
    return blob;
  } catch (error) {
    console.error("Download material error:", error);
    throw error;
  }
}

// Get materials by uploader
export async function getMaterialsByUploader(uploaderId) {
  try {
    const res = await fetch(`${MATERIAL_BASE}/api/materials/uploader/${uploaderId}`);
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: [], 
      success: false, 
      message: 'Failed to fetch materials by uploader' 
    };
  }
}

// Search materials by tag
export async function searchMaterialsByTag(keyword) {
  try {
    const res = await fetch(`${MATERIAL_BASE}/api/materials/search?keyword=${keyword}`);
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: [], 
      success: false, 
      message: 'Failed to search materials' 
    };
  }
}

// Get materials by course
export async function getMaterialsByCourse(courseId) {
  try {
    const res = await fetch(`${MATERIAL_BASE}/api/materials/course/${courseId}`);
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: [], 
      success: false, 
      message: 'Failed to fetch course materials' 
    };
  }
}

// =====================
// 🆕 EXAM SERVICE - ADDED ALL MISSING FUNCTIONS
// =====================

// Get all exams (for Admin/Manager)
export async function getExams() {
  try {
    const res = await fetch(`${EXAM_BASE}`);
    const parsed = await parseJson(res);
    return parsed.ok ? parsed.body.data : [];
  } catch (error) {
    console.error('Error fetching exams:', error);
    return [];
  }
}

// Get manager's team employees
export async function getManagerTeamEmployees(managerId) {
  try {
    const res = await fetch(`${USER_BASE}/api/users/manager/${managerId}/team`);
    const parsed = await parseJson(res);
    
    if (parsed.ok && parsed.body && parsed.body.data) {
      return parsed.body.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching manager team:', error);
    return [];
  }
}

// Get pending exams count for employee
export async function getPendingExamsCount(employeeId) {
  try {
    const res = await fetch(`${EXAM_BASE}/pending-count/${employeeId}`);
    const parsed = await parseJson(res);
    
    if (parsed.ok && parsed.body && parsed.body.data !== undefined) {
      return { data: parsed.body.data };
    }
    return { data: 0 };
  } catch (error) {
    console.error('Error fetching pending exams count:', error);
    return { data: 0 };
  }
}

// Get total employees count (for admin)
export async function getTotalEmployeesCount() {
  try {
    const res = await fetch(`${EXAM_BASE}/employees/count`);
    const parsed = await parseJson(res);
    
    if (parsed.ok && parsed.body && parsed.body.data !== undefined) {
      return { data: parsed.body.data };
    }
    return { data: 0 };
  } catch (error) {
    console.error('Error fetching total employees count:', error);
    return { data: 0 };
  }
}

// Get manager team results
export async function getManagerTeamResults(managerId) {
  try {
    const res = await fetch(`${EXAM_BASE}/reports/manager-team/${managerId}`);
    const parsed = await parseJson(res);
    return parsed.ok ? parsed.body.data : [];
  } catch (error) {
    console.error('Error fetching manager team results:', error);
    return [];
  }
}

// Get exams for specific employee (with status: LOCKED/AVAILABLE)
export async function getExamsForEmployee(employeeId) {
  try {
    const res = await fetch(`${EXAM_BASE}/employee/${employeeId}`);
    const parsed = await parseJson(res);
    
    if (parsed.ok && parsed.body && parsed.body.data) {
      return parsed.body.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching employee exams:', error);
    return [];
  }
}

// ✅ Check exam eligibility
export async function checkExamEligibility(examId, employeeId) {
  try {
    const res = await fetch(`${EXAM_BASE}/${examId}/eligibility/${employeeId}`);
    const parsed = await parseJson(res);
    
    if (parsed.ok && parsed.body && parsed.body.data) {
      return parsed.body.data;
    }
    return { isEligible: false, message: "Unable to check eligibility" };
  } catch (error) {
    console.error('Error checking exam eligibility:', error);
    return { isEligible: false, message: "Error checking eligibility" };
  }
}

// Get exam by ID
export async function getExamById(id) {
  try {
    const res = await fetch(`${EXAM_BASE}/${id}`);
    const parsed = await parseJson(res);
    return parsed.ok ? parsed.body.data : null;
  } catch (error) {
    console.error('Error fetching exam by ID:', error);
    return null;
  }
}

// Create exam
export async function createExam(payload, creatorId) {
  try {
    const res = await fetch(`${EXAM_BASE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Creator-Id': String(creatorId)
      },
      body: JSON.stringify(payload),
    });
    const parsed = await parseJson(res);
    return parsed.ok ? parsed.body.data : null;
  } catch (error) {
    console.error('Error creating exam:', error);
    return null;
  }
}

// Update exam
export async function updateExam(id, payload) {
  try {
    const res = await fetch(`${EXAM_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const parsed = await parseJson(res);
    return parsed.ok ? parsed.body.data : null;
  } catch (error) {
    console.error('Error updating exam:', error);
    return null;
  }
}

// Delete exam
export async function deleteExam(id) {
  try {
    const res = await fetch(`${EXAM_BASE}/${id}`, { method: 'DELETE' });
    const parsed = await parseJson(res);
    return parsed.ok;
  } catch (error) {
    console.error('Error deleting exam:', error);
    return false;
  }
}

// Questions
export async function addQuestion(examId, payload) {
  try {
    const res = await fetch(`${EXAM_BASE}/${examId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const parsed = await parseJson(res);
    return parsed.ok ? parsed.body.data : null;
  } catch (error) {
    console.error('Error adding question:', error);
    return null;
  }
}

export async function getQuestions(examId) {
  try {
    const res = await fetch(`${EXAM_BASE}/${examId}/questions`);
    const parsed = await parseJson(res);
    return parsed.ok ? parsed.body.data : [];
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}

// Start attempt with proper error handling
export async function startAttempt(examId, employeeId) {
  try {
    const res = await fetch(`${EXAM_BASE}/${examId}/start?employeeId=${employeeId}`, {
      method: 'POST',
    });
    const parsed = await parseJson(res);

    if (!parsed.ok || (parsed.body && parsed.body.success === false)) {
      const msg = parsed.body?.message || "Failed to start exam.";
      throw new Error(msg);
    }

    return parsed.body.data;
  } catch (error) {
    console.error('Error starting attempt:', error);
    throw error;
  }
}

// Submit attempt
export async function submitAttempt(examId, payload) {
  try {
    const res = await fetch(`${EXAM_BASE}/${examId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const parsed = await parseJson(res);
    return parsed.ok ? parsed.body.data : null;
  } catch (error) {
    console.error('Error submitting attempt:', error);
    return null;
  }
}

// Get exam by course
export async function getExamByCourse(courseId) {
  try {
    const res = await fetch(`${EXAM_BASE}/course/${courseId}`);
    const parsed = await parseJson(res);
    return parsed.ok ? parsed.body.data : null;
  } catch (error) {
    console.error('Error fetching exam by course:', error);
    return null;
  }
}

// Get employee results (for My Results section)
export async function getEmployeeResults(employeeId) {
  try {
    const res = await fetch(`${EXAM_BASE}/results/employee/${employeeId}`);
    const parsed = await parseJson(res);
    
    if (parsed.ok && parsed.body && parsed.body.data) {
      return parsed.body.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching employee results:', error);
    return [];
  }
}

// Get all exam results (for Admin/Manager)
export async function getAllResults() {
  try {
    const res = await fetch(`${EXAM_BASE}/results`);
    const parsed = await parseJson(res);
    return parsed.ok ? parsed.body.data : [];
  } catch (error) {
    console.error('Error fetching all results:', error);
    return [];
  }
}

// Get results for specific exam
export async function getExamResults(examId) {
  try {
    const res = await fetch(`${EXAM_BASE}/${examId}/results`);
    const parsed = await parseJson(res);
    return parsed.ok ? parsed.body.data : [];
  } catch (error) {
    console.error('Error fetching exam results:', error);
    return [];
  }
}

// Get employee performance report (with role-based filtering)
export async function getEmployeePerformanceReport(employeeId = null, courseId = null, userRole = null, userId = null) {
  try {
    let url = `${EXAM_BASE}/reports/employee-performance?`;
    if (employeeId) url += `employeeId=${employeeId}&`;
    if (courseId) url += `courseId=${courseId}&`;
    if (userRole) url += `userRole=${userRole}&`;
    if (userId) url += `userId=${userId}&`;
    
    // Remove trailing & if exists
    url = url.replace(/[&]$/, '');
    
    const res = await fetch(url);
    const parsed = await parseJson(res);
    return parsed.ok ? parsed.body.data : [];
  } catch (error) {
    console.error('Error fetching performance report:', error);
    return [];
  }
}

// Get course effectiveness report (for Admin/Manager)
export async function getCourseEffectivenessReport() {
  try {
    const res = await fetch(`${EXAM_BASE}/reports/course-effectiveness`);
    const parsed = await parseJson(res);
    return parsed.ok ? parsed.body.data : [];
  } catch (error) {
    console.error('Error fetching course effectiveness report:', error);
    return [];
  }
}

// Get analytics data
export async function getAnalytics(filters = {}) {
  const { employeeId, examId } = filters;

  let url = `http://localhost:8086/api/analytics`;
  if (employeeId) url = `${url}/employee/${employeeId}`;
  else if (examId) url = `${url}/exam/${examId}`;

  try {
    const res = await fetch(url);
    const parsed = await parseJson(res);
    return parsed.ok ? parsed.body : [];
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return [];
  }
}

// Legacy function for employee exam attempts (kept for compatibility)
export async function getExamAttempts(employeeId) {
  try {
    // Using the new endpoint for consistency
    const results = await getEmployeeResults(employeeId);
    return results.map(result => ({
      id: result.attemptId,
      examTitle: result.examTitle,
      courseTitle: result.courseName,
      score: result.score,
      status: result.status,
      startedAt: result.startedAt,
      submittedAt: result.submittedAt,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      grade: result.grade
    }));
  } catch (error) {
    console.error("Error fetching exam attempts:", error);
    return [];
  }
}

// Legacy function for employee results (kept for compatibility)
export async function getResults(employeeId) {
  return getEmployeeResults(employeeId);
}

// =====================
// COURSE ENROLLMENT & PROGRESS
// =====================

// Get employee course enrollments
export async function getEmployeeEnrollments(employeeId) {
  try {
    const res = await fetch(`${COURSE_BASE}/courses/enrollments/${employeeId}`);
    const parsed = await parseJson(res);
    return parsed.ok ? parsed.body.data : [];
  } catch (error) {
    console.error('Error fetching employee enrollments:', error);
    return [];
  }
}

// Get course progress for employee
export async function getCourseProgress(employeeId, courseId) {
  try {
    const enrollments = await getEmployeeEnrollments(employeeId);
    const enrollment = enrollments.find(e => e.courseId === courseId);
    return enrollment ? enrollment.progress || 0 : 0;
  } catch (error) {
    console.error('Error fetching course progress:', error);
    return 0;
  }
}

// =====================
// USER COURSES MODULE - NEW METHODS
// =====================

// Get all employees with their course progress (for Admin User Courses module)
export async function getEmployeesWithProgress() {
  try {
    // First get all employees
    const usersRes = await getUsersByRole('EMPLOYEE');
    if (!usersRes.ok || !usersRes.body?.success) {
      return { 
        ok: false, 
        body: null, 
        data: [], 
        success: false, 
        message: 'Failed to load employees' 
      };
    }

    const employees = usersRes.body.data || [];
    const employeesWithProgress = [];

    // Get progress for each employee
    for (const employee of employees) {
      const enrollmentsRes = await getEnrollmentsByEmployee(employee.id);
      if (enrollmentsRes.ok && enrollmentsRes.body?.success) {
        const enrollments = enrollmentsRes.body.data || [];
        const total = enrollments.length;
        const completed = enrollments.filter(e => e.progress === 100 && e.status === 'COMPLETED').length;
        const inProgress = enrollments.filter(e => e.progress > 0 && e.progress < 100).length;
        const notStarted = enrollments.filter(e => e.progress === 0).length;

        employeesWithProgress.push({
          ...employee,
          courseStats: {
            total,
            completed,
            inProgress,
            notStarted,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
          },
          enrollments: enrollments
        });
      }
    }

    return {
      ok: true,
      body: { success: true, data: employeesWithProgress },
      data: employeesWithProgress,
      success: true,
      message: 'Employees with progress loaded successfully'
    };
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: [], 
      success: false, 
      message: 'Failed to load employees with progress' 
    };
  }
}

// Get detailed employee progress for User Courses module
export async function getEmployeeDetailedProgress(employeeId) {
  try {
    const [enrollmentsRes, coursesRes] = await Promise.all([
      getEnrollmentsByEmployee(employeeId),
      getCourses()
    ]);

    if (!enrollmentsRes.ok || !coursesRes.ok) {
      return { 
        ok: false, 
        body: null, 
        data: [], 
        success: false, 
        message: 'Failed to load employee progress' 
      };
    }

    const enrollments = enrollmentsRes.body?.data || [];
    const courses = coursesRes.body?.data || [];

    // Enrich enrollments with course details
    const detailedProgress = enrollments.map(enrollment => {
      const course = courses.find(c => c.id === enrollment.courseId);
      return {
        ...enrollment,
        course: course || { id: enrollment.courseId, title: `Course #${enrollment.courseId}` }
      };
    });

    return {
      ok: true,
      body: { success: true, data: detailedProgress },
      data: detailedProgress,
      success: true,
      message: 'Employee progress loaded successfully'
    };
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: [], 
      success: false, 
      message: 'Failed to load employee progress' 
    };
  }
}

// =====================
// NOTIFICATION SERVICE
// =====================
export async function sendEmail({ to, subject, message }) {
  const res = await fetch(`${NOTIF_BASE}/api/notifications/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, message }),
  });
  return parseJson(res);
}

// =====================
// COURSE APPROVALS - ENHANCED METHODS
// =====================

// Get all enrollments with filtering for Course Approvals module
export async function getEnrollmentsWithFilters(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  try {
    // For now, we'll get all enrollments and filter client-side
    const enrollmentsRes = await getPendingEnrollments();
    if (!enrollmentsRes.ok) {
      return enrollmentsRes;
    }

    let enrollments = enrollmentsRes.body?.data || [];
    
    // Apply filters client-side
    if (filters.status && filters.status !== 'ALL') {
      enrollments = enrollments.filter(e => e.status === filters.status);
    }
    
    if (filters.employeeId) {
      enrollments = enrollments.filter(e => e.employeeId.toString() === filters.employeeId.toString());
    }

    return {
      ok: true,
      body: { success: true, data: enrollments },
      data: enrollments,
      success: true,
      message: 'Filtered enrollments loaded successfully'
    };
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: [], 
      success: false, 
      message: 'Failed to load filtered enrollments' 
    };
  }
}

// =====================
// FEEDBACK SERVICE
// =====================

// Submit feedback
export async function submitFeedback(payload) {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to submit feedback' };
  }
}

// Get my feedbacks (given)
export async function getMyFeedbacks(userId) {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/my/${userId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch my feedbacks' };
  }
}

// Get received feedbacks
export async function getReceivedFeedbacks(employeeId) {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/received?employeeId=${employeeId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch received feedbacks' };
  }
}

// Get given feedbacks
export async function getGivenFeedbacks(givenBy) {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/given?givenBy=${givenBy}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch given feedbacks' };
  }
}

// Get all feedbacks (admin)
export async function getAllFeedbacks() {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/all`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch all feedbacks' };
  }
}

// Get team feedback summary (manager)
export async function getTeamFeedbackSummary(managerId) {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/team/${managerId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to fetch team summary' };
  }
}

// Get feedbacks for target
export async function getFeedbacksForTarget(targetType, targetId) {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/${targetType}/${targetId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch target feedbacks' };
  }
}

// Flag feedback (admin)
export async function flagFeedback(feedbackId) {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/${feedbackId}/flag`, {
      method: 'PUT'
    });
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to flag feedback' };
  }
}

// Get average rating
export async function getAverageRating(targetType, targetId) {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/average/${targetType}/${targetId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: 0, success: false, message: 'Failed to fetch average rating' };
  }
}

// Search received feedbacks
export async function searchReceivedFeedbacks(employeeId, params = {}) {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('employeeId', employeeId);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/search/received?${queryParams}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to search received feedbacks' };
  }
}

// Search given feedbacks
export async function searchGivenFeedbacks(givenBy, params = {}) {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('givenBy', givenBy);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/search/given?${queryParams}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to search given feedbacks' };
  }
}

// Get feedback stats
export async function getFeedbackStats(userId) {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/stats?userId=${userId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to fetch feedback stats' };
  }
}

// Get admin statistics
export async function getAdminStats() {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/admin/stats`);
    return await parseJson(res);
  } catch (error) {
    return { 
      ok: false, 
      body: null, 
      data: null, 
      success: false, 
      message: 'Failed to fetch admin statistics' 
    };
  }
}

// for dropdown 
export async function getExamsForFeedback() {
  try {
    const res = await fetch(`${EXAM_BASE}`);
    return await parseJson(res);
  } catch (error) {
    console.error('Error fetching exams for feedback:', error);
    return { 
      ok: false, 
      message: 'Failed to fetch exams',
      data: [] 
    };
  }
}

// =====================
// UTILITY FUNCTIONS
// =====================

// Helper to handle API errors consistently
export function handleApiError(error, defaultMessage = 'An error occurred') {
  console.error('API Error:', error);
  return {
    ok: false,
    body: null,
    data: null,
    success: false,
    message: error.message || defaultMessage
  };
}

// Helper to check if user can access admin features
export function canAccessAdminFeatures(user) {
  return user?.role && ['ADMIN', 'MANAGER'].includes(user.role.toUpperCase());
}

// Helper to check if user can access manager features
export function canAccessManagerFeatures(user) {
  return user?.role && ['ADMIN', 'MANAGER', 'HR'].includes(user.role.toUpperCase());
}

// =====================
// 🆕 PROGRESS TRACKING ENDPOINTS - ADD THESE
// ====================
/**
 * Check exam eligibility by enrollment ID
 */
export async function checkExamEligibilityByEnrollment(enrollmentId) {
  try {
    const res = await fetch(`${COURSE_BASE}/courses/enrollments/${enrollmentId}/exam-eligibility`);
    return parseJson(res);
  } catch (error) {
    return {
      ok: false,
      body: null,
      data: null,
      success: false,
      message: 'Failed to check exam eligibility'
    };
  }
}