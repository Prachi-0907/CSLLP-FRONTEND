import React, { useState, useEffect } from "react";
import { 
  getAssignments, 
  getAllCoursesForAdmin,
  createCourse,
  updateCourse,
  getMaterials,
  deleteCourse,
  createBulkAssignment,
  getUsers
} from "../services/api";

// POPUP MODAL COMPONENT
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

export default function CourseManagement({ user }) {
  const [activeTab, setActiveTab] = useState("catalog");
  const [popup, setPopup] = useState({
    show: false,
    type: "INFO",
    title: "",
    message: "",
    onConfirm: null
  });
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Refresh function - actually refreshes the current tab
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container-fluid">
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
    <div className="d-flex align-items-center gap-2 mb-1">
      <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>⚙️</span>
      <div>
        <h2 className="mb-0 fw-bold">Course Management</h2>
        <small className="text-muted">Manage courses and assignments</small>
      </div>
    </div>
  </div>
  <div className="d-flex gap-2 align-items-center">
    <span className="me-3">Welcome, {user.name}</span>
    <button
      className="btn btn-outline-primary btn-sm"
      onClick={handleRefresh}
      title="Refresh data"
    >
      🔄 Refresh
    </button>
  </div>
</div>

      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            ➕ Create Course
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === "catalog" ? "active" : ""}`}
            onClick={() => setActiveTab("catalog")}
          >
            📚 Course Catalog
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === "assignments" ? "active" : ""}`}
            onClick={() => setActiveTab("assignments")}
          >
            📋 Course Assignments
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === "assign" ? "active" : ""}`}
            onClick={() => setActiveTab("assign")}
          >
            👥 Assign Course
          </button>
        </li>
      </ul>

      <div className="tab-content mt-3 p-3 border border-top-0 rounded-bottom">
        {activeTab === "assignments" && <CourseAssignmentsTab key={refreshKey} showSuccess={showSuccess} showError={showError} />}
        {activeTab === "catalog" && <CourseCatalogTab key={refreshKey} user={user} showSuccess={showSuccess} showError={showError} showConfirm={showConfirm} />}
        {activeTab === "create" && <CreateCourseTab user={user} showSuccess={showSuccess} showError={showError} />}
        {activeTab === "assign" && <AssignCourseTab user={user} showSuccess={showSuccess} showError={showError} />}
      </div>
    </div>
  );
}

// Create Course Tab Component
function CreateCourseTab({ user, showSuccess, showError }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    durationHours: '',
    paid: false,
    price: '0',
    createdBy: user.id,
    materials: [],
    isMandatory: false
  });
  const [loading, setLoading] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAvailableMaterials();
  }, []);

  const loadAvailableMaterials = async () => {
    setMaterialsLoading(true);
    try {
      const res = await getMaterials();
      if (res.ok && res.body && res.body.success) {
        setAvailableMaterials(res.body.data || []);
      }
    } catch (error) {
      console.error("Failed to load materials:", error);
      showError("Load Error", "Failed to load materials. Please try again.");
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const courseData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        durationHours: parseInt(formData.durationHours),
        paid: formData.paid,
        price: formData.paid ? parseFloat(formData.price) : 0,
        createdBy: user.id,
        materials: formData.materials,
        isMandatory: formData.isMandatory
      };
      
      const res = await createCourse(courseData);
      
      if (res.ok && res.body && res.body.success) {
        showSuccess(
          "Course Created Successfully!",
          <div className="text-start">
            <p><strong>Course:</strong> {formData.title}</p>
            <p><strong>Category:</strong> {formData.category}</p>
            <p><strong>Duration:</strong> {formData.durationHours} hours</p>
            <p><strong>Type:</strong> {formData.paid ? `Paid - $${formData.price}` : 'Free'}</p>
            <p><strong>Course Type:</strong> {formData.isMandatory ? 'Mandatory' : 'Optional'}</p>
            {formData.isMandatory && (
              <p className="text-success">✅ This course will be automatically assigned to all employees</p>
            )}
            <p><strong>Materials:</strong> {formData.materials.length} attached</p>
            <p className="mb-0 mt-2 text-success">✅ Course is now available in the catalog!</p>
          </div>
        );
        
        setFormData({
          title: '',
          description: '',
          category: '',
          durationHours: '',
          paid: false,
          price: '0',
          createdBy: user.id,
          materials: [],
          isMandatory: false
        });
        setSearchTerm('');
        setIsDropdownOpen(false);
      } else {
        const errorMsg = res.body?.message || 'Unknown error occurred';
        showError(
          "Course Creation Failed",
          <div className="text-start">
            <p><strong>Course:</strong> {formData.title}</p>
            <p><strong>Error:</strong> {errorMsg}</p>
            <p className="mb-0">Please check your input and try again.</p>
          </div>
        );
      }
    } catch (error) {
      showError(
        "Network Error",
        <div className="text-start">
          <p><strong>Course:</strong> {formData.title}</p>
          <p><strong>Error:</strong> {error.message}</p>
          <p className="mb-0">Please check your internet connection and try again.</p>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMaterialSelect = (materialId) => {
    setFormData(prev => {
      const currentMaterials = prev.materials || [];
      if (currentMaterials.includes(materialId)) {
        return prev;
      } else {
        return {
          ...prev,
          materials: [...currentMaterials, materialId]
        };
      }
    });
  };

  const handleRemoveMaterial = (materialId) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter(id => id !== materialId)
    }));
  };

  const filteredMaterials = availableMaterials.filter(material =>
    material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedMaterials = availableMaterials.filter(material =>
    formData.materials.includes(material.id)
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.materials-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div className="row justify-content-center">
      <div className="col-md-10">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="card-title mb-0">➕ Create New Course</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-8">
                  <label className="form-label">Course Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter course title"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Frontend">Frontend Development</option>
                    <option value="Backend">Backend Development</option>
                    <option value="Fullstack">Fullstack Development</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Mobile">Mobile Development</option>
                    <option value="Cloud">Cloud Computing</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Soft Skills">Soft Skills</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Course Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the course content, objectives, and target audience..."
                />
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Duration (Hours) *</label>
                  <input
                    type="number"
                    className="form-control"
                    name="durationHours"
                    value={formData.durationHours}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="e.g., 40"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Course Type</label>
                  <div className="mt-2">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="paid"
                        checked={formData.paid}
                        onChange={handleChange}
                      />
                      <label className="form-check-label">
                        Paid Course
                      </label>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  {formData.paid && (
                    <>
                      <label className="form-label">Price *</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        required
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Mandatory Course</label>
                  <div className="mt-2">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="isMandatory"
                        checked={formData.isMandatory}
                        onChange={handleChange}
                      />
                      <label className="form-check-label">
                        Mandatory Course
                      </label>
                    </div>
                  </div>
                  {formData.isMandatory && (
                    <small className="form-text text-success d-block mt-1">
                      <strong>✓ This course will be automatically assigned to ALL employees</strong>
                    </small>
                  )}
                </div>
              </div>

              <div className="mb-4 materials-dropdown-container">
                <label className="form-label fw-bold">📎 Course Materials</label>
                <div className="form-text mb-3">
                  Select materials from your material library to include in this course.
                </div>
                
                {materialsLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    Loading materials...
                  </div>
                ) : availableMaterials.length === 0 ? (
                  <div className="alert alert-info">
                    <small>No materials available.</small>
                  </div>
                ) : (
                  <div>
                    <div className="dropdown">
                      <button
                        className="btn btn-outline-secondary dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center"
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        <span>
                          {selectedMaterials.length > 0 
                            ? `${selectedMaterials.length} material(s) selected` 
                            : 'Select materials...'}
                        </span>
                        <span className="ms-auto">🔽</span>
                      </button>
                      
                      {isDropdownOpen && (
                        <div 
                          className="dropdown-menu show w-100 p-3"
                          style={{ 
                            maxHeight: '400px', 
                            overflowY: 'auto',
                            zIndex: 1050
                          }}
                        >
                          <div className="mb-3">
                            <div className="input-group">
                              <span className="input-group-text">🔍</span>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Search materials by title, description, or type..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="materials-list">
                            {filteredMaterials.length === 0 ? (
                              <div className="text-center text-muted py-3">
                                No materials found matching your search.
                              </div>
                            ) : (
                              filteredMaterials.map(material => {
                                const isSelected = formData.materials.includes(material.id);
                                return (
                                  <div
                                    key={material.id}
                                    className={`dropdown-item p-3 border-bottom ${isSelected ? 'bg-light' : ''}`}
                                    onClick={() => handleMaterialSelect(material.id)}
                                    style={{ 
                                      cursor: 'pointer',
                                      borderLeft: isSelected ? '4px solid #0d6efd' : '4px solid transparent'
                                    }}
                                  >
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div className="flex-grow-1">
                                        <div className="d-flex align-items-center mb-1">
                                          <span className="material-icon me-2" style={{ fontSize: '1.2em' }}>
                                            {getMaterialIcon(material.type)}
                                          </span>
                                          <strong className="small">{material.title}</strong>
                                          {isSelected && (
                                            <span className="badge bg-success ms-2">Selected</span>
                                          )}
                                        </div>
                                        <div className="small text-muted mb-1">
                                          {material.description || 'No description available'}
                                        </div>
                                        <div className="small text-muted">
                                          <span className={`badge ${getMaterialTypeBadge(material.type)} me-2`}>
                                            {material.type}
                                          </span>
                                          {material.fileSize && (
                                            <span className="me-2">• {material.fileSize}</span>
                                          )}
                                          {material.createdAt && (
                                            <span>• {new Date(material.createdAt).toLocaleDateString()}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          <div className="text-center mt-3 pt-2 border-top">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedMaterials.length > 0 && (
                      <div className="mt-3">
                        <div className="card border-primary">
                          <div className="card-header bg-light">
                            <strong>Selected Materials ({selectedMaterials.length})</strong>
                          </div>
                          <div className="card-body p-3">
                            <div className="row">
                              {selectedMaterials.map(material => (
                                <div key={material.id} className="col-md-6 mb-2">
                                  <div className="d-flex justify-content-between align-items-center p-2 border rounded bg-light">
                                    <div className="d-flex align-items-center">
                                      <span className="material-icon me-2" style={{ fontSize: '1.1em' }}>
                                        {getMaterialIcon(material.type)}
                                      </span>
                                      <div>
                                        <div className="small fw-bold text-truncate" style={{ maxWidth: '200px' }}>
                                          {material.title}
                                        </div>
                                        <div className="small text-muted">
                                          <span className={`badge ${getMaterialTypeBadge(material.type)}`}>
                                            {material.type}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleRemoveMaterial(material.id)}
                                      title="Remove material"
                                    >
                                      ❌
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary me-md-2"
                  onClick={() => {
                    setFormData({
                      title: '',
                      description: '',
                      category: '',
                      durationHours: '',
                      paid: false,
                      price: '0',
                      createdBy: user.id,
                      materials: [],
                      isMandatory: false
                    });
                    setSearchTerm('');
                    setIsDropdownOpen(false);
                  }}
                >
                  Clear Form
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Course...
                    </>
                  ) : (
                    '🚀 Create Course'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 p-3 bg-light rounded">
              <h6>💡 Course Creation Tips:</h6>
              <ul className="small mb-0">
                <li>Use clear and descriptive course titles</li>
                <li>Provide detailed descriptions to help employees understand course content</li>
                <li>Set appropriate durations based on course complexity</li>
                <li>Choose relevant categories for better organization</li>
                <li>Select relevant materials to enhance the learning experience</li>
                <li><strong>Mandatory courses</strong> are automatically assigned to all employees</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for material type badges and icons
function getMaterialTypeBadge(type) {
  const badgeConfig = {
    'PDF': 'bg-danger',
    'VIDEO': 'bg-primary',
    'AUDIO': 'bg-success',
    'DOCUMENT': 'bg-info',
    'PRESENTATION': 'bg-warning',
    'SPREADSHEET': 'bg-success',
    'IMAGE': 'bg-secondary',
    'OTHER': 'bg-dark'
  };
  return badgeConfig[type] || 'bg-secondary';
}

function getMaterialIcon(type) {
  const iconConfig = {
    'PDF': '📄',
    'VIDEO': '🎥',
    'AUDIO': '🎵',
    'DOCUMENT': '📝',
    'PRESENTATION': '📊',
    'SPREADSHEET': '📈',
    'IMAGE': '🖼️',
    'OTHER': '📎'
  };
  return iconConfig[type] || '📎';
}

// CourseCatalogTab
function CourseCatalogTab({ user, showSuccess, showError, showConfirm }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [editingCourse, setEditingCourse] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadCourses();
    loadAvailableMaterials();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await getAllCoursesForAdmin();
      
      if (res.ok && res.body && res.body.success) {
        const coursesData = res.body.data || [];
        setCourses(coursesData);
      } else {
        setCourses([]);
        showError("Load Error", "Failed to load courses. Please try again.");
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
      setCourses([]);
      showError("Load Error", "Failed to load courses. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableMaterials = async () => {
    setMaterialsLoading(true);
    try {
      const res = await getMaterials();
      if (res.ok && res.body && res.body.success) {
        setAvailableMaterials(res.body.data || []);
      }
    } catch (error) {
      console.error("Failed to load materials:", error);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleStatusToggle = async (course) => {
    const newStatus = course.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    try {
      let res;
      
      if (newStatus === 'INACTIVE') {
        res = await deleteCourse(course.id);
      } else {
        const courseData = {
          title: course.title,
          description: course.description,
          category: course.category,
          durationHours: course.durationHours,
          paid: course.paid || course.isPaid || false,
          price: course.price || 0,
          materials: course.materials || course.materialIds || [],
          status: 'ACTIVE',
          createdBy: course.createdBy || user.id,
          isMandatory: course.isMandatory || false
        };
        res = await updateCourse(course.id, courseData);
      }
      
      if (res.ok && res.body && res.body.success) {
        showSuccess(
          `Course ${newStatus === 'ACTIVE' ? 'Activated' : 'Deactivated'}!`,
          <div className="text-start">
            <p><strong>Course:</strong> {course.title}</p>
            <p><strong>New Status:</strong> 
              <span className={`badge ${newStatus === 'ACTIVE' ? 'bg-success' : 'bg-danger'} ms-2`}>
                {newStatus}
              </span>
            </p>
            <p className="mb-0">
              {newStatus === 'ACTIVE' 
                ? '✅ Course is now visible to employees' 
                : '✅ Course is now hidden from employees'}
            </p>
          </div>
        );
        
        setTimeout(() => {
          loadCourses();
        }, 500);
        
      } else {
        const errorMessage = res.body?.message || 'Unknown error';
        showError(
          "Status Update Failed",
          <div className="text-start">
            <p><strong>Course:</strong> {course.title}</p>
            <p><strong>Error:</strong> {errorMessage}</p>
            <p className="mb-0">Please try again.</p>
          </div>
        );
      }
    } catch (error) {
      console.error('Network error:', error);
      showError(
        "Network Error",
        <div className="text-start">
          <p><strong>Course:</strong> {course.title}</p>
          <p><strong>Error:</strong> {error.message}</p>
          <p className="mb-0">Please check your connection and try again.</p>
        </div>
      );
    }
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;

    setEditLoading(true);
    try {
      const courseData = {
        title: editingCourse.title,
        description: editingCourse.description,
        category: editingCourse.category,
        durationHours: parseInt(editingCourse.durationHours),
        paid: editingCourse.paid,
        price: editingCourse.paid ? parseFloat(editingCourse.price) : 0,
        materials: editingCourse.materials || [],
        status: editingCourse.status || 'ACTIVE',
        createdBy: editingCourse.createdBy || user.id,
        isMandatory: editingCourse.isMandatory || false
      };

      const res = await updateCourse(editingCourse.id, courseData);
      
      if (res.ok && res.body && res.body.success) {
        showSuccess(
          "Course Updated Successfully!",
          <div className="text-start">
            <p><strong>Course:</strong> {editingCourse.title}</p>
            <p><strong>Category:</strong> {editingCourse.category}</p>
            <p><strong>Status:</strong> {editingCourse.status}</p>
            <p><strong>Type:</strong> {editingCourse.isMandatory ? 'Mandatory' : 'Optional'}</p>
            <p className="mb-0">✅ Changes have been saved successfully!</p>
          </div>
        );
        setEditingCourse(null);
        loadCourses();
      } else {
        const errorMessage = res.body?.message || 'Unknown error';
        showError(
          "Update Failed",
          <div className="text-start">
            <p><strong>Course:</strong> {editingCourse.title}</p>
            <p><strong>Error:</strong> {errorMessage}</p>
            <p className="mb-0">Please try again.</p>
          </div>
        );
      }
    } catch (error) {
      showError(
        "Network Error",
        <div className="text-start">
          <p><strong>Course:</strong> {editingCourse.title}</p>
          <p><strong>Error:</strong> {error.message}</p>
          <p className="mb-0">Please check your connection and try again.</p>
        </div>
      );
    } finally {
      setEditLoading(false);
    }
  };

  const startEdit = (course) => {
    setEditingCourse({ 
      id: course.id,
      title: course.title || '',
      description: course.description || '',
      category: course.category || 'Frontend',
      durationHours: course.durationHours ? course.durationHours.toString() : '1',
      paid: course.paid || course.isPaid || false,
      price: course.price ? course.price.toString() : '0',
      materials: course.materials || course.materialIds || [],
      status: course.status || 'ACTIVE',
      createdBy: course.createdBy || user.id,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      isMandatory: course.isMandatory || false
    });
  };

  const cancelEdit = () => {
    setEditingCourse(null);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || course.category === categoryFilter;
    const matchesStatus = !statusFilter || course.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalItems = filteredCourses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCourses = filteredCourses.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const categories = [...new Set(courses.map(course => course.category).filter(Boolean))];

  if (loading) return <div className="text-center py-4">Loading courses...</div>;

  if (editingCourse) {
    return (
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card">
            <div className="card-header bg-warning text-dark">
              <h5 className="card-title mb-0">✏️ Edit Course: {editingCourse.title}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleEditCourse}>
                <div className="row mb-3">
                  <div className="col-md-8">
                    <label className="form-label">Course Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingCourse.title}
                      onChange={(e) => setEditingCourse(prev => ({...prev, title: e.target.value}))}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={editingCourse.category}
                      onChange={(e) => setEditingCourse(prev => ({...prev, category: e.target.value}))}
                      required
                    >
                      <option value="Frontend">Frontend Development</option>
                      <option value="Backend">Backend Development</option>
                      <option value="Fullstack">Fullstack Development</option>
                      <option value="DevOps">DevOps</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Mobile">Mobile Development</option>
                      <option value="Cloud">Cloud Computing</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="Soft Skills">Soft Skills</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Course Description</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={editingCourse.description}
                    onChange={(e) => setEditingCourse(prev => ({...prev, description: e.target.value}))}
                  />
                </div>

                <div className="row mb-3">
                  <div className="col-md-4">
                    <label className="form-label">Duration (Hours) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editingCourse.durationHours}
                      onChange={(e) => setEditingCourse(prev => ({...prev, durationHours: e.target.value}))}
                      required
                      min="1"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Course Type</label>
                    <div className="mt-2">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={editingCourse.paid}
                          onChange={(e) => setEditingCourse(prev => ({...prev, paid: e.target.checked}))}
                        />
                        <label className="form-check-label">
                          Paid Course
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    {editingCourse.paid && (
                      <>
                        <label className="form-label">Price ($) *</label>
                        <input
                          type="number"
                          className="form-control"
                          value={editingCourse.price}
                          onChange={(e) => setEditingCourse(prev => ({...prev, price: e.target.value}))}
                          min="0"
                          step="0.01"
                          required
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-4">
                    <label className="form-label">Mandatory Course</label>
                    <div className="mt-2">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={editingCourse.isMandatory}
                          onChange={(e) => setEditingCourse(prev => ({...prev, isMandatory: e.target.checked}))}
                        />
                        <label className="form-check-label">
                          Mandatory Course
                        </label>
                      </div>
                    </div>
                    {editingCourse.isMandatory && (
                      <small className="form-text text-success d-block mt-1">
                        <strong>✓ This course will be automatically assigned to ALL employees</strong>
                      </small>
                    )}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={editingCourse.status}
                      onChange={(e) => setEditingCourse(prev => ({...prev, status: e.target.value}))}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Course ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingCourse.id}
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">📎 Course Materials</label>
                  <div className="form-text mb-3">
                    Currently selected: {editingCourse.materials.length} materials
                  </div>
                  {materialsLoading ? (
                    <div className="text-center py-2">
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                      Loading materials...
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      <small>
                        Material management is available in the Create Course form. 
                        To change materials, please create a new course version.
                      </small>
                    </div>
                  )}
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary me-md-2"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-warning"
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Updating...
                      </>
                    ) : (
                      '💾 Update Course'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const PaginationControls = () => (
    <div className="d-flex justify-content-between align-items-center mt-4">
      <div className="text-muted">
        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} courses
      </div>
      
      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center">
          <label className="form-label mb-0 me-2">Show:</label>
          <select 
            className="form-select form-select-sm" 
            style={{width: '80px'}}
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(e.target.value)}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <nav>
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                «
              </button>
            </li>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              </li>
            ))}
            
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );

  return (
    <div>
      <div className="row mb-4">
  <div className="col-md-4">
    <div className="input-group">
      <span className="input-group-text">🔍</span>
      <input
        type="text"
        className="form-control"
        placeholder="Search courses..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  </div>
  <div className="col-md-4">
    <select
      className="form-select"
      value={categoryFilter}
      onChange={(e) => setCategoryFilter(e.target.value)}
    >
      <option value="">All Categories</option>
      {categories.map(category => (
        <option key={category} value={category}>{category}</option>
      ))}
    </select>
  </div>
  <div className="col-md-4">
    <select
      className="form-select"
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
    >
      <option value="ACTIVE">Active Courses</option>
      <option value="INACTIVE">Inactive Courses</option>
      <option value="">All Status</option>
    </select>
  </div>
</div>

     <div className="table-responsive">
  <table className="table table-striped table-hover" style={{ tableLayout: 'fixed', minWidth: '900px' }}>
    <thead className="table-dark">
      <tr>
        <th style={{ width: '50px', whiteSpace: 'nowrap' }}>ID</th>
        <th style={{ width: '220px' }}>Title</th>
        <th style={{ width: '100px', whiteSpace: 'nowrap' }}>Category</th>
        <th style={{ width: '80px', whiteSpace: 'nowrap' }}>Duration</th>
        <th style={{ width: '90px', whiteSpace: 'nowrap' }}>Type</th>
        <th style={{ width: '110px', whiteSpace: 'nowrap' }}>Assignment</th>
        <th style={{ width: '90px', whiteSpace: 'nowrap' }}>Materials</th>
        <th style={{ width: '90px', whiteSpace: 'nowrap' }}>Status</th>
        <th style={{ width: '80px', whiteSpace: 'nowrap' }}>Created By</th>
        <th style={{ width: '100px', whiteSpace: 'nowrap' }}>Created Date</th>
        <th style={{ width: '130px', whiteSpace: 'nowrap' }}>Actions</th>
      </tr>
    </thead>
    <tbody>
      {currentCourses.map(course => (
        <tr key={course.id}>
          <td style={{ whiteSpace: 'nowrap' }}>#{course.id}</td>
          <td>
            <strong>{course.title}</strong>
            <br />
            <small className="text-muted">{course.description}</small>
          </td>
          <td style={{ whiteSpace: 'nowrap' }}>{course.category}</td>
          <td style={{ whiteSpace: 'nowrap' }}>{course.durationHours}h</td>
          <td>
            <span className={`badge ${course.paid || course.isPaid ? 'bg-warning' : 'bg-success'}`}>
              {course.paid || course.isPaid ? `Paid` : 'Free'}
            </span>
          </td>
          <td>
            <span className={`badge ${course.isMandatory ? 'bg-warning' : 'bg-info'}`}>
              {course.isMandatory ? 'Mandatory' : 'Optional'}
            </span>
          </td>
          <td style={{ whiteSpace: 'nowrap' }}>
            <span className="badge bg-info">
              {course.materials ? course.materials.length : 0} 📎
            </span>
          </td>
          <td>
            <span className={`badge ${course.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`}>
              {course.status || 'ACTIVE'}
            </span>
          </td>
          <td style={{ whiteSpace: 'nowrap' }}>#{course.createdBy}</td>
          <td style={{ whiteSpace: 'nowrap' }}>
            {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}
          </td>
          <td>
            <div className="btn-group">
              <button
                className="btn btn-outline-warning btn-sm"
                onClick={() => startEdit(course)}
                title="Edit course"
              >
                ✏️
              </button>
              <button
                className={`btn btn-sm ${course.status === 'ACTIVE' ? 'btn-success' : 'btn-danger'}`}
                onClick={() => handleStatusToggle(course)}
                style={{ minWidth: '75px', fontWeight: 'bold' }}
              >
                {course.status === 'ACTIVE' ? '✓ Active' : '✗ Inactive'}
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      {totalItems > 0 && <PaginationControls />}
    </div>
  );
}

// CourseAssignmentsTab
function CourseAssignmentsTab({ showSuccess, showError }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    employeeId: '',
    courseId: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadAssignments();
  }, [filters]);

  const loadAssignments = async () => {
    try {
      const res = await getAssignments(filters);
      if (res.ok && res.body && res.body.success) {
        setAssignments(res.body.data || []);
      } else {
        setAssignments([]);
        showError("Load Error", "Failed to load assignments. Please try again.");
      }
    } catch (error) {
      console.error("Failed to load assignments:", error);
      setAssignments([]);
      showError("Load Error", "Failed to load assignments. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': 'bg-warning',
      'APPROVED': 'bg-success', 
      'REJECTED': 'bg-danger',
      'IN_PROGRESS': 'bg-info',
      'COMPLETED': 'bg-primary'
    };
    return <span className={`badge ${statusConfig[status] || 'bg-secondary'}`}>{status}</span>;
  };

  const totalItems = assignments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssignments = assignments.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  if (loading) return <div className="text-center">Loading assignments...</div>;

  const PaginationControls = () => (
    <div className="d-flex justify-content-between align-items-center mt-4">
      <div className="text-muted">
        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} assignments
      </div>
      
      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center">
          <label className="form-label mb-0 me-2">Show:</label>
          <select 
            className="form-select form-select-sm" 
            style={{width: '80px'}}
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(e.target.value)}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <nav>
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                «
              </button>
            </li>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              </li>
            ))}
            
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );

  return (
    <div>
      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">Status Filter</label>
          <select 
            className="form-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Employee ID</label>
          <input 
            type="number" 
            className="form-control"
            placeholder="Filter by employee..."
            value={filters.employeeId}
            onChange={(e) => handleFilterChange('employeeId', e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Course ID</label>
          <input 
            type="number" 
            className="form-control"
            placeholder="Filter by course..."
            value={filters.courseId}
            onChange={(e) => handleFilterChange('courseId', e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Employee ID</th>
              <th>Course ID</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Assigned By</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {currentAssignments.map(assignment => (
              <tr key={assignment.id}>
                <td>{assignment.id}</td>
                <td>#{assignment.employeeId}</td>
                <td>#{assignment.courseId}</td>
                <td>{assignment.dueDate || 'Not set'}</td>
                <td>{getStatusBadge(assignment.status)}</td>
                <td>#{assignment.assignedBy}</td>
                <td>{new Date(assignment.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {currentAssignments.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted">No assignments found</p>
          </div>
        )}
      </div>

      {totalItems > 0 && <PaginationControls />}
    </div>
  );
}

// AssignCourseTab - UPDATED (Due date made mandatory)
function AssignCourseTab({ user, showSuccess, showError }) {
  const [formData, setFormData] = useState({
    employees: [],
    courseNames: [],
    courseIds: [],
    dueDate: '',
    notes: '',
    assignedBy: user.id
  });
  const [loading, setLoading] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // ✅ ADD VALIDATION STATE VARIABLES
  const [validationErrors, setValidationErrors] = useState({
    employees: '',
    courses: '',
    dueDate: ''
  });
  const [touched, setTouched] = useState({
    employees: false,
    courses: false,
    dueDate: false
  });

  const validateForm = () => {
    const errors = {
      employees: '',
      courses: '',
      dueDate: ''
    };
    let isValid = true;

    if (!formData.employees || formData.employees.length === 0) {
      errors.employees = 'Please select at least one employee';
      isValid = false;
    }

    if (!formData.courseNames || formData.courseNames.length === 0) {
      errors.courses = 'Please select at least one course';
      isValid = false;
    }

    if (!formData.dueDate) {
      errors.dueDate = 'Due date is required for course assignments';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleFieldBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  useEffect(() => {
    loadAllEmployees();
    loadAllCourses();
  }, []);

  // Load all employees for dropdown using getUsers
  const loadAllEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const res = await getUsers();
      if (res.ok && res.body && res.body.success) {
        const employees = (res.body.data || []).filter(employee => 
          employee.role === 'EMPLOYEE' || !employee.role
        ).map(employee => {
          const employeeName = employee.name || employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.username || employee.email || 'Unknown User';
          const employeeId = employee.employeeId || `EMP${String(employee.id).padStart(5, '0')}`;
          
          return {
            id: employee.id || employee.userId,
            name: employeeName,
            employeeId: employeeId,
            email: employee.email || '',
            department: employee.department || ''
          };
        });
        
        setAllEmployees(employees);
      } else {
        setAllEmployees([]);
        showError("Load Error", "Failed to load employees. Please try again.");
      }
    } catch (error) {
      console.error("Failed to load employees:", error);
      setAllEmployees([]);
      showError("Load Error", "Failed to load employees. Please check your connection.");
    } finally {
      setEmployeesLoading(false);
    }
  };

  // Load all courses for dropdown using getAllCoursesForAdmin
  const loadAllCourses = async () => {
    setCoursesLoading(true);
    try {
      const res = await getAllCoursesForAdmin();
      if (res.ok && res.body && res.body.success) {
        // Filter to show only active courses and simplify data
        const courses = (res.body.data || []).filter(course => 
          course.status === 'ACTIVE' || !course.status
        ).map(course => ({
          id: course.id,
          title: course.title || 'Untitled Course'
        }));
        setAllCourses(courses);
      } else {
        setAllCourses([]);
        showError("Load Error", "Failed to load courses. Please try again.");
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
      setAllCourses([]);
      showError("Load Error", "Failed to load courses. Please check your connection.");
    } finally {
      setCoursesLoading(false);
    }
  };

  // Handle employee checkbox change
  const handleEmployeeCheckboxChange = (employeeId, isChecked) => {
    if (isChecked) {
      const employee = allEmployees.find(emp => emp.id === employeeId);
      if (employee && !formData.employees.find(emp => emp.id === employeeId)) {
        setFormData(prev => ({
          ...prev,
          employees: [...prev.employees, employee]
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        employees: prev.employees.filter(emp => emp.id !== employeeId)
      }));
    }
  };

  // Handle course checkbox change
  const handleCourseCheckboxChange = (courseId, isChecked) => {
    if (isChecked) {
      const course = allCourses.find(c => c.id === courseId);
      if (course && !formData.courseNames.includes(course.title)) {
        setFormData(prev => ({
          ...prev,
          courseNames: [...prev.courseNames, course.title],
          courseIds: [...(prev.courseIds || []), course.id]
        }));
      }
    } else {
      setFormData(prev => {
        const courseIndex = prev.courseNames.findIndex(name => 
          allCourses.find(c => c.id === courseId)?.title === name
        );
        const courseIds = [...(prev.courseIds || [])];
        if (courseIndex > -1) {
          courseIds.splice(courseIndex, 1);
        }
        return {
          ...prev,
          courseNames: prev.courseNames.filter((name, index) => 
            allCourses.find(c => c.id === courseId)?.title !== name
          ),
          courseIds: courseIds
        };
      });
    }
  };

  // Check if employee is selected
  const isEmployeeSelected = (employeeId) => {
    return formData.employees.some(emp => emp.id === employeeId);
  };

  // Check if course is selected
  const isCourseSelected = (courseId) => {
    const course = allCourses.find(c => c.id === courseId);
    return course ? formData.courseNames.includes(course.title) : false;
  };

  // Select all employees
  const selectAllEmployees = () => {
    const allSelected = allEmployees.every(emp => isEmployeeSelected(emp.id));
    if (allSelected) {
      // Deselect all
      setFormData(prev => ({
        ...prev,
        employees: []
      }));
    } else {
      // Select all
      setFormData(prev => ({
        ...prev,
        employees: [...allEmployees]
      }));
    }
  };

  // Select all courses
  const selectAllCourses = () => {
    const allSelected = allCourses.every(course => isCourseSelected(course.id));
    if (allSelected) {
      // Deselect all
      setFormData(prev => ({
        ...prev,
        courseNames: [],
        courseIds: []
      }));
    } else {
      // Select all
      setFormData(prev => ({
        ...prev,
        courseNames: allCourses.map(course => course.title),
        courseIds: allCourses.map(course => course.id)
      }));
    }
  };

  // Submit bulk assignment
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ VALIDATION FIRST
  if (!validateForm()) {
    // Show error using your existing showError function
    const errorMsg = [];
    if (!formData.employees.length) errorMsg.push('• Please select at least one employee');
    if (!formData.courseNames.length) errorMsg.push('• Please select at least one course');
    
    showError(
      "Validation Error",
      <div className="text-start">
        <p><strong>Please fix the following:</strong></p>
        <ul className="mb-0">
          {errorMsg.map((msg, i) => <li key={i}>{msg}</li>)}
        </ul>
      </div>
    );
    return;
  }
    
    if (formData.employees.length === 0) {
      showError("Selection Required", "Please select at least one employee.");
      return;
    }
    
    if (formData.courseNames.length === 0) {
      showError("Selection Required", "Please select at least one course.");
      return;
    }

    // ✅ DUE DATE VALIDATION - Now mandatory
  if (!formData.dueDate) {
    showError("Due Date Required", "Please select a due date for the assignments.");
    setTouched(prev => ({ ...prev, dueDate: true }));
    return;
  }

  setLoading(true);
  
  try {
    const assignmentData = {
      employees: formData.employees.map(emp => ({
        id: Number(emp.id),
        employeeId: emp.employeeId,
        name: emp.name,
        email: emp.email || '',
        department: emp.department || ''
      })),
      courseNames: formData.courseNames,
      dueDate: formData.dueDate,
      notes: formData.notes || '',
      assignedBy: Number(user.id)
    };

    const res = await createBulkAssignment(assignmentData);
    
    if (res.ok && res.body && res.body.success) {
      const result = res.body.data;
      
      showSuccess(
        "Bulk Assignment Completed!",
        <div className="text-start">
          <p><strong>Total Assignments:</strong> {result.totalRequestedAssignments}</p>
          <p><strong>Successful:</strong> {result.successfulAssignments}</p>
          <p><strong>Failed:</strong> {result.failedAssignments}</p>
          <p><strong>Due Date:</strong> {new Date(formData.dueDate).toLocaleDateString()}</p>
          <p><strong>Summary:</strong> {result.summary}</p>
          
          {result.errors && result.errors.length > 0 && (
            <div className="mt-3">
              <strong>Errors:</strong>
              <ul className="small mb-0">
                {result.errors.map((error, index) => (
                  <li key={index}>
                    {error.employeeName} - {error.courseName}: {error.errorMessage}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
        
        // Reset form
        setFormData({
          employees: [],
          courseNames: [],
          courseIds: [],
          dueDate: '',
          notes: '',
          assignedBy: user.id
        });
        
      } else {
        const errorMsg = res.body?.message || 'Unknown error occurred';
        showError("Assignment Failed", errorMsg);
      }
    } catch (error) {
      showError("Network Error", "Failed to assign courses. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmployeeDropdown && !event.target.closest('.employee-dropdown-container')) {
        setShowEmployeeDropdown(false);
      }
      <button
  type="button"
  className="btn btn-sm btn-outline-primary"
  onClick={() => {
    setShowEmployeeDropdown(false);
    if (formData.employees.length === 0) {
      setTouched(prev => ({ ...prev, employees: true }));
    }
  }}
>
  Close
</button>
      if (showCourseDropdown && !event.target.closest('.course-dropdown-container')) {
        setShowCourseDropdown(false);
      }
      <button
  type="button"
  className="btn btn-sm btn-outline-primary"
  onClick={() => {
    setShowCourseDropdown(false);
    if (formData.courseNames.length === 0) {
      setTouched(prev => ({ ...prev, courses: true }));
    }
  }}
>
  Close
</button>
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmployeeDropdown, showCourseDropdown]);

  return (
    <div className="row justify-content-center">
      <div className="col-md-10">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="card-title mb-0">👥 Bulk Assign Courses</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Employee Selection Section */}
              <div className="mb-4 employee-dropdown-container">
                <label className="form-label fw-bold">👥 Select Employees
                  <span class="text-danger">*</span>
            </label>

                <div className="form-text mb-2">
                  Click to select employees from the dropdown
                </div>
                
                 {/* Employee Dropdown with Checkboxes */}
  <div className={`dropdown ${validationErrors.employees && touched.employees ? 'has-error' : ''}`}>
    <button
      className={`btn btn-outline-secondary dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center ${
        validationErrors.employees && touched.employees ? 'border-danger' : ''
      }`}
      type="button"
      onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
    >
      <span>
        {formData.employees.length > 0 
          ? `${formData.employees.length} employee(s) selected` 
          : 'Select employees...'}
      </span>
      <span className="ms-auto">🔽</span>
    </button>
                  
                  {showEmployeeDropdown && (
                    <div 
                      className="dropdown-menu show w-100 p-3"
                      style={{ 
                        maxHeight: '300px', 
                        overflowY: 'auto',
                        zIndex: 1050
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                        <strong>Employees</strong>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={selectAllEmployees}
                        >
                          {allEmployees.every(emp => isEmployeeSelected(emp.id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      {employeesLoading ? (
                        <div className="text-center py-3">
                          <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                          Loading employees...
                        </div>
                      ) : allEmployees.length === 0 ? (
                        <div className="text-center text-muted py-3">
                          No employees found
                        </div>
                      ) : (
                        <div className="employees-list">
                          {allEmployees.map(employee => (
                            <div
                              key={employee.id}
                              className="dropdown-item p-2 border-bottom"
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                // Toggle checkbox when clicking anywhere on the item
                                const checkbox = e.currentTarget.querySelector('input[type="checkbox"]');
                                if (checkbox && !e.target.closest('button')) {
                                  checkbox.checked = !checkbox.checked;
                                  handleEmployeeCheckboxChange(employee.id, checkbox.checked);
                                }
                              }}
                            >
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`employee-${employee.id}`}
                                  checked={isEmployeeSelected(employee.id)}
                                  onChange={(e) => handleEmployeeCheckboxChange(employee.id, e.target.checked)}
                                />
                                <label className="form-check-label w-100" htmlFor={`employee-${employee.id}`}>
                                  <div className="fw-bold text-dark">{employee.name}</div>
                                  <small className="text-muted">ID: {employee.employeeId}</small>
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-center mt-3 pt-2 border-top">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setShowEmployeeDropdown(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                 {/* Validation Error Message */}
                 {touched.employees && validationErrors.employees && (
    <div className="text-danger mt-2 small">
      ⚠️ {validationErrors.employees}
    </div>
  )}

                {/* Show selected employees list */}
                {formData.employees.length > 0 && (
                  <div className="mt-3">
                    <label className="form-label fw-bold">Selected Employees ({formData.employees.length})</label>
                    <div className="border rounded p-3 bg-light">
                      {formData.employees.map(employee => (
                        <div key={employee.id} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded">
                          <div>
                            <strong className="text-primary">{employee.name}</strong>
                            <br />
                            <small className="text-muted">ID: {employee.employeeId}</small>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleEmployeeCheckboxChange(employee.id, false)}
                          >
                            ❌ Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Course Selection Section */}
              <div className="mb-4 course-dropdown-container">
                <label className="form-label fw-bold">📚 Select Courses
                  <span class="text-danger">*</span>
                </label>
                <div className="form-text mb-2">
                  Click to select courses from the dropdown
                </div>
                
                {/* Course Dropdown with Checkboxes */}
                <div className="dropdown">
                  <button
                    className="btn btn-outline-secondary dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center"
                    type="button"
                    onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                  >
                    <span>
                      {formData.courseNames.length > 0 
                        ? `${formData.courseNames.length} course(s) selected` 
                        : 'Select courses...'}
                    </span>
                    <span className="ms-auto">🔽</span>
                  </button>
                  
                  {showCourseDropdown && (
                    <div 
                      className="dropdown-menu show w-100 p-3"
                      style={{ 
                        maxHeight: '300px', 
                        overflowY: 'auto',
                        zIndex: 1050
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                        <strong>Courses</strong>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={selectAllCourses}
                        >
                          {allCourses.every(course => isCourseSelected(course.id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      {coursesLoading ? (
                        <div className="text-center py-3">
                          <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                          Loading courses...
                        </div>
                      ) : allCourses.length === 0 ? (
                        <div className="text-center text-muted py-3">
                          No courses found
                        </div>
                      ) : (
                        <div className="courses-list">
                          {allCourses.map(course => (
                            <div
                              key={course.id}
                              className="dropdown-item p-2 border-bottom"
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`course-${course.id}`}
                                  checked={isCourseSelected(course.id)}
                                  onChange={(e) => handleCourseCheckboxChange(course.id, e.target.checked)}
                                />
                                <label className="form-check-label w-100" htmlFor={`course-${course.id}`}>
                                  <strong>{course.title}</strong>
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-center mt-3 pt-2 border-top">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setShowCourseDropdown(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

{/* Assignment Details - DUE DATE IS NOW MANDATORY */}
<div className="row mb-4">
  <div className="col-md-6">
    <label className="form-label">
      Due Date <span className="text-danger">*</span>
    </label>
    <input
      type="date"
      className={`form-control ${!formData.dueDate && touched.dueDate ? 'is-invalid' : ''}`}
      value={formData.dueDate}
      onChange={(e) => {
        setFormData(prev => ({ ...prev, dueDate: e.target.value }));
        setTouched(prev => ({ ...prev, dueDate: true }));
      }}
      onBlur={() => setTouched(prev => ({ ...prev, dueDate: true }))}
      min={new Date().toISOString().split('T')[0]}
      required
    />
    {!formData.dueDate && touched.dueDate && (
      <div className="invalid-feedback d-block">
        ⚠️ Due date is required for course assignments
      </div>
    )}
    <small className="form-text text-muted">
      ⚠️ Due date is required for course assignments
    </small>
  </div>
</div>

              <div className="mb-4">
                <label className="form-label">Assignment Notes (Optional)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any special instructions or notes for these assignments..."
                ></textarea>
              </div>

              {/* Assignment Summary */}
              {formData.employees.length > 0 && formData.courseNames.length > 0 && (
                <div className="alert alert-info">
                  <strong>Assignment Summary:</strong><br />
                  <span className="text-success">
                    ✅ {formData.employees.length} employee(s) × {formData.courseNames.length} course(s) = {formData.employees.length * formData.courseNames.length} total assignments
                  </span>
                  {formData.dueDate && (
                    <div className="mt-2">
                      <strong>Due Date:</strong> {new Date(formData.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              <div className="d-grid">
  <button 
    type="submit" 
    className={`btn btn-primary btn-lg ${
      (!formData.employees.length || !formData.courseNames.length || !formData.dueDate) ? 'disabled' : ''
    }`}
    disabled={loading || formData.employees.length === 0 || formData.courseNames.length === 0 || !formData.dueDate}
    onClick={(e) => {
      // Trigger validation on blur when trying to submit
      if (!formData.employees.length) setTouched(prev => ({ ...prev, employees: true }));
      if (!formData.courseNames.length) setTouched(prev => ({ ...prev, courses: true }));
      if (!formData.dueDate) setTouched(prev => ({ ...prev, dueDate: true }));
    }}
  >
    {loading ? (
      <>
        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
        Creating {formData.employees.length * formData.courseNames.length} Assignments...
      </>
    ) : (
      `🚀 Assign ${formData.employees.length * formData.courseNames.length} Courses`
    )}
  </button>
</div>
              
            </form>
            

            {/* Help Section */}
            <div className="mt-4 p-3 bg-light rounded">
              <h6>💡 Bulk Assignment Tips:</h6>
              <ul className="small mb-0">
                <li>Click the dropdown buttons to select employees and courses</li>
                <li>Use checkboxes to select multiple items</li>
                <li>Use "Select All" to quickly select all items</li>
                <li>The dropdown shows how many items are selected</li>
                <li>Assignment summary shows the total number of assignments</li>
                <li><strong>Due date is now required</strong> for all assignments</li>
                <li>Set realistic due dates for completion deadlines</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  );
}