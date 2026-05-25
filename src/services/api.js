// src/services/api.js - COMPLETE WORKING VERSION
// ============================================================================
// BASE URLs
// ============================================================================
const USER_BASE = process.env.REACT_APP_USER_SERVICE || 'http://localhost:8081';
const COURSE_BASE = process.env.REACT_APP_COURSE_SERVICE || 'http://localhost:8091';
const MATERIAL_BASE = process.env.REACT_APP_MATERIAL_SERVICE || 'http://localhost:8082';
const EXAM_BASE = process.env.REACT_APP_EXAM_SERVICE || 'http://localhost:8083/api/exams';
const NOTIF_BASE = process.env.REACT_APP_NOTIFICATION_SERVICE || 'http://localhost:8089';
const FEEDBACK_BASE = process.env.REACT_APP_FEEDBACK_SERVICE || 'http://localhost:8087';
const CERTIFICATE_BASE = process.env.REACT_APP_CERTIFICATE_SERVICE || 'http://localhost:8084/api/certificate';

// ============================================================================
// RESPONSE PARSER (Single source of truth)
// ============================================================================
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
    console.error('Parse response error:', error);
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

async function parseJson(res) {
  return await parseResponse(res);
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================
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

// ============================================================================
// ROLE & PERMISSION HELPERS
// ============================================================================
export function hasUploadPermission(user) {
  return user?.role && ['ADMIN', 'MANAGER', 'HR'].includes(user.role.toUpperCase());
}

export function canEditMaterials(user) {
  return user?.role && ['ADMIN', 'MANAGER', 'HR'].includes(user.role.toUpperCase());
}

export function canDeleteMaterials(user) {
  return user?.role && ['ADMIN', 'MANAGER', 'HR'].includes(user.role.toUpperCase());
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

// ============================================================================
// USER SERVICE
// ============================================================================
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

export async function forgotPassword(email) {
  try {
    const response = await fetch(`${USER_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    return { success: response.ok, message: data.message, data: data.data };
  } catch (error) {
    return { success: false, message: 'Network error occurred' };
  }
}

export async function verifyOtp(email, otp) {
  try {
    const response = await fetch(`${USER_BASE}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await response.json();
    return { success: response.ok, message: data.message, data: data.data };
  } catch (error) {
    return { success: false, message: 'Network error occurred' };
  }
}

export async function resetPassword(email, otp, newPassword) {
  try {
    const response = await fetch(`${USER_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    const data = await response.json();
    return { success: response.ok, message: data.message, data: data.data };
  } catch (error) {
    return { success: false, message: 'Network error occurred' };
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

export async function getManagerTeamEmployees(managerId) {
  try {
    const res = await fetch(`${USER_BASE}/api/users/manager/${managerId}/team`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch team' };
  }
}

// ============================================================================
// COURSE SERVICE
// ============================================================================
export async function getCourses() {
  try {
    const res = await fetch(`${COURSE_BASE}/courses`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to fetch courses' };
  }
}

export async function getAllCourses() {
  return parseJson(await fetch(`${COURSE_BASE}/courses`));
}

export async function getAllCoursesForAdmin() {
  try {
    const res = await fetch(`${COURSE_BASE}/courses/admin/all`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch all courses' };
  }
}

export async function getCourseById(id) {
  return parseJson(await fetch(`${COURSE_BASE}/courses/${id}`));
}

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
      isMandatory: payload.isMandatory
    }),
  });
  return parseJson(res);
}

export async function updateCourse(id, payload) {
  const res = await fetch(`${COURSE_BASE}/courses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function deleteCourse(id) {
  const res = await fetch(`${COURSE_BASE}/courses/${id}`, { method: 'DELETE' });
  return parseJson(res);
}

export async function getMyAvailableCourses(userId) {
  return parseJson(await fetch(`${COURSE_BASE}/courses/available/${userId}`));
}

export async function getCourseReport() {
  try {
    const res = await fetch(`${COURSE_BASE}/courses/reports/summary`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: {}, success: false, message: 'Failed to generate report' };
  }
}

export async function getCourseMaterials(courseId) {
  try {
    if (!courseId || courseId === 'undefined') {
      return { ok: false, body: null, data: [], success: false, message: 'Invalid course ID' };
    }
    const res = await fetch(`${COURSE_BASE}/courses/${courseId}/materials`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch course materials' };
  }
}

// ============================================================================
// ENROLLMENTS
// ============================================================================
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

export async function getMyCourses(employeeId) {
  try {
    const res = await fetch(`${COURSE_BASE}/courses/my/${employeeId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to load courses' };
  }
}

export async function getEnrollmentsByEmployee(employeeId) {
  try {
    const res = await fetch(`${COURSE_BASE}/courses/enrollments/${employeeId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to load enrollments' };
  }
}

export async function updateProgress(enrollmentId, progress) {
  const res = await fetch(`${COURSE_BASE}/courses/enrollments/${enrollmentId}/progress?progress=${progress}`, {
    method: 'PUT'
  });
  return parseJson(res);
}

export async function incrementProgress(enrollmentId, incrementBy) {
  try {
    const res = await fetch(`${COURSE_BASE}/courses/enrollments/${enrollmentId}/increment-progress?incrementBy=${incrementBy}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to increment progress' };
  }
}

export async function markContentComplete(enrollmentId, contentType, contentTitle) {
  try {
    const res = await fetch(`${COURSE_BASE}/courses/enrollments/${enrollmentId}/mark-complete?contentType=${encodeURIComponent(contentType)}&contentTitle=${encodeURIComponent(contentTitle)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to mark content as completed' };
  }
}

// ============================================================================
// ASSIGNMENTS
// ============================================================================
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

export async function getPendingAssignments() {
  return parseJson(await fetch(`${COURSE_BASE}/assignments/pending`));
}

export async function approveAssignment(id, approverId) {
  const res = await fetch(`${COURSE_BASE}/assignments/${id}/approve?approverId=${approverId}`, {
    method: 'PUT'
  });
  return parseJson(res);
}

export async function rejectAssignment(id, approverId) {
  const res = await fetch(`${COURSE_BASE}/assignments/${id}/reject?approverId=${approverId}`, {
    method: 'PUT'
  });
  return parseJson(res);
}

export async function createBulkAssignment(payload) {
  try {
    const res = await fetch(`${COURSE_BASE}/assignments/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to create bulk assignments' };
  }
}

// ============================================================================
// APPROVALS
// ============================================================================
export async function getPendingEnrollments() {
  try {
    const res = await fetch(`${COURSE_BASE}/courses/enrollments/pending`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to load pending enrollments' };
  }
}

export async function approveEnrollment(id) {
  const res = await fetch(`${COURSE_BASE}/courses/enrollments/${id}/approve`, { method: 'PUT' });
  return parseJson(res);
}

export async function rejectEnrollment(id) {
  const res = await fetch(`${COURSE_BASE}/courses/enrollments/${id}/reject`, { method: 'PUT' });
  return parseJson(res);
}

// ============================================================================
// MATERIAL SERVICE
// ============================================================================
export async function getMaterials() {
  try {
    const res = await fetch(`${MATERIAL_BASE}/api/materials`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch materials' };
  }
}

export async function uploadMaterial(formData) {
  try {
    const res = await fetch(`${MATERIAL_BASE}/api/materials/upload`, {
      method: "POST",
      body: formData,
    });
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to upload material' };
  }
}

export async function getMaterialById(id) {
  try {
    const res = await fetch(`${MATERIAL_BASE}/api/materials/${id}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to fetch material' };
  }
}

export async function updateMaterial(id, formData) {
  try {
    const res = await fetch(`${MATERIAL_BASE}/api/materials/${id}`, {
      method: 'PUT',
      body: formData,
    });
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to update material' };
  }
}

export async function deleteMaterial(id) {
  try {
    const res = await fetch(`${MATERIAL_BASE}/api/materials/${id}`, { method: 'DELETE' });
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to delete material' };
  }
}

export async function downloadMaterial(id) {
  try {
    const res = await fetch(`${MATERIAL_BASE}/api/materials/download/${id}`);
    if (!res.ok) throw new Error("Download failed");
    return await res.blob();
  } catch (error) {
    console.error("Download material error:", error);
    throw error;
  }
}

// ============================================================================
// CERTIFICATE SERVICE
// ============================================================================
export const certificateAPI = {
  getEmployeeCertificates: async (employeeId) => {
    try {
      const res = await fetch(`${CERTIFICATE_BASE}/employee/${employeeId}`);
      return await parseJson(res);
    } catch (error) {
      return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch employee certificates' };
    }
  },

  downloadEmployeeCertificate: async (employeeId, certificationId) => {
    try {
      const res = await fetch(`${CERTIFICATE_BASE}/employee/${employeeId}/download/${certificationId}`);
      return await parseResponse(res);
    } catch (error) {
      return { ok: false, body: null, data: null, success: false, message: 'Failed to download certificate' };
    }
  },

  generateCertificate: async (certificateData, creatorId) => {
    try {
      const res = await fetch(`${CERTIFICATE_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Creator-Id': creatorId.toString() },
        body: JSON.stringify(certificateData)
      });
      return await parseJson(res);
    } catch (error) {
      return { ok: false, body: null, data: null, success: false, message: 'Failed to generate certificate' };
    }
  },

  getAllCertificates: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      const url = `${CERTIFICATE_BASE}/admin${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      return await parseJson(res);
    } catch (error) {
      return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch certificates' };
    }
  }
};

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================
export async function sendEmail({ to, subject, message }) {
  const res = await fetch(`${NOTIF_BASE}/api/notifications/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, message }),
  });
  return parseJson(res);
}

// ============================================================================
// FEEDBACK SERVICE
// ============================================================================
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

export async function getAllFeedbacks() {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/all`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch all feedbacks' };
  }
}

export async function getReceivedFeedbacks(employeeId) {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/received?employeeId=${employeeId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch received feedbacks' };
  }
}

export async function getGivenFeedbacks(givenBy) {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/given?givenBy=${givenBy}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch given feedbacks' };
  }
}

export async function getTeamFeedbackSummary(managerId) {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/team/${managerId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to fetch team summary' };
  }
}

export async function getFeedbacksForTarget(targetType, targetId) {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/${targetType}/${targetId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch feedbacks' };
  }
}

export async function getAverageRating(targetType, targetId) {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/average/${targetType}/${targetId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: 0, success: false, message: 'Failed to fetch average rating' };
  }
}

export async function getAdminStats() {
  try {
    const res = await fetch(`${FEEDBACK_BASE}/api/feedback/admin/stats`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to fetch admin stats' };
  }
}

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

export async function getExamsForFeedback() {
  try {
    const res = await fetch(`${EXAM_BASE}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch exams' };
  }
}

// ============================================================================
// EXAM SERVICE
// ============================================================================
export async function getExams() {
  try {
    const res = await fetch(`${EXAM_BASE}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch exams' };
  }
}

export async function getExamsForEmployee(employeeId) {
  try {
    const res = await fetch(`${EXAM_BASE}/employee/${employeeId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch employee exams' };
  }
}

export async function getExamById(id) {
  try {
    const res = await fetch(`${EXAM_BASE}/${id}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to fetch exam' };
  }
}

export async function getQuestions(examId) {
  try {
    const res = await fetch(`${EXAM_BASE}/${examId}/questions`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch questions' };
  }
}

export async function createExam(payload) {
  try {
    const res = await fetch(`${EXAM_BASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to create exam' };
  }
}

export async function addQuestion(examId, payload) {
  try {
    const res = await fetch(`${EXAM_BASE}/${examId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to add question' };
  }
}

export async function deleteExam(id) {
  try {
    const res = await fetch(`${EXAM_BASE}/${id}`, { method: 'DELETE' });
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to delete exam' };
  }
}

export async function updateExam(id, payload) {
  try {
    const res = await fetch(`${EXAM_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to update exam' };
  }
}

export async function checkExamEligibility(examId, employeeId) {
  try {
    const res = await fetch(`${EXAM_BASE}/${examId}/eligibility/${employeeId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: { isEligible: false }, success: false, message: 'Failed to check eligibility' };
  }
}

export async function startAttempt(examId, employeeId) {
  try {
    const res = await fetch(`${EXAM_BASE}/${examId}/start?employeeId=${employeeId}`, {
      method: 'POST',
    });
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to start attempt' };
  }
}

export async function submitAttempt(examId, payload) {
  try {
    const res = await fetch(`${EXAM_BASE}/${examId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: null, success: false, message: 'Failed to submit attempt' };
  }
}

export async function getEmployeeResults(employeeId) {
  try {
    const res = await fetch(`${EXAM_BASE}/results/employee/${employeeId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch results' };
  }
}

export async function getAllResults() {
  try {
    const res = await fetch(`${EXAM_BASE}/results`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch results' };
  }
}

export async function getAnalytics(filters = {}) {
  try {
    let url = `http://localhost:8086/api/analytics`;
    if (filters.employeeId) url = `${url}/employee/${filters.employeeId}`;
    else if (filters.examId) url = `${url}/exam/${filters.examId}`;
    const res = await fetch(url);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: [], success: false, message: 'Failed to fetch analytics' };
  }
}

export async function getTotalEmployeesCount() {
  try {
    const res = await fetch(`${EXAM_BASE}/employees/count`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: 0, success: false, message: 'Failed to fetch count' };
  }
}

export async function getPendingExamsCount(employeeId) {
  try {
    const res = await fetch(`${EXAM_BASE}/pending-count/${employeeId}`);
    return await parseJson(res);
  } catch (error) {
    return { ok: false, body: null, data: 0, success: false, message: 'Failed to fetch pending exams count' };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
export function handleApiError(error, defaultMessage = 'An error occurred') {
  console.error('API Error:', error);
  return { ok: false, body: null, data: null, success: false, message: error.message || defaultMessage };
}

export function canAccessAdminFeatures(user) {
  return user?.role && ['ADMIN', 'MANAGER'].includes(user.role.toUpperCase());
}