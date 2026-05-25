//src/components/searchMaterials.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  getMaterials,
  uploadMaterial,
  updateMaterial,
  deleteMaterial,
  loadUserFromStorage,
  downloadMaterial,
  hasUploadPermission,
  canEditMaterials,
  canDeleteMaterials,
  getAllCourses,
  searchMaterials
  // uploadMaterials
} 
from "../services/api";
import MessagePopup from "./MessagePopup";
import "bootstrap/dist/css/bootstrap.min.css";
import "./StudyMaterials.css";

// 🆕 ADDED: PopupModal Component
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
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
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

export default function StudyMaterials() {
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // for search button modification
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tempCategory, setTempCategory] = useState("ALL");
  const [tempType, setTempType] = useState("ALL");

  

  // 🆕 ADDED: Popup State
  const [popup, setPopup] = useState({
    show: false,
    type: "INFO",
    title: "",
    message: "",
    onConfirm: null
  });

  // 🆕 ADDED: Loading State for Actions
  const [actionLoading, setActionLoading] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);

  // form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [type, setType] = useState("DOCUMENT");
  const [file, setFile] = useState(null);
  const [courseId, setCourseId] = useState("");

  // filters/search
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [filterType, setFilterType] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");

  const user = loadUserFromStorage();
  const iframeRef = useRef(null);
  const videoRef = useRef(null);

  const getFileName = (fileUrl) => {
  if (!fileUrl) return "";

  const fullName = fileUrl.split("/").pop();

  return fullName.substring(fullName.indexOf("_") + 1);
};

  // 🆕 ADDED: Popup Helper Functions
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

  const showMessage = (text, type = "info") => {
    setMessage({ text, type });
  };

  const closeMessage = () => {
    setMessage({ text: "", type: "" });
  };

  // ==================== ENHANCED TYPE CHECKING FUNCTIONS ====================
  const getMaterialType = (material) => {
    const storedType = String(material?.type || "").toUpperCase().trim();
    if (["VIDEO", "PDF", "DOCUMENT", "LINK"].includes(storedType)) {
      return storedType;
    }
    
    const fileUrl = material?.fileUrl || "";
    if (fileUrl.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i)) return "VIDEO";
    if (fileUrl.match(/\.(pdf)$/i)) return "PDF";
    if (fileUrl.match(/\.(doc|docx|txt|rtf)$/i)) return "DOCUMENT";
    if (fileUrl.match(/\.(jpg|jpeg|png|gif|bmp)$/i)) return "DOCUMENT";
    
    return "DOCUMENT";
  };

  const getActionLabel = (material) => {
    const type = getMaterialType(material);
    return {
      VIDEO: "🎬 Watch",
      PDF: "📖 Read", 
      DOCUMENT: "📖 Read",
      LINK: "🔗 Open"
    }[type] || "📂 Open";
  };

  const getButtonClass = (material) => {
    const type = getMaterialType(material);
    return {
      VIDEO: "btn-danger",
      PDF: "btn-primary",
      DOCUMENT: "btn-primary", 
      LINK: "btn-success"
    }[type] || "btn-secondary";
  };

  const getTypeIcon = (material) => {
    const type = getMaterialType(material);
    return {
      VIDEO: "🎬",
      DOCUMENT: "📄",
      PDF: "📑",
      LINK: "🔗"
    }[type] || "📁";
  };

  const getTypeBadgeClass = (material) => {
    const type = getMaterialType(material).toLowerCase();
    return `type-badge ${type}`;
  };

  // ==================== FILE HANDLING FUNCTIONS ====================
  const getFullFileUrl = (fileUrl, materialId) => {
    if (!fileUrl) return null;
    
    if (fileUrl.startsWith('http') || fileUrl.startsWith('blob:')) {
      return fileUrl;
    }
    
    const MATERIAL_BASE = process.env.REACT_APP_MATERIAL_SERVICE || 'http://localhost:8082';
    
    if (materialId) {
      return `${MATERIAL_BASE}/api/materials/download/${materialId}`;
    }
    
    return `${MATERIAL_BASE}/api/materials/files/${fileUrl}`;
  };

  const handleVideoClick = async (material) => {
    console.log("🎬 Video clicked:", material);
    setVideoError(null);
    
    try {
      setSelectedVideo({
        ...material,
        fullFileUrl: null,
        loading: true
      });

      const directUrl = getFullFileUrl(material.fileUrl, material.id);
      console.log("Direct video URL:", directUrl);
      
      const testDirectPlayback = await testVideoUrl(directUrl);
      
      if (testDirectPlayback) {
        console.log("✅ Direct URL playback available");
        setSelectedVideo({
          ...material,
          fullFileUrl: directUrl,
          loading: false,
          useDirectUrl: true
        });
      } else {
        console.log("🔄 Direct URL failed, trying blob download...");
        const blob = await downloadMaterial(material.id);
        const blobUrl = URL.createObjectURL(blob);
        
        setVideoBlobUrl(blobUrl);
        setSelectedVideo({
          ...material,
          fullFileUrl: blobUrl,
          loading: false,
          useDirectUrl: false
        });
      }
      
    } catch (error) {
      console.error("Video handling error:", error);
      setVideoError(`Failed to load video: ${error.message}`);
      setSelectedVideo({
        ...material,
        fullFileUrl: getFullFileUrl(material.fileUrl, material.id),
        loading: false,
        useDirectUrl: true
      });
    }
  };

  const testVideoUrl = (url) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        console.log("✅ Video metadata loaded successfully");
        resolve(true);
      };
      
      video.onerror = () => {
        console.log("❌ Video URL test failed");
        resolve(false);
      };
      
      setTimeout(() => {
        resolve(false);
      }, 5000);
    });
  };

  const handleVideoError = (error) => {
    console.error("Video playback error:", error);
    const errorMessage = `
      Video playback failed. Possible reasons:
      - Video format not supported
      - File corrupted
      - Network issue
      - Server not responding
      
      Please try downloading the video instead.
    `;
    setVideoError(errorMessage);
  };

  const handleDocumentClick = async (material) => {
    console.log("📖 Document clicked:", material);
    const materialType = getMaterialType(material);
    const fileUrl = getFullFileUrl(material.fileUrl, material.id);
    
    console.log("Document URL:", fileUrl);
    console.log("Document Type:", materialType);
    
    if (materialType === "PDF") {
      try {
        console.log("Attempting to download PDF for viewing...");
        const blob = await downloadMaterial(material.id);
        const blobUrl = URL.createObjectURL(blob);
        
        setSelectedDocument({
          ...material,
          viewUrl: blobUrl,
          type: materialType,
          blobUrl: blobUrl
        });
        
      } catch (error) {
        console.error("PDF download failed, trying direct URL:", error);
        setSelectedDocument({
          ...material,
          viewUrl: fileUrl,
          type: materialType,
          blobUrl: null
        });
      }
    } else {
      setSelectedDocument({
        ...material,
        viewUrl: fileUrl,
        type: materialType,
        blobUrl: null
      });
    }
  };

  const handleDownload = async (material) => {
    try {
      setActionLoading(material.id);
      const blob = await downloadMaterial(material.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = material.title || `material-${material.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSuccess("Download Successful", "✅ Your download has started!");
    } catch (error) {
      console.error("Download failed:", error);
      showError("Download Failed", "❌ Failed to download the file. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenInNewTab = (material) => {
    const fileUrl = getFullFileUrl(material.fileUrl, material.id);
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      const elem = document.querySelector('.document-viewer-fullscreen');
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullScreen(false);
    }
  };

  // Clean up blob URLs
  useEffect(() => {
    return () => {
      if (videoBlobUrl) {
        URL.revokeObjectURL(videoBlobUrl);
      }
    };
  }, [videoBlobUrl]);

  useEffect(() => {
    return () => {
      if (selectedDocument?.blobUrl) {
        URL.revokeObjectURL(selectedDocument.blobUrl);
      }
    };
  }, [selectedDocument]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('msfullscreenchange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('msfullscreenchange', handleFullScreenChange);
    };
  }, []);

  useEffect(() => {
    fetchMaterials();
    fetchCourses();
  }, []);

  async function fetchMaterials() {
    setLoading(true);
    try {
      const res = await getMaterials();
      const list = res.ok && res.body ? res.body.data || res.body : [];
      setMaterials(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("fetchMaterials error", err);
      setMaterials([]);
      showError("Load Failed", "❌ Failed to load materials: " + err.message);
    }
    setLoading(false);
  }

//   async function fetchCourses() {
//   try {
//     const res = await getAllCourses();
//       if (res.ok && res.body) {
//         setCourses(Array.isArray(res.body) ? res.body : []);
//       }
//   } catch (err) {
//     console.error("Failed to fetch courses", err);
//     setCourses([]);
//   }
// }
async function fetchCourses() {
  try {
    const res = await getAllCourses();
    console.log("Courses response:", res);
    if (res.ok && res.body && res.body.success) {
      setCourses(res.body.data || []);
    } else if (res.ok && res.body && Array.isArray(res.body.data)) {
      setCourses(res.body.data);
    } else if (res.ok && res.body && Array.isArray(res.body)) {
      setCourses(res.body);
    } else {
      setCourses([]);
    }
  } catch (err) {
    console.error("Failed to fetch courses", err);
    setCourses([]);
  }
}


  function resetForm() {
    setTitle("");
    setDescription("");
    setTags("");
    setType("DOCUMENT");
    setFile(null);
    setCourseId("");
    setEditingMaterial(null);
  }

  function startEdit(material) {
    setEditingMaterial(material);
    setTitle(material.title || "");
    setDescription(material.description || "");
    setTags(material.tags || "");
    setType(material.type || "DOCUMENT");
    setCourseId(material.courseId || "");
    setFile(null);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user?.id) {
      showError("Authentication Required", "❌ You must be logged in to perform this action.");
      return;
    }

    try {
      setActionLoading('submit');
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("tags", tags);
      formData.append("type", type);
      formData.append("uploadedBy", user.id);
      if (courseId) formData.append("courseId", courseId);
      if (file) formData.append("file", file);

      let res;
      
      if (editingMaterial) {
        console.log("🔄 Updating material with ID:", editingMaterial.id);
        res = await updateMaterial(editingMaterial.id, formData);
        
        if (res.ok && res.success) {
          showSuccess("Material Updated", "✅ Material updated successfully!");
          await fetchMaterials();
          resetForm();
          setShowForm(false);
        } else {
          showError("Update Failed", "❌ Update failed: " + (res.message || 'Unknown error'));
        }
      } else {
        if (!file) {
          showError("File Required", "❌ Please select a file to upload.");
          return;
        }

        console.log("🔄 Uploading new material...");
        res = await uploadMaterial(formData);

        if (res.ok && res.success) {
          showSuccess("Upload Successful", "✅ Material uploaded successfully!");
          await fetchMaterials();
          resetForm();
          setShowForm(false);
        } else {
          showError("Upload Failed", "❌ Upload failed: " + (res.message || 'Unknown error'));
        }
      }
    } catch (err) {
      console.error("Submit error", err);
      showError("Operation Failed", "❌ Operation failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id) {
    showConfirm(
      "Confirm Deletion",
      "Are you sure you want to delete this material? This action cannot be undone.",
      async () => {
        try {
          setActionLoading(id);
          const res = await deleteMaterial(id);
          if (res.ok) {
            showSuccess("Material Deleted", "✅ Material deleted successfully!");
            await fetchMaterials();
          } else {
            showError("Delete Failed", "❌ Delete failed: " + (res.body?.message || res.status));
          }
        } catch (err) {
          console.error("delete error", err);
          showError("Delete Failed", "❌ Delete failed: " + err.message);
        } finally {
          setActionLoading(null);
        }
      }
    );
  }

  // filters
  // const filtered = materials.filter((m) => {
  //   const matchSearch =
  //     !search ||
  //     (m.title && m.title.toLowerCase().includes(search.toLowerCase())) ||
  //     (m.tags && m.tags.toLowerCase().includes(search.toLowerCase()));
  //   const matchType =
  //     filterType === "ALL" || getMaterialType(m) === filterType;
  //   const matchCategory =
  //     filterCategory === "ALL" ||
  //     (m.category || "") === filterCategory;
  //   return matchSearch && matchType && matchCategory;
  // });

  //filters
  const filtered = materials.filter((m) => {
  const matchSearch =
    !search ||
    (m.title && m.title.toLowerCase().includes(search.toLowerCase())) ||
    (m.tags && m.tags.toLowerCase().includes(search.toLowerCase()));
  const matchType =
    filterType === "ALL" || getMaterialType(m) === filterType;
  const matchCategory =
    filterCategory === "ALL" ||
      (m.tags &&
        m.tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .includes(filterCategory.toLowerCase()));
  return matchSearch && matchType && matchCategory;
});

const sortedMaterials = [...filtered].sort((a, b) => {

  if (sortBy === "name-asc") {
    return a.title.localeCompare(b.title);
  }

  if (sortBy === "name-desc") {
    return b.title.localeCompare(a.title);
  }

  if (sortBy === "newest") {
    return new Date(b.createdAt) - new Date(a.createdAt);
  }

  if (sortBy === "oldest") {
    return new Date(a.createdAt) - new Date(b.createdAt);
  }

  return 0;
});

  return (
    <div className="container-fluid page-padding">
      {/* 🆕 ADDED: Popup Modal */}
      <PopupModal 
        show={popup.show}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={hidePopup}
        onConfirm={popup.onConfirm}
      />

      {/* Message Popup */}
      <MessagePopup 
        message={message.text} 
        type={message.type} 
        onClose={closeMessage} 
      />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Study Materials</h2>
          <small className="text-muted">
            Access resources and track your progress!
          </small>
        </div>
        
        {/* 🆕 UPDATED: Add Material Button - Right side, smaller size */}
        {hasUploadPermission(user) && (
          <div className="ms-auto">
            <button
              className="btn btn-dark btn-add-small shadow-sm"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              title="Add New Material"
              disabled={actionLoading}
            >
              {actionLoading === 'submit' ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Loading...
                </>
              ) : (
                <>
                  <span className="btn-add-icon">+</span>
                  <span className="btn-add-text">Add Material</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter
      <div className="card mb-4">
        <div className="card-body d-flex flex-column">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">🔍</span>
                <input
                  className="form-control"
                  placeholder="Search materials or tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Fullstack">Fullstack Development</option>
                <option value="DevOps">DevOps</option>
                <option value="Data Science">Data Science</option>
                <option value="Mobile">Mobile Development</option>
                <option value="Cloud">Cloud Computing</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Soft Skills">Soft Skills</option>
                <option value="Management">Management</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Blockchain">Blockchain</option>
                <option value="Testing">Software Testing</option>
                <option value="UI/UX">UI/UX Design</option>
                <option value="Game Dev">Game Development</option>
                <option value="Networking">Networking</option>
                <option value="IoT">Internet of Things</option>
                
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="DOCUMENT">Document</option>
                <option value="VIDEO">Video</option>
                <option value="PDF">PDF</option>
                <option value="LINK">Link</option>
              </select>
            </div>
          </div>
        </div>
      </div> */}

      {/* Search & Filter */}
    <div className="d-flex justify-content-between align-items-center mb-4">

    <div className="d-flex align-items-center gap-2">

      {/* Search Icon */}
      <button
        className="btn btn-outline-secondary"
        onClick={() => setShowSearch(!showSearch)}
      >
        🔍
      </button>

      {/* Search Input */}
      {showSearch && (
        <input
          type="text"
          className="form-control"
          placeholder="Search materials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "220px" }}
        />
      )}

      {/* Filter Toggle */}
      <button
        className="btn btn-outline-primary"
        onClick={() => setShowFilters(!showFilters)}
      >
        Filters
      </button>

      <select
        className="form-select"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        style={{ width: "160px" }}
      >
        <option value="name-asc">A → Z</option>
        <option value="name-desc">Z → A</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>

    </div>
  </div>

  {/* Filters Section */}
  {showFilters && (
    <div className="card mb-4">
      <div className="card-body">

        <div className="row g-3 align-items-end">

          {/* Category */}
          <div className="col-md-4">
            <label className="form-label">Category</label>

            <select
              className="form-select"
              value={tempCategory}
              onChange={(e) => setTempCategory(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="Fullstack">Fullstack Development</option>
              <option value="DevOps">DevOps</option>
              <option value="Data Science">Data Science</option>
              <option value="Mobile">Mobile Development</option>
              <option value="Cloud">Cloud Computing</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Soft Skills">Soft Skills</option>
              <option value="Management">Management</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Blockchain">Blockchain</option>
              <option value="Testing">Software Testing</option>
              <option value="UI/UX">UI/UX Design</option>
              <option value="Game Dev">Game Development</option>
              <option value="Networking">Networking</option>
              <option value="IoT">Internet of Things</option>
            </select>
          </div>

          {/* Type */}
          <div className="col-md-4">
            <label className="form-label">Type</label>

            <select
              className="form-select"
              value={tempType}
              onChange={(e) => setTempType(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="DOCUMENT">Document</option>
              <option value="VIDEO">Video</option>
              <option value="PDF">PDF</option>
              <option value="LINK">Link</option>
            </select>
          </div>

          {/* Apply Button */}
          <div className="col-md-4 d-flex gap-2">

            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setFilterCategory(tempCategory);
                setFilterType(tempType);
              }}
            >
              Apply Filter
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setTempCategory("ALL");
                setTempType("ALL");

                setFilterCategory("ALL");
                setFilterType("ALL");
              }}
            >
              Reset
            </button>

          </div>

        </div>

      </div>
    </div>
  )}

        {/* 🆕 UPDATED: Upload/Edit Form Modal */}
        {showForm && (
        <div className="form-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="form-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="form-modal-header">
              <h5 className="mb-0">
                {editingMaterial ? "✏️ Edit Material" : "📂 Upload New Material"}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowForm(false)}
                aria-label="Close"
                disabled={actionLoading}
              ></button>
            </div>
            <div className="form-modal-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Title *</label>
                    <input
                      className="form-control"
                      placeholder="Enter material title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      disabled={actionLoading === 'submit'}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Type</label>
                    <select
                      className="form-select"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      disabled={actionLoading === 'submit'}
                    >
                      <option value="DOCUMENT">Document</option>
                      <option value="VIDEO">Video</option>
                      <option value="PDF">PDF</option>
                      <option value="LINK">Link</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Course (Optional)</label>
                    <select
                      className="form-select"
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      disabled={actionLoading === 'submit'}
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <input
                      className="form-control"
                      placeholder="Enter description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={actionLoading === 'submit'}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Tags</label>
                    <input
                      className="form-control"
                      placeholder="Enter tags (comma separated)"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      disabled={actionLoading === 'submit'}
                    />
                    <small className="text-muted">Separate tags with commas</small>
                  </div>
                  <div className="col-12">
                    <label className="form-label">
                      {editingMaterial ? "File (Leave empty to keep current)" : "File *"}
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => setFile(e.target.files[0])}
                      required={!editingMaterial}
                      disabled={actionLoading === 'submit'}
                    />
                    {editingMaterial && editingMaterial.fileUrl && !file && (
                      <small className="text-success d-block mt-2">
                        Current File: {getFileName(editingMaterial.fileUrl)}
                      </small>
                    )}
                    <small className="text-muted">
                      {editingMaterial ? 
                        "Leave empty to keep current file. For videos: MP4, WebM, or OGG formats recommended." : 
                        "For videos: MP4, WebM, or OGG formats recommended."
                      }
                    </small>
                  </div>
                  <div className="col-12 d-flex gap-2 pt-2 justify-content-end">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={actionLoading === 'submit'}
                    >
                      {actionLoading === 'submit' ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          {editingMaterial ? "Updating..." : "Uploading..."}
                        </>
                      ) : (
                        editingMaterial ? "Update Material" : "Upload Material"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        resetForm();
                        setShowForm(false);
                      }}
                      disabled={actionLoading === 'submit'}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Materials Display */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading materials...</p>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <small className="text-muted">
              Showing {filtered.length} of {materials.length} materials
            </small>
          </div>

          {/* Grid View - 3×3 Layout */}
          <div className="grid-3x3-container">
            {filtered.length === 0 ? (
              <div className="col-12">
                <div className="card text-center py-5">
                  <div className="card-body">
                    <div className="text-muted mb-3" style={{ fontSize: "3rem" }}>
                      📚
                    </div>
                    <h5>No materials found</h5>
                    <p className="text-muted">
                      {materials.length === 0
                        ? "Get started by uploading your first study material!"
                        : "Try adjusting your search or filters"}
                    </p>
                    {materials.length === 0 && hasUploadPermission(user) && (
                      <button
                        className="btn btn-primary mt-2"
                        onClick={() => setShowForm(true)}
                        disabled={actionLoading}
                      >
                        Upload First Material
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid-3x3-layout">
                {sortedMaterials.map((m) => (
                  <div className="grid-3x3-item" key={m.id} style={{ minHeight: "240px" }}>
                    <div className="card study-card h-100 shadow-sm">
                      <div className="card-body d-flex flex-column" style={{ padding: "1rem" }}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <span className="type-icon" style={{ fontSize: "1.5rem" }}>
                              {getTypeIcon(m)}
                            </span>
                            <h6 className="mb-0 fw-bold text-truncate">{m.title}</h6>
                          </div>
                          <span className={getTypeBadgeClass(m)}>
                            {getMaterialType(m).toLowerCase()}
                          </span>
                        </div>

                        <p className="text-muted mb-2"
                            style={{
                              fontSize: "0.85rem",
                              lineHeight: 1.4
                            }}>
                          {m.description || "No description provided"}
                        </p>

                        <div className="mb-2">
                          {m.tags &&
                            m.tags.split(",").map((t, i) => (
                              <span key={i} className="badge tag-badge me-1">
                                #{t.trim()}
                              </span>
                            ))}
                        </div>

                        <div className="mt-auto"><div className="d-flex gap-2 flex-wrap mt-2">
                          
                            {getMaterialType(m) === "VIDEO" ? (
                              <button
                                className={`btn btn-sm action-btn ${getButtonClass(m)}`}
                                onClick={() => handleVideoClick(m)}
                                disabled={actionLoading}
                              >
                                {getActionLabel(m)}
                              </button>
                            ) : (
                              <button
                                className={`btn btn-sm action-btn ${getButtonClass(m)}`}
                                onClick={() => handleDocumentClick(m)}
                                disabled={actionLoading}
                              >
                                {getActionLabel(m)}
                              </button>
                            )}
                            
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleDownload(m)}
                              title="Download this file"
                              disabled={actionLoading === m.id}
                            >
                              {actionLoading === m.id ? (
                                <span className="spinner-border spinner-border-sm" />
                              ) : (
                                "📥 Download"
                              )}
                            </button>

                            {/* ONLY show edit/delete to authorized users */}
                            {canEditMaterials(user) && (
                              <button
                                className="btn btn-sm btn-outline-warning flex-fill"
                                onClick={() => startEdit(m)}
                                title="Edit this material"
                                disabled={actionLoading}
                              >
                                ✏️ Edit
                              </button>
                            )}
                            
                            {canDeleteMaterials(user) && (
                              <button
                                className="btn btn-sm btn-outline-danger flex-fill"
                                onClick={() => handleDelete(m.id)}
                                disabled={actionLoading === m.id}
                              >
                                {actionLoading === m.id ? (
                                  <span className="spinner-border spinner-border-sm" />
                                ) : (
                                  "🗑️ Delete"
                                )}
                              </button>
                            )}
                          </div>
                          <div className="small text-muted mt-2 text-end">
                            {m.createdAt
                              ? new Date(m.createdAt).toLocaleDateString()
                              : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="video-modal-overlay"
          onClick={() => {
            setSelectedVideo(null);
            setVideoError(null);
            if (videoBlobUrl) {
              URL.revokeObjectURL(videoBlobUrl);
              setVideoBlobUrl(null);
            }
          }}
        >
          <div 
            className="video-modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90%', maxHeight: '90%' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="text-white mb-0">
                🎬 {selectedVideo.title || "Video Player"}
                {selectedVideo.useDirectUrl && (
                  <small className="text-warning ms-2">(Streaming)</small>
                )}
              </h5>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  setSelectedVideo(null);
                  setVideoError(null);
                  if (videoBlobUrl) {
                    URL.revokeObjectURL(videoBlobUrl);
                    setVideoBlobUrl(null);
                  }
                }}
                disabled={actionLoading}
              >
                ✕ Close
              </button>
            </div>

            {selectedVideo.loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-light" role="status">
                  <span className="visually-hidden">Loading video...</span>
                </div>
                <p className="text-light mt-2">Loading video...</p>
              </div>
            ) : videoError ? (
              <div className="alert alert-danger m-3">
                <h6>🎬 Video Playback Error</h6>
                <p className="mb-3">{videoError}</p>
                <div className="mt-2 d-flex gap-2 flex-wrap">
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={() => handleDownload(selectedVideo)}
                    disabled={actionLoading === selectedVideo.id}
                  >
                    {actionLoading === selectedVideo.id ? (
                      <span className="spinner-border spinner-border-sm me-2" />
                    ) : (
                      "📥 Download Video Instead"
                    )}
                  </button>
                  <button
                    className="btn btn-outline-warning btn-sm"
                    onClick={() => {
                      const directUrl = getFullFileUrl(selectedVideo.fileUrl, selectedVideo.id);
                      window.open(directUrl, '_blank');
                    }}
                    disabled={actionLoading}
                  >
                    🔗 Open Direct Link
                  </button>
                </div>
              </div>
            ) : (
              <div className="video-container">
                <video 
                  ref={videoRef}
                  width="100%"
                  height="auto"
                  controls 
                  autoPlay 
                  style={{ 
                    maxWidth: "100%", 
                    maxHeight: "70vh",
                    borderRadius: "8px",
                    backgroundColor: '#000'
                  }}
                  onError={(e) => {
                    console.error("Video element error:", e);
                    handleVideoError(e);
                  }}
                  onCanPlay={() => console.log("✅ Video can play!")}
                  onLoadStart={() => console.log("🔄 Video loading started")}
                  onWaiting={() => console.log("⏳ Video buffering...")}
                  onPlaying={() => console.log("▶️ Video playing!")}
                >
                  <source src={selectedVideo.fullFileUrl} type="video/mp4" />
                  <source src={selectedVideo.fullFileUrl} type="video/webm" />
                  <source src={selectedVideo.fullFileUrl} type="video/ogg" />
                  Your browser does not support the video tag.
                  <track kind="captions" />
                </video>
                
                <div className="video-status mt-2 text-center">
                  <small className="text-light">
                    {selectedVideo.useDirectUrl ? 
                      "Streaming from server" : 
                      "Playing from local file"
                    }
                  </small>
                </div>
              </div>
            )}

            <div className="text-center mt-3">
              <div className="btn-group-grid mt-auto">
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={() => handleDownload(selectedVideo)}
                  disabled={actionLoading === selectedVideo.id}
                >
                  {actionLoading === selectedVideo.id ? (
                    <span className="spinner-border spinner-border-sm me-2" />
                  ) : (
                    "📥 Download"
                  )}
                </button>
                <button
                  className="btn btn-outline-warning btn-sm"
                  onClick={() => {
                    const directUrl = getFullFileUrl(selectedVideo.fileUrl, selectedVideo.id);
                    window.open(directUrl, '_blank');
                  }}
                  disabled={actionLoading}
                >
                  🔗 Open in New Tab
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSelectedVideo(null);
                    setVideoError(null);
                    if (videoBlobUrl) {
                      URL.revokeObjectURL(videoBlobUrl);
                      setVideoBlobUrl(null);
                    }
                  }}
                  disabled={actionLoading}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <div
          className="video-modal-overlay"
          onClick={() => {
            if (selectedDocument?.blobUrl) {
              URL.revokeObjectURL(selectedDocument.blobUrl);
            }
            setSelectedDocument(null);
            setIsFullScreen(false);
          }}
        >
          <div 
            className={`video-modal-content ${isFullScreen ? 'fullscreen-mode' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: isFullScreen ? '100%' : '90%', maxHeight: isFullScreen ? '100%' : '95%' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="text-white mb-0">
                📖 {selectedDocument.title || "Document Viewer"}
                {isFullScreen && <span className="badge bg-warning ms-2">Full Screen</span>}
              </h5>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-warning btn-sm"
                  onClick={toggleFullScreen}
                  title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                  disabled={actionLoading}
                >
                  {isFullScreen ? "📱 Exit Full" : "🖥️ Full Screen"}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (selectedDocument?.blobUrl) {
                      URL.revokeObjectURL(selectedDocument.blobUrl);
                    }
                    setSelectedDocument(null);
                    setIsFullScreen(false);
                  }}
                  disabled={actionLoading}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div 
              className={`document-viewer-container bg-white rounded p-3 document-viewer-fullscreen`}
              style={{ 
                height: isFullScreen ? 'calc(100vh - 120px)' : '80vh', 
                width: "100%" 
              }}
            >
              {selectedDocument.type === "PDF" ? (
                <iframe
                  ref={iframeRef}
                  src={selectedDocument.viewUrl}
                  width="100%"
                  height="100%"
                  style={{ 
                    border: "none", 
                    borderRadius: "8px",
                    backgroundColor: 'white'
                  }}
                  title={`PDF Viewer - ${selectedDocument.title}`}
                  allowFullScreen
                >
                  <div className="text-center py-5">
                    <p>Your browser doesn't support PDF viewing.</p>
                    <a 
                      href={selectedDocument.viewUrl} 
                      download 
                      className="btn btn-primary"
                    >
                      📥 Download PDF Instead
                    </a>
                  </div>
                </iframe>
              ) : (
                <div className="text-center py-5 h-100 d-flex flex-column justify-content-center">
                  <div className="text-muted mb-3" style={{ fontSize: "3rem" }}>
                    📄
                  </div>
                  <h5>Document Preview Not Available</h5>
                  <p className="text-muted mb-4">
                    For best experience, please download this {selectedDocument.type.toLowerCase()} document.
                  </p>
                  <div className="d-flex justify-content-center gap-3 flex-wrap">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenInNewTab(selectedDocument)}
                      disabled={actionLoading}
                    >
                      🔗 Open in New Tab
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={() => handleDownload(selectedDocument)}
                      disabled={actionLoading === selectedDocument.id}
                    >
                      {actionLoading === selectedDocument.id ? (
                        <span className="spinner-border spinner-border-sm me-2" />
                      ) : (
                        "📥 Download"
                      )}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        if (selectedDocument?.blobUrl) {
                          URL.revokeObjectURL(selectedDocument.blobUrl);
                        }
                        setSelectedDocument(null);
                        setIsFullScreen(false);
                      }}
                      disabled={actionLoading}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center mt-3">
              <div className="btn-group">
                <button
                  className="btn btn-outline-light"
                  onClick={() => handleOpenInNewTab(selectedDocument)}
                  disabled={actionLoading}
                >
                  🔗 Open in New Tab
                </button>
                <button
                  className="btn btn-outline-light"
                  onClick={() => handleDownload(selectedDocument)}
                  disabled={actionLoading === selectedDocument.id}
                >
                  {actionLoading === selectedDocument.id ? (
                    <span className="spinner-border spinner-border-sm me-2" />
                  ) : (
                    "📥 Download"
                  )}
                </button>
                <button
                  className="btn btn-warning"
                  onClick={toggleFullScreen}
                  disabled={actionLoading}
                >
                  {isFullScreen ? "📱 Exit Full" : "🖥️ Full Screen"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    if (selectedDocument?.blobUrl) {
                      URL.revokeObjectURL(selectedDocument.blobUrl);
                    }
                    setSelectedDocument(null);
                    setIsFullScreen(false);
                  }}
                  disabled={actionLoading}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}