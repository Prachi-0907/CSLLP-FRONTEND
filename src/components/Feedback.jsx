import React, { useState, useEffect } from 'react';
import { 
  submitFeedback, 
  getMyFeedbacks, 
  getAllFeedbacks, 
  getTeamFeedbackSummary, 
  getFeedbacksForTarget, 
  flagFeedback, 
  getAverageRating,
  getReceivedFeedbacks,
  getGivenFeedbacks,
  getUsers,
  getCourses,
  getExamsForFeedback,
  getAdminStats
} from '../services/api';
import './feedback.css';

export default function Feedback({ user }) {
  const [activeTab, setActiveTab] = useState('admin-stats');
  const [feedbacks, setFeedbacks] = useState([]);
  const [teamSummary, setTeamSummary] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [targetType, setTargetType] = useState('COURSE');
  const [targetId, setTargetId] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [dropdownDataLoaded, setDropdownDataLoaded] = useState(false);

  const isAdmin = user.role === 'ADMIN';
  const isManager = user.role === 'MANAGER';
  const isEmployee = user.role === 'EMPLOYEE';

  useEffect(() => {
    loadData();
    if (activeTab !== 'admin-stats') {
      loadDropdownData();
    }
  }, [activeTab, user.id, targetType, targetId]);

  const loadDropdownData = async () => {
    try {
      console.log('Loading dropdown data...');
      
      if (isAdmin || isManager) {
        const usersResponse = await getUsers();
        if (usersResponse.ok) {
          console.log('Users loaded:', usersResponse.data?.length);
          setUsers(usersResponse.data || []);
        } else {
          console.error('Failed to load users:', usersResponse.message);
        }
      }

      const coursesResponse = await getCourses();
      if (coursesResponse.ok) {
        console.log('Courses loaded:', coursesResponse.data?.length);
        setCourses(coursesResponse.data || []);
      } else {
        console.error('Failed to load courses:', coursesResponse.message);
      }

      const examsResponse = await getExamsForFeedback();
      if (examsResponse.ok) {
        console.log('Exams loaded:', examsResponse.data?.length);
        setExams(examsResponse.data || []);
      } else {
        console.error('Failed to load exams:', examsResponse.message);
        setExams([]);
      }

      setDropdownDataLoaded(true);
    } catch (err) {
      console.error('Error loading dropdown data:', err);
      alert('Error loading dropdown data: ' + (err.response?.data?.message || err.message));
      setExams([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let response;
      
      switch (activeTab) {
        case 'received':
          response = await getReceivedFeedbacks(user.id);
          if (response.ok) {
            setFeedbacks(response.data || []);
          }
          break;
        
        case 'given':
          response = await getGivenFeedbacks(user.id);
          if (response.ok) {
            setFeedbacks(response.data || []);
          }
          break;
        
        case 'all':
          if (isAdmin) {
            response = await getAllFeedbacks();
            if (response.ok) {
              setFeedbacks(response.data || []);
            }
          }
          break;
        
        case 'team':
          if (isManager) {
            response = await getTeamFeedbackSummary(user.id);
            if (response.ok && response.data) {
              setTeamSummary(response.data);
              setFeedbacks(response.data.teamFeedbacks || []);
            }
          }
          break;
        
        case 'target':
          if (targetId) {
            response = await getFeedbacksForTarget(targetType, targetId);
            if (response.ok) {
              setFeedbacks(response.data || []);
            }
          }
          break;
        
        case 'average':
          if (targetId) {
            response = await getAverageRating(targetType, targetId);
            if (response.ok) {
              setAverageRating(response.data || 0);
            }
          }
          break;
        
        case 'admin-stats':
          if (isAdmin) {
            response = await getAdminStats();
            if (response.ok) {
              setAdminStats(response.data);
            }
          }
          break;
        
        default:
          break;
      }
    } catch (err) {
      console.error('Error loading data:', err);
      alert('Error loading data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (!searchKeyword) return true;
    
    const searchLower = searchKeyword.toLowerCase();
    return (
      feedback.comments?.toLowerCase().includes(searchLower) ||
      feedback.userName?.toLowerCase().includes(searchLower) ||
      feedback.targetTitle?.toLowerCase().includes(searchLower) ||
      feedback.targetType?.toLowerCase().includes(searchLower)
    );
  });

  const handleOpenFeedbackModal = async () => {
    try {
      setLoading(true);
      if (!dropdownDataLoaded) {
        await loadDropdownData();
      }
      setShowFeedbackModal(true);
    } catch (err) {
      console.error('Error preparing feedback modal:', err);
      alert('Error preparing feedback form: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (feedbackData) => {
    try {
      const requestBody = {
        userId: user.id,
        targetType: feedbackData.targetType,
        targetId: parseInt(feedbackData.targetId),
        receivedByUserId: feedbackData.targetType === 'USER' ? parseInt(feedbackData.targetId) : null,
        rating: parseInt(feedbackData.rating),
        comments: feedbackData.comments
      };

      console.log('Submitting feedback:', requestBody);

      const response = await submitFeedback(requestBody);
      
      if (response.ok) {
        await loadData();
        setShowFeedbackModal(false);
        alert("Feedback submitted successfully!");
      } else {
        alert(response.message || "Failed to submit feedback");
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert(err.response?.data?.message || "Failed to submit feedback.");
    }
  };

  const handleFlagFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to flag this feedback?')) return;
    
    try {
      const response = await flagFeedback(id);
      if (response.ok) {
        await loadData();
        alert('Feedback flagged successfully!');
      } else {
        alert(response.message || 'Failed to flag feedback');
      }
    } catch (err) {
      console.error('Error flagging feedback:', err);
      alert('Failed to flag feedback.');
    }
  };

  const handleGetAverageRating = async () => {
    if (!targetId) {
      alert('Please select a target');
      return;
    }
    setActiveTab('average');
  };

  const getSelectedTargetName = () => {
    if (!targetId) return '';
    
    switch (targetType) {
      case 'COURSE':
        const course = courses.find(c => c.id == targetId);
        return course ? `[${course.id}] ${course.title}` : `Course ${targetId}`;
      case 'EXAM':
        const exam = exams.find(e => e.id == targetId);
        return exam ? `[${exam.id}] ${exam.title || `Exam ${exam.id}`}` : `Exam ${targetId}`;
      case 'USER':
        const user = users.find(u => u.id == targetId);
        return user ? `[${user.id}] ${user.firstName} ${user.lastName}` : `User ${targetId}`;
      default:
        return `${targetType} ${targetId}`;
    }
  };

  if (loading) return <div className="text-center p-4"><div className="loading-spinner"></div> Loading...</div>;

  return (
    <div className="container-fluid feedback-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">💬 Feedback System</h2>
          <small className="text-muted">Give and receive constructive feedback</small>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleOpenFeedbackModal}
          disabled={loading}
           style={{
            width: "fit-content",
            alignSelf: "flex-start"
  }}
        >
          {loading ? '⏳' : '✨'} Give Feedback
        </button>
      </div>

      {/* Professional Compact Admin Statistics Cards */}
      {isAdmin && (
        <div className="admin-stats-container mb-4">
          <div className="stats-grid">
            {/* Total Feedback Card */}
            <div className="stat-card total-feedback">
              <div className="stat-icon">
                <i className="fas fa-comments"></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{adminStats?.totalFeedbacks || 0}</div>
                <div className="stat-label">Total Feedback</div>
              </div>
            </div>

            {/* Course Feedback Card */}
            <div className="stat-card course-feedback">
              <div className="stat-icon">
                <i className="fas fa-book"></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{adminStats?.courseFeedbacksCount || 0}</div>
                <div className="stat-label">Course Feedback</div>
              </div>
            </div>

            {/* Exam Feedback Card */}
            <div className="stat-card exam-feedback">
              <div className="stat-icon">
                <i className="fas fa-clipboard-list"></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{adminStats?.examFeedbacksCount || 0}</div>
                <div className="stat-label">Exam Feedback</div>
              </div>
            </div>

            {/* Average Rating Card */}
            <div className="stat-card average-rating">
              <div className="stat-icon">
                <i className="fas fa-star"></i>
              </div>
              <div className="stat-content">
                <div className="stat-number">{adminStats?.overallAvgRating ? adminStats.overallAvgRating.toFixed(1) : '0.0'}</div>
                <div className="stat-label">Avg Rating</div>
                <div className="stat-stars">
                  {'★'.repeat(Math.round(adminStats?.overallAvgRating || 0))}
                  {'☆'.repeat(5 - Math.round(adminStats?.overallAvgRating || 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simple Search Bar - Hide for admin stats */}
      {activeTab !== 'admin-stats' && (
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Search feedback..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              {searchKeyword && (
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => setSearchKeyword('')}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Target Selection - Hide for admin stats */}
      {activeTab !== 'admin-stats' && (
        <div className="row mb-3">
          <div className="col-md-12">
            <div className="card">
              <div className="card-body py-2">
                <div className="row g-2 align-items-center">
                  <div className="col-auto">
                    <label className="form-label mb-0"><strong>View Feedback For:</strong></label>
                  </div>
                  <div className="col-auto">
                    <select 
                      className="form-select form-select-sm" 
                      value={targetType}
                      onChange={(e) => {
                        setTargetType(e.target.value);
                        setTargetId('');
                      }}
                    >
                      <option value="COURSE">📚 Course</option>
                      <option value="EXAM">📝 Exam</option>
                      <option value="USER">👤 User</option>
                    </select>
                  </div>
                  <div className="col-auto">
                    {targetType === 'USER' ? (
                      <select
                        className="form-select form-select-sm"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                      >
                        <option value="">Select User</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            [{user.id}] {user.firstName} {user.lastName} ({user.email})
                          </option>
                        ))}
                      </select>
                    ) : targetType === 'COURSE' ? (
                      <select
                        className="form-select form-select-sm"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                      >
                        <option value="">Select Course</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id}>
                            [{course.id}] {course.title} {course.category && `(${course.category})`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        className="form-select form-select-sm"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                      >
                        <option value="">Select Exam</option>
                        {exams.map(exam => (
                          <option key={exam.id} value={exam.id}>
                            [{exam.id}] {exam.title || `Exam ${exam.id}`} 
                            {exam.courseTitle && ` - ${exam.courseTitle}`}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="col-auto">
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => setActiveTab('target')}
                      disabled={!targetId}
                    >
                      View Feedback
                    </button>
                  </div>
                  <div className="col-auto">
                    <button 
                      className="btn btn-outline-info btn-sm"
                      onClick={handleGetAverageRating}
                      disabled={!targetId}
                    >
                      Get Average Rating
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role-based Navigation Tabs */}
      <ul className="nav nav-tabs">
        {/* Admin Tabs */}
        {isAdmin && (
          <>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'admin-stats' ? 'active' : ''}`} 
                onClick={() => setActiveTab('admin-stats')}
              >
                📊 Admin Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'all' ? 'active' : ''}`} 
                onClick={() => setActiveTab('all')}
              >
                📋 All Feedback
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'received' ? 'active' : ''}`} 
                onClick={() => setActiveTab('received')}
              >
                📥 Received
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'given' ? 'active' : ''}`} 
                onClick={() => setActiveTab('given')}
              >
                📤 Given
              </button>
            </li>
          </>
        )}

        {/* Manager Tabs */}
        {isManager && (
          <>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'received' ? 'active' : ''}`} 
                onClick={() => setActiveTab('received')}
              >
                📥 Received
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'given' ? 'active' : ''}`} 
                onClick={() => setActiveTab('given')}
              >
                📤 Given
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'team' ? 'active' : ''}`} 
                onClick={() => setActiveTab('team')}
              >
                👥 Team
              </button>
            </li>
          </>
        )}

        {/* Employee Tabs */}
        {isEmployee && (
          <>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'received' ? 'active' : ''}`} 
                onClick={() => setActiveTab('received')}
              >
                📥 Received Feedback
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'given' ? 'active' : ''}`} 
                onClick={() => setActiveTab('given')}
              >
                📤 Given Feedback
              </button>
            </li>
          </>
        )}
      </ul>

      {/* Tab Content */}
      <div className="tab-content mt-4">
        {/* Admin Statistics Tab */}
        {activeTab === 'admin-stats' && isAdmin && (
          <div>
            <h4 className="mb-4">📊 Detailed Feedback Analytics</h4>
            
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary mb-3"></div>
                <p>Loading detailed statistics...</p>
              </div>
            ) : adminStats ? (
              <div className="row">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">Feedback Summary</h5>
                    </div>
                    <div className="card-body">
                      <p>Total system feedbacks: <strong>{adminStats?.totalFeedbacks || 0}</strong></p>
                      <p>Course feedbacks: <strong>{adminStats?.courseFeedbacksCount || 0}</strong></p>
                      <p>Exam feedbacks: <strong>{adminStats?.examFeedbacksCount || 0}</strong></p>
                      <p>Average rating: <strong>{adminStats?.overallAvgRating ? adminStats.overallAvgRating.toFixed(1) : '0.0'}</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-5 text-muted">
                <i className="fas fa-chart-bar fa-3x mb-3"></i>
                <p>No detailed statistics available.</p>
              </div>
            )}
          </div>
        )}

        {/* Average Rating Display */}
        {activeTab === 'average' && (
          <div className="alert alert-info">
            <h4>Average Rating</h4>
            <p className="mb-1">
              <strong>{targetType}</strong>: <strong>{getSelectedTargetName()}</strong>
            </p>
            <h2 className="text-warning">{averageRating.toFixed(1)} / 5</h2>
            <div className="rating-stars-large">
              {'⭐'.repeat(Math.round(averageRating))}
            </div>
            <button 
              className="btn btn-outline-primary btn-sm mt-2"
              onClick={() => setActiveTab('target')}
            >
              View All Feedback for this {targetType}
            </button>
          </div>
        )}

        {/* Received Feedback Tab */}
        {activeTab === 'received' && (
          <div>
            <h4>Feedback Received</h4>
            {filteredFeedbacks.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="fas fa-comment-slash fa-3x mb-3"></i>
                <p>
                  {searchKeyword ? 'No feedback found matching your search.' : "You haven't received any feedback yet."}
                </p>
              </div>
            ) : (
              <FeedbackList 
                feedbacks={filteredFeedbacks} 
                currentUser={user}
                onFlag={handleFlagFeedback}
                showFlagOption={isAdmin}
                type="received"
              />
            )}
          </div>
        )}

        {/* Given Feedback Tab */}
        {activeTab === 'given' && (
          <div>
            <h4>Feedback Given</h4>
            {filteredFeedbacks.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="fas fa-comment-slash fa-3x mb-3"></i>
                <p>
                  {searchKeyword ? 'No feedback found matching your search.' : "You haven't given any feedback yet."}
                </p>
              </div>
            ) : (
              <FeedbackList 
                feedbacks={filteredFeedbacks} 
                currentUser={user}
                onFlag={handleFlagFeedback}
                showFlagOption={isAdmin}
                type="given"
              />
            )}
          </div>
        )}

        {/* All Feedback Tab */}
        {activeTab === 'all' && isAdmin && (
          <div>
            <h4>All System Feedback</h4>
            {filteredFeedbacks.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="fas fa-comment-slash fa-3x mb-3"></i>
                <p>
                  {searchKeyword ? 'No feedback found matching your search.' : "No feedback found in the system."}
                </p>
              </div>
            ) : (
              <FeedbackList 
                feedbacks={filteredFeedbacks} 
                currentUser={user}
                onFlag={handleFlagFeedback}
                showFlagOption={true}
                type="all"
              />
            )}
          </div>
        )}

        {/* Team Summary Tab - UPDATED WITH FIXED CARDS */}
        {activeTab === 'team' && isManager && (
          <div>
            <h4 className="mb-4">👥 Team Feedback Summary</h4>
            {teamSummary ? (
              <div className="row">
                {/* Improved Team Summary Cards with Better Contrast */}
                <div className="col-md-4 mb-4">
                  <div className="card text-center team-summary-card total-feedback-card">
                    <div className="card-body">
                      <div className="team-stat-icon mb-3">
                        <i className="fas fa-comments fa-2x"></i>
                      </div>
                      <h2 className="display-6 fw-bold text-dark mb-2">{teamSummary.totalFeedbacks || 0}</h2>
                      <p className="mb-0 text-muted fw-semibold">Total Feedbacks</p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4 mb-4">
                  <div className="card text-center team-summary-card rating-card">
                    <div className="card-body">
                      <div className="team-stat-icon mb-3">
                        <i className="fas fa-star fa-2x"></i>
                      </div>
                      <h2 className="display-6 fw-bold text-dark mb-2">
                        {teamSummary.averageRating?.toFixed(1) || '0.0'}
                      </h2>
                      <div className="rating-stars mb-2">
                        {'★'.repeat(Math.round(teamSummary.averageRating || 0))}
                        {'☆'.repeat(5 - Math.round(teamSummary.averageRating || 0))}
                      </div>
                      <p className="mb-0 text-muted fw-semibold">Average Rating</p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4 mb-4">
                  <div className="card text-center team-summary-card members-card">
                    <div className="card-body">
                      <div className="team-stat-icon mb-3">
                        <i className="fas fa-users fa-2x"></i>
                      </div>
                      <h2 className="display-6 fw-bold text-dark mb-2">{teamSummary.teamFeedbacks?.length || 0}</h2>
                      <p className="mb-0 text-muted fw-semibold">Team Members</p>
                    </div>
                  </div>
                </div>
                
                {/* Team Feedbacks List */}
                <div className="col-12 mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">📋 Team Member Feedbacks</h5>
                    <span className="badge bg-primary">{filteredFeedbacks.length} feedbacks</span>
                  </div>
                  
                  {filteredFeedbacks.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="fas fa-comments fa-3x mb-3"></i>
                      <p>No team feedbacks found.</p>
                    </div>
                  ) : (
                    <FeedbackList 
                      feedbacks={filteredFeedbacks} 
                      currentUser={user}
                      onFlag={handleFlagFeedback}
                      showFlagOption={false}
                      type="team"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-5 text-muted">
                <i className="fas fa-users fa-3x mb-3"></i>
                <p>No team data available.</p>
                <button className="btn btn-primary mt-2" onClick={loadData}>
                  🔄 Refresh Data
                </button>
              </div>
            )}
          </div>
        )}

        {/* Target Feedback Tab */}
        {activeTab === 'target' && (
          <div>
            <h4>{targetType} Feedback: {getSelectedTargetName()}</h4>
            
            {!targetId ? (
              <div className="alert alert-info">
                Please select a {targetType.toLowerCase()} to view feedback
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="fas fa-comment-slash fa-3x mb-3"></i>
                <p>
                  {searchKeyword ? 'No feedback found matching your search.' : `No feedback found for this ${targetType.toLowerCase()}.`}
                </p>
              </div>
            ) : (
              <FeedbackList 
                feedbacks={filteredFeedbacks} 
                currentUser={user}
                onFlag={handleFlagFeedback}
                showFlagOption={isAdmin}
                type="target"
              />
            )}
          </div>
        )}
      </div>

      {/* Submit Feedback Modal */}
      {showFeedbackModal && (
        <SubmitFeedbackModal
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleSubmitFeedback}
          loading={loading}
          users={users}
          courses={courses}
          exams={exams}
          dropdownDataLoaded={dropdownDataLoaded}
        />
      )}
    </div>
  );
}

// SubmitFeedbackModal Component
function SubmitFeedbackModal({ onClose, onSubmit, loading, users, courses, exams, dropdownDataLoaded }) {
  const [formData, setFormData] = useState({ 
    targetType: 'COURSE',
    targetId: '', 
    rating: 5, 
    comments: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.targetId) { 
      alert('Please select a target'); 
      return; 
    }
    if (!formData.comments || formData.comments.trim().length < 5) {
      alert('Please provide meaningful comments (at least 5 characters)');
      return;
    }
    
    onSubmit(formData);
  };

  const getSelectedTargetName = () => {
    if (!formData.targetId) return '';
    
    switch (formData.targetType) {
      case 'COURSE':
        const course = courses.find(c => c.id == formData.targetId);
        return course ? `[${course.id}] ${course.title}` : '';
      case 'EXAM':
        const exam = exams.find(e => e.id == formData.targetId);
        return exam ? `[${exam.id}] ${exam.title || `Exam ${exam.id}`}` : '';
      case 'USER':
        const user = users.find(u => u.id == formData.targetId);
        return user ? `[${user.id}] ${user.firstName} ${user.lastName}` : '';
      default:
        return '';
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor:'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">✨ Give Feedback</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="modal-body">
            {!dropdownDataLoaded ? (
              <div className="text-center p-4">
                <div className="spinner-border text-primary mb-3"></div>
                <p>Loading form data...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">What are you reviewing? *</label>
                    <select 
                      className="form-select" 
                      value={formData.targetType} 
                      onChange={(e) => setFormData({...formData, targetType: e.target.value, targetId: ''})}
                      disabled={loading}
                    >
                      <option value="COURSE">📚 Course</option>
                      <option value="EXAM">📝 Exam</option>
                      <option value="USER">👤 User</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Select {formData.targetType.toLowerCase()} *</label>
                    {formData.targetType === 'USER' ? (
                      <select
                        className="form-select"
                        value={formData.targetId}
                        onChange={(e) => setFormData({...formData, targetId: e.target.value})}
                        required
                        disabled={loading || users.length === 0}
                      >
                        <option value="">{users.length === 0 ? 'Loading users...' : 'Choose a user...'}</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            [{user.id}] {user.firstName} {user.lastName} ({user.email})
                          </option>
                        ))}
                      </select>
                    ) : formData.targetType === 'COURSE' ? (
                      <select
                        className="form-select"
                        value={formData.targetId}
                        onChange={(e) => setFormData({...formData, targetId: e.target.value})}
                        required
                        disabled={loading || courses.length === 0}
                      >
                        <option value="">{courses.length === 0 ? 'Loading courses...' : 'Choose a course...'}</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id}>
                            [{course.id}] {course.title} {course.category && `(${course.category})`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        className="form-select"
                        value={formData.targetId}
                        onChange={(e) => setFormData({...formData, targetId: e.target.value})}
                        required
                        disabled={loading || exams.length === 0}
                      >
                        <option value="">{exams.length === 0 ? 'Loading exams...' : 'Choose an exam...'}</option>
                        {exams.map(exam => (
                          <option key={exam.id} value={exam.id}>
                            [{exam.id}] {exam.title || `Exam ${exam.id}`} 
                            {exam.courseTitle && ` - ${exam.courseTitle}`}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {formData.targetId && (
                  <div className="alert alert-info mb-3">
                    <strong>Selected:</strong> {getSelectedTargetName()}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Rating *</label>
                  <select 
                    className="form-select" 
                    value={formData.rating} 
                    onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
                    disabled={loading}
                  >
                    <option value={1}>1 ⭐ - Poor</option>
                    <option value={2}>2 ⭐⭐ - Fair</option>
                    <option value={3}>3 ⭐⭐⭐ - Good</option>
                    <option value={4}>4 ⭐⭐⭐⭐ - Very Good</option>
                    <option value={5}>5 ⭐⭐⭐⭐⭐ - Excellent</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Your Feedback *</label>
                  <textarea 
                    className="form-control" 
                    rows={4} 
                    value={formData.comments} 
                    onChange={(e) => setFormData({...formData, comments: e.target.value})} 
                    required 
                    placeholder="Provide specific, constructive feedback. Be clear about what works well and what could be improved..."
                    disabled={loading}
                  />
                  <div className="form-text">
                    💡 Tip: Be specific, constructive, and focus on observable behaviors or outcomes.
                  </div>
                </div>

                <div className="modal-footer" style={{ padding: '1rem', borderTop: '1px solid #dee2e6' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading || !formData.targetId}
                    style={{ minWidth: '120px' }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Submitting...
                      </>
                    ) : (
                      '📤 Submit Feedback'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// FeedbackList Component - Clear Employee Name Display
function FeedbackList({ feedbacks, currentUser, onFlag, showFlagOption, type }) {
  const getStatusBadge = (status) => {
    if (status === 'FLAGGED') {
      return <span className="badge bg-danger">🚩 FLAGGED</span>;
    }
    return <span className="badge bg-success">ACTIVE</span>;
  };

  const getTargetTypeIcon = (targetType) => {
    return targetType === 'COURSE' ? '📚' : targetType === 'EXAM' ? '📝' : '👤';
  };

  return (
    <div className="row">
      {feedbacks.map(feedback => (
        <div key={feedback.id} className="col-md-6 col-lg-4 mb-4">
          <div className={`card h-100 feedback-card ${feedback.status === 'FLAGGED' ? 'flagged' : ''} ${type}`}>
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0 text-white">
                  {getTargetTypeIcon(feedback.targetType)} {feedback.targetType} Feedback
                </h6>
                <small className="text-white-50">
                  {feedback.targetTitle}
                </small>
              </div>
              <div className="d-flex align-items-center gap-1">
                <span className="rating-stars" title={`${feedback.rating}/5 rating`}>
                  {'⭐'.repeat(feedback.rating)}
                </span>
                {getStatusBadge(feedback.status)}
              </div>
            </div>
            
            <div className="card-body">
              {/* CLEAR FEEDBACK CONTENT SECTION */}
              <div className="feedback-content">
                {/* EMPLOYEE NAME - PROMINENTLY DISPLAYED */}
                <div className="employee-section mb-3 p-3 bg-light rounded">
                  <div className="row g-2">
                    <div className="col-12">
                      <div className="d-flex align-items-center">
                        <strong className="me-2 text-primary">👤 From Employee:</strong>
                        <span className="fw-bold text-dark">
                          {feedback.userName || `User ${feedback.userId}`}
                        </span>
                      </div>
                    </div>
                    
                    {/* TARGET INFORMATION */}
                    <div className="col-12">
                      <div className="d-flex align-items-center">
                        <strong className="me-2 text-success">🎯 On:</strong>
                        <span className="fw-bold text-dark">
                          {feedback.targetTitle} 
                          <small className="text-muted ms-1">({feedback.targetType})</small>
                        </span>
                      </div>
                    </div>

                    {/* RECEIVED BY USER (if applicable) */}
                    {feedback.receivedByUserName && (
                      <div className="col-12">
                        <div className="d-flex align-items-center">
                          <strong className="me-2 text-info">📨 To User:</strong>
                          <span className="fw-bold text-dark">
                            {feedback.receivedByUserName}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RATING DISPLAY */}
                <div className="rating-section mb-3 p-2 bg-warning bg-opacity-10 rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <strong className="text-dark">Rating:</strong>
                    <div>
                      <span className="fw-bold text-dark me-2">{feedback.rating}/5</span>
                      <span className="rating-stars-small">
                        {'⭐'.repeat(feedback.rating)}
                        {'☆'.repeat(5 - feedback.rating)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* FEEDBACK MESSAGE */}
                <div className="message-section">
                  <strong className="d-block mb-2 text-dark">📝 Feedback Message:</strong>
                  <div className="p-3 bg-light border rounded message-container">
                    <p className="mb-0 feedback-text">
                      {feedback.comments || <em className="text-muted">No comments provided</em>}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* FEEDBACK META DATA */}
              <div className="feedback-meta mt-3">
                <div className="d-flex justify-content-between text-muted small mb-2">
                  <span>
                    <strong>Date:</strong> {new Date(feedback.createdAt).toLocaleDateString()}
                  </span>
                  <span>
                    <strong>ID:</strong> #{feedback.id}
                  </span>
                </div>
                
                {showFlagOption && feedback.status !== 'FLAGGED' && (
                  <div className="d-flex justify-content-end">
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => onFlag(feedback.id)}
                      title="Flag this feedback as inappropriate"
                    >
                      🚩 Flag
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}