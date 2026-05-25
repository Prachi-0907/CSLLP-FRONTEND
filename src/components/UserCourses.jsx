import React, { useState, useEffect } from 'react';
import { getUsers, getEnrollmentsByEmployee, getCourses } from '../services/api';

export default function UserCourses({ user }) {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination state for Employees
  const [currentEmployeePage, setCurrentEmployeePage] = useState(1);
  const [employeesPerPage, setEmployeesPerPage] = useState(2);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Pagination state for Enrollments
  const [currentEnrollmentPage, setCurrentEnrollmentPage] = useState(1);
  const [enrollmentsPerPage, setEnrollmentsPerPage] = useState(5);
  const [showEnrollmentDropdown, setShowEnrollmentDropdown] = useState(false);

  // 🆕 NEW: Automatic reminder system state
  const [pendingReminders, setPendingReminders] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [sendingReminders, setSendingReminders] = useState(false);

  useEffect(() => {
    loadInitialData();
    loadReminderSystemData(); // 🆕 Load reminder system data
  }, []);

  const loadInitialData = async () => {
    try {
      // Load employees
      const usersRes = await getUsers();
      if (usersRes.ok && usersRes.body && usersRes.body.success) {
        const employeeUsers = usersRes.body.data.filter(u => u.role === 'EMPLOYEE');
        setEmployees(employeeUsers);
      }

      // Load courses for mapping
      const coursesRes = await getCourses();
      if (coursesRes.ok && coursesRes.body && coursesRes.body.success) {
        setCourses(coursesRes.body.data || []);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 NEW: Load automatic reminder system data
  const loadReminderSystemData = async () => {
    try {
      // Load pending reminders
      const pendingRes = await fetch('http://localhost:8088/courses/admin/reminders/pending');
      const pendingData = await pendingRes.json();
      if (pendingData.success) {
        setPendingReminders(pendingData.data || []);
      }

      // Load system status
      const statusRes = await fetch('http://localhost:8088/courses/admin/reminders/status');
      const statusData = await statusRes.json();
      if (statusData.success) {
        setSystemStatus(statusData.data);
      }
    } catch (error) {
      console.error('Failed to load reminder system data:', error);
    }
  };

  const loadEmployeeEnrollments = async (employeeId) => {
    try {
      const res = await getEnrollmentsByEmployee(employeeId);
      if (res.ok && res.body && res.body.success) {
        setEnrollments(res.body.data || []);
        setSelectedEmployee(employeeId);
        // Reset enrollment pagination when selecting new employee
        setCurrentEnrollmentPage(1);
      }
    } catch (error) {
      console.error('Failed to load enrollments:', error);
      setEnrollments([]);
    }
  };

  // 🆕 NEW: Trigger automatic reminders
  const triggerAutomaticReminders = async () => {
    if (window.confirm('Send automatic reminders to all employees with low progress after 15 days?')) {
      setSendingReminders(true);
      try {
        const response = await fetch('http://localhost:8088/courses/admin/reminders/send-automatic', {
          method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
          alert('✅ Automatic reminders sent successfully!');
          // Refresh data
          loadReminderSystemData();
          loadInitialData();
        } else {
          alert('❌ Failed to send reminders: ' + result.message);
        }
      } catch (error) {
        alert('❌ Error sending reminders: ' + error.message);
      } finally {
        setSendingReminders(false);
      }
    }
  };

  // 🆕 NEW: Check if employee needs reminder
  const employeeNeedsReminder = (employeeId) => {
    return pendingReminders.some(reminder => reminder.employeeId === employeeId);
  };

  // 🆕 NEW: Get reminder details for employee
  const getEmployeeReminderDetails = (employeeId) => {
    return pendingReminders.filter(reminder => reminder.employeeId === employeeId);
  };

  const getCourseTitle = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : `Course #${courseId}`;
  };

  const filteredEmployees = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // const getEmployeeStats = (employeeId) => {
  //   const employeeEnrollments = enrollments.filter(e => e.employeeId === employeeId);
  //   const total = employeeEnrollments.length;
  //   const completed = employeeEnrollments.filter(e => e.progress >= 100 && e.status === 'COMPLETED').length;
  //   const inProgress = employeeEnrollments.filter(e => e.progress > 0 && e.progress < 100).length;
  //   const notStarted = employeeEnrollments.filter(e => e.progress === 0).length;
    
  //   return { total, completed, inProgress, notStarted };
  // };
  const getEmployeeStats = (employeeId) => {
  const employeeEnrollments = enrollments.filter(
    e => e.employeeId === employeeId
  );

  const total = employeeEnrollments.length;

  const completed = employeeEnrollments.filter(
    e => e.progress >= 100
  ).length;

  const inProgress = employeeEnrollments.filter(
    e => e.progress > 0 && e.progress < 100
  ).length;

  const notStarted = employeeEnrollments.filter(
    e => e.progress === 0
  ).length;

  // NEW: Average overall progress
  const overallProgress =
    total > 0
      ? Math.round(
          employeeEnrollments.reduce(
            (sum, e) => sum + (e.progress || 0),
            0
          ) / total
        )
      : 0;

  return {
    total,
    completed,
    inProgress,
    notStarted,
    overallProgress
  };
};

  // 🆕 NEW: Get reminder stats for employee
  const getEmployeeReminderStats = (employeeId) => {
    const employeeReminders = getEmployeeReminderDetails(employeeId);
    const lowProgress = employeeReminders.filter(r => r.progress > 0 && r.progress < 50).length;
    const notStarted = employeeReminders.filter(r => r.progress === 0).length;
    
    return { totalReminders: employeeReminders.length, lowProgress, notStarted };
  };

  // Pagination logic for Employees
  const indexOfLastEmployee = currentEmployeePage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalEmployeePages = Math.ceil(filteredEmployees.length / employeesPerPage);

  // Pagination logic for Enrollments
  const indexOfLastEnrollment = currentEnrollmentPage * enrollmentsPerPage;
  const indexOfFirstEnrollment = indexOfLastEnrollment - enrollmentsPerPage;
  const currentEnrollments = enrollments.slice(indexOfFirstEnrollment, indexOfLastEnrollment);
  const totalEnrollmentPages = Math.ceil(enrollments.length / enrollmentsPerPage);

  // Change page functions for Employees
  const paginateEmployees = (pageNumber) => setCurrentEmployeePage(pageNumber);
  const nextEmployeePage = () => {
    if (currentEmployeePage < totalEmployeePages) {
      setCurrentEmployeePage(currentEmployeePage + 1);
    }
  };
  const prevEmployeePage = () => {
    if (currentEmployeePage > 1) {
      setCurrentEmployeePage(currentEmployeePage - 1);
    }
  };

  // Change page functions for Enrollments
  const paginateEnrollments = (pageNumber) => setCurrentEnrollmentPage(pageNumber);
  const nextEnrollmentPage = () => {
    if (currentEnrollmentPage < totalEnrollmentPages) {
      setCurrentEnrollmentPage(currentEnrollmentPage + 1);
    }
  };
  const prevEnrollmentPage = () => {
    if (currentEnrollmentPage > 1) {
      setCurrentEnrollmentPage(currentEnrollmentPage - 1);
    }
  };

  // Handle records per page change for Employees
  const handleEmployeeRecordsPerPageChange = (perPage) => {
    setEmployeesPerPage(perPage);
    setCurrentEmployeePage(1);
    setShowEmployeeDropdown(false);
  };

  // Handle records per page change for Enrollments
  const handleEnrollmentRecordsPerPageChange = (perPage) => {
    setEnrollmentsPerPage(perPage);
    setCurrentEnrollmentPage(1);
    setShowEnrollmentDropdown(false);
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentEmployeePage(1);
  }, [searchTerm]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmployeeDropdown && !event.target.closest('.employee-dropdown-container')) {
        setShowEmployeeDropdown(false);
      }
      if (showEnrollmentDropdown && !event.target.closest('.enrollment-dropdown-container')) {
        setShowEnrollmentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmployeeDropdown, showEnrollmentDropdown]);

  if (loading) return <div className="text-center p-4">Loading employee data...</div>;

  return (
    <div className="container-fluid px-3 px-md-4 py-4 ">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">📈 User Courses & Progress</h2>
          <small className="text-muted">
            Monitor employee learning progress with automatic reminders
          </small>
        </div>
        {/* <div className="d-flex gap-2"> */}
        <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-end">
          {/* 🆕 NEW: Automatic Reminder System Status */}
          {systemStatus && (
            <div className="alert alert-info alert-sm px-2 shadow-sm mb-0 me-2 py-2" style={{ width: "fit-content", height: "fit-content" }}>
              <small>
                <strong>Auto-Reminders:</strong> {systemStatus.systemStatus} • 
                <strong> Next:</strong> {new Date(systemStatus.nextRun).toLocaleString()} •
                <strong> Pending:</strong> {systemStatus.totalPendingReminders}
              </small>
            </div>
          )}
          
          {/* <button 
            className="btn btn-outline-primary" 
            onClick={() => {
              loadInitialData();
              loadReminderSystemData();
            }}
          >
            🔄 Refresh
          </button> */}
          
          {/* 🆕 NEW: Trigger Automatic Reminders Button */}
          <button
            className="btn btn-warning btn-sm px-2 shadow-sm"
            style={{ width: "fit-content" }}
            onClick={triggerAutomaticReminders}
            disabled={sendingReminders || pendingReminders.length === 0}
          >
            {sendingReminders ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Sending...
              </>
            ) : (
              <>
                🔔 Send Auto Reminders ({pendingReminders.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="row mb-4 align-items-center">
        <div className="col-md-6 mb-3 mb-md-0">
          <div className="input-group shadow-sm rounded-full overflow-hidden" style={{transition: "0.3s ease",}}>
            <span className="input-group-text bg-info text-white border-0">🔍</span>
            <input
              type="text"
              className="form-control border-0"
              placeholder="Search employees by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{boxShadow: "none", transition: "0.3s ease"}}
            />
          </div>
        </div>
        <div className="col-md-6">
          {/* <div className="form-text"> */}
          <div className='d-flex flex-wrap justify-content-md-end gap-2'>
            Showing {currentEmployees.length} of {filteredEmployees.length} employees • {employees.length} total employees •
            <span className="text-warning ms-2">
              ⚠️ {pendingReminders.length} need reminders
            </span>
          </div>
        </div>
      </div>

      {/* Employees List */}
      <div className="row justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        {/* <div className="col-md-5"> */}
        <div className="col-18 col-md-18 col-lg-18 col-xl-18">
          <div className="card shadow-sm border-0 rounded-4 h-100 border-purple-500">
            {/* <div className="card-header bg-light d-flex justify-content-between align-items-center"> */}
            <div className="card-header bg-light py-3">
              {/* <h5 className="card-title mb-0">👥 Employees</h5> */}
              <h4 className="fw-bold text-center mb-3">
                {selectedEmployee
                  ? `📚 Course Progress for ${
                      employees.find(e => e.id === selectedEmployee)?.firstName
                    } ${
                      employees.find(e => e.id === selectedEmployee)?.lastName
                    }`
                  : '📚 Select an Employee'}
              </h4>
              <div className="d-flex justify-content-center align-items-center gap-2">
                {/* Custom Dropdown for employees per page */}
                <div className="employee-dropdown-container position-relative">
                  <button 
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                    onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                  >
                    <span>Show: {employeesPerPage}</span>
                    <span>▼</span>
                  </button>
                  
                  {showEmployeeDropdown && (
                    <div className="dropdown-menu show position-absolute end-0 mt-1" style={{ zIndex: 1000 }}>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleEmployeeRecordsPerPageChange(2)}
                      >
                        2 
                      </button>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleEmployeeRecordsPerPageChange(5)}
                      >
                        5 
                      </button>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleEmployeeRecordsPerPageChange(10)}
                      >
                        10 
                      </button>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleEmployeeRecordsPerPageChange(20)}
                      >
                        20 
                      </button>
                    </div>
                  )}
                </div>
                
                <span className="badge bg-primary">
                  Page {currentEmployeePage} of {totalEmployeePages}
                </span>
                <span className="badge bg-secondary">{filteredEmployees.length}</span>
              </div>
            </div>
            <div className="card-body p-4" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredEmployees.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-muted">No employees found</p>
                </div>
              ) : (
                <>
                  <div className="list-group list-group-flush">
                    {currentEmployees.map(employee => {
                      const stats = getEmployeeStats(employee.id);
                      const needsReminder = employeeNeedsReminder(employee.id);
                      const reminderStats = getEmployeeReminderStats(employee.id);
                      
                      return (
                        <div
                          key={employee.id}
                          className={`list-group-item list-group-item-action py-3 px-3 ${
                            selectedEmployee === employee.id ? 'active' : ''
                          } ${needsReminder ? 'border-warning border-start-4' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => loadEmployeeEnrollments(employee.id)}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center">
                                <h6 className="mb-1">{employee.firstName} {employee.lastName}</h6>
                                {needsReminder && (
                                  <span className="badge bg-warning ms-2" title={`${reminderStats.totalReminders} courses need attention`}>
                                    ⚠️ {reminderStats.totalReminders}
                                  </span>
                                )}
                              </div>
                              <small className={selectedEmployee === employee.id ? 'text-light' : 'text-muted'}>
                                {employee.email}
                              </small>
                              
                              {/* Progress Stats */}
                              {/* <div className="mt-2">
                                <div className="d-flex justify-content-between flex-wrap gap-2 small fw-semibold">
                                  <span className="text-black">Total: {stats.total}</span>
                                  <span className="text-success-emphasis">Completed: {stats.completed}</span>
                                  <span className="text-warning">In Progress: {stats.inProgress}</span>
                                  <span className="text-info">Not Started: {stats.notStarted}</span>
                                </div>
                              </div> */}
                              <div className="mt-2  p-2 rounded">
                                <div className="d-flex justify-content-between flex-wrap gap-2 small fw-semibold">

                                  <span className="text-danger">
                                    Total: {stats.total}
                                  </span>

                                  <span style={{ color: "#7CFC00" }}>
                                    Completed: {stats.completed}
                                  </span>

                                  <span style={{ color: "#FFD700" }}>
                                    In Progress: {stats.inProgress}
                                  </span>

                                  <span style={{ color: "#FFB6C1" }}>
                                    Not Started: {stats.notStarted}
                                  </span>

                                </div>
                              </div>

                              {/* 🆕 NEW: Reminder Details */}
                              {needsReminder && (
                                <div className="mt-2 p-2 bg-warning bg-opacity-10 rounded">
                                  <small className="text-warning">
                                    <strong>Needs Reminder:</strong> {reminderStats.notStarted} not started, {reminderStats.lowProgress} low progress
                                  </small>
                                </div>
                              )}
                            </div>
                            <div className="text-end ms-3">
                              <div className="badge bg-primary mb-2">{stats.total} courses</div>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mt-2">
                            {/* <div className="progress" style={{ height: '8px' }}> */}
                            <div className="progress rounded-full" style={{ height: '12px' }}>
                              <div
                                className="progress-bar bg-success"
                                style={{ width: `${stats.overallProgress}%` }}
                                title={`${stats.completed} completed`}
                              ></div>
                              <div
                                className="progress-bar bg-warning"
                                style={{ width: `${stats.overallProgress}%` }}
                                title={`${stats.inProgress} in progress`}
                              ></div>
                            </div>
                            <small className={selectedEmployee === employee.id ? 'text-light' : 'text-muted'}>
                              Overall Progress: {stats.overallProgress}%
                            </small>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Controls for Employees */}
                  {totalEmployeePages > 1 && (
                    <div className="card-footer">
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          Showing {indexOfFirstEmployee + 1}-{Math.min(indexOfLastEmployee, filteredEmployees.length)} of {filteredEmployees.length}
                        </small>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={prevEmployeePage}
                            disabled={currentEmployeePage === 1}
                          >
                            ←
                          </button>
                          
                          {/* Page Numbers */}
                          {Array.from({ length: totalEmployeePages }, (_, i) => i + 1)
                            .filter(page => {
                              return page === 1 || 
                                     page === totalEmployeePages || 
                                     (page >= currentEmployeePage - 1 && page <= currentEmployeePage + 1);
                            })
                            .map((page, index, array) => {
                              const showEllipsis = index > 0 && page - array[index - 1] > 1;
                              return (
                                <React.Fragment key={page}>
                                  {showEllipsis && <span className="px-1">...</span>}
                                  <button
                                    className={`btn btn-sm ${
                                      currentEmployeePage === page ? 'btn-primary' : 'btn-outline-primary'
                                    }`}
                                    onClick={() => paginateEmployees(page)}
                                  >
                                    {page}
                                  </button>
                                </React.Fragment>
                              );
                            })}
                          
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={nextEmployeePage}
                            disabled={currentEmployeePage === totalEmployeePages}
                          >
                            →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Selected Employee Details */}
        {/* <div className="col-md-7"> */}
        <div className="col-18 col-md-18 col-lg-18 col-xl-18">
          <div className="card shadow-sm border-0 rounded-4 h-100 border-purple-500">
            <div className="card-header bg-light d-flex ">
              {/* <h5 className="card-title mb-0">
                {selectedEmployee ? `📚 Course Progress for ${employees.find(e => e.id === selectedEmployee)?.firstName} ${employees.find(e => e.id === selectedEmployee)?.lastName}` : 'Select an employee'}
              </h5> */}
              <h4 className="fw-bold mb-3">
                {selectedEmployee
                  ? `📚 Course Progress for ${
                      employees.find(e => e.id === selectedEmployee)?.firstName
                    } ${
                      employees.find(e => e.id === selectedEmployee)?.lastName
                    }`
                  : '📚 Select an Employee'}
              </h4>
              <div className="d-flex align-items-center gap-2">
                {selectedEmployee && enrollments.length > 0 && (
                  <>
                    {/* Custom Dropdown for enrollments per page */}
                    <div className="enrollment-dropdown-container position-relative">
                      <button 
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                        onClick={() => setShowEnrollmentDropdown(!showEnrollmentDropdown)}
                      >
                        <span>Show: {enrollmentsPerPage}</span>
                        <span>▼</span>
                      </button>
                      
                      {showEnrollmentDropdown && (
                        <div className="dropdown-menu show position-absolute end-0 mt-1" style={{ zIndex: 1000 }}>
                          <button 
                            className="dropdown-item" 
                            onClick={() => handleEnrollmentRecordsPerPageChange(5)}
                          >
                            5 
                          </button>
                          <button 
                            className="dropdown-item" 
                            onClick={() => handleEnrollmentRecordsPerPageChange(10)}
                          >
                            10 
                          </button>
                          <button 
                            className="dropdown-item" 
                            onClick={() => handleEnrollmentRecordsPerPageChange(15)}
                          >
                            15 
                          </button>
                          <button 
                            className="dropdown-item" 
                            onClick={() => handleEnrollmentRecordsPerPageChange(20)}
                          >
                            20 
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="badge bg-primary">
                      Page {currentEnrollmentPage} of {totalEnrollmentPages}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="card-body p-4">
              {!selectedEmployee ? (
                <div className="text-center p-4">
                  <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>👆</div>
                  <h5>Select an Employee</h5>
                  <p className="text-muted">Choose an employee from the list to view their course progress.</p>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center p-4">
                  <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>📚</div>
                  <h5>No Course Enrollments</h5>
                  <p className="text-muted">This employee is not enrolled in any courses yet.</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                      <thead className="table-warning">
                        <tr>
                          <th>Course</th>
                          <th>Progress</th>
                          <th>Status</th>
                          <th>Enrolled Date</th>
                          <th>Days Since</th>
                          <th>Reminder Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentEnrollments.map(enrollment => {
                          const needsReminder = pendingReminders.some(
                            reminder => reminder.enrollmentId === enrollment.id
                          );
                          const reminderDetails = pendingReminders.find(
                            reminder => reminder.enrollmentId === enrollment.id
                          );
                          
                          return (
                            <tr key={enrollment.id} className={needsReminder ? 'table-warning' : ''}>
                              <td>
                                <strong>{getCourseTitle(enrollment.courseId)}</strong>
                                <br />
                                <small className="text-muted">ID: #{enrollment.courseId}</small>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {/* <div className="progress flex-grow-1 me-2" style={{ height: '10px' }}> */}
                                  <div className="progress rounded-pill" style={{ height: '12px' }}>
                                    <div
                                      className={`progress-bar ${
                                        enrollment.progress === 100 ? 'bg-success' :
                                        enrollment.progress >= 50 ? 'bg-primary' :
                                        enrollment.progress > 0 ? 'bg-warning' : 'bg-secondary'
                                      }`}
                                      style={{ width: `${enrollment.progress}%` }}
                                    ></div>
                                  </div>
                                  <strong>{enrollment.progress}%</strong>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${
                                  enrollment.status === 'COMPLETED' ? 'bg-success' :
                                  enrollment.status === 'IN_PROGRESS' ? 'bg-primary' :
                                  enrollment.status === 'PENDING_APPROVAL' ? 'bg-warning' :
                                  enrollment.status === 'APPROVED' ? 'bg-info' : 'bg-secondary'
                                }`}>
                                  {enrollment.status ? enrollment.status.replace(/_/g, ' ') : 'Unknown'}
                                </span>
                              </td>
                              <td>
                                {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'N/A'}
                              </td>
                              <td>
                                {enrollment.enrolledAt ? (
                                  <span className={`badge ${
                                    Math.floor((new Date() - new Date(enrollment.enrolledAt)) / (1000 * 60 * 60 * 24)) > 15 ? 'bg-danger' : 'bg-info'
                                  }`}>
                                    {Math.floor((new Date() - new Date(enrollment.enrolledAt)) / (1000 * 60 * 60 * 24))} days
                                  </span>
                                ) : 'N/A'}
                              </td>
                              <td>
                                {needsReminder ? (
                                  <span className="badge bg-warning" title={`${reminderDetails?.daysSinceEnrollment} days since enrollment`}>
                                    ⚠️ Needs Reminder
                                  </span>
                                ) : enrollment.progress === 100 ? (
                                  <span className="badge bg-success">Completed</span>
                                ) : (
                                  <span className="badge bg-info">On Track</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls for Enrollments */}
                  {totalEnrollmentPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-3 p-3 border-top">
                      <small className="text-muted">
                        Showing {indexOfFirstEnrollment + 1}-{Math.min(indexOfLastEnrollment, enrollments.length)} of {enrollments.length} courses
                      </small>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={prevEnrollmentPage}
                          disabled={currentEnrollmentPage === 1}
                        >
                          ←
                        </button>
                        
                        {/* Page Numbers */}
                        {Array.from({ length: totalEnrollmentPages }, (_, i) => i + 1)
                          .filter(page => {
                            return page === 1 || 
                                   page === totalEnrollmentPages || 
                                   (page >= currentEnrollmentPage - 1 && page <= currentEnrollmentPage + 1);
                          })
                          .map((page, index, array) => {
                            const showEllipsis = index > 0 && page - array[index - 1] > 1;
                            return (
                              <React.Fragment key={page}>
                                {showEllipsis && <span className="px-1">...</span>}
                                <button
                                  className={`btn btn-sm ${
                                    currentEnrollmentPage === page ? 'btn-secondary' : 'btn-outline-secondary'
                                  }`}
                                  onClick={() => paginateEnrollments(page)}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            );
                          })}
                        
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={nextEnrollmentPage}
                          disabled={currentEnrollmentPage === totalEnrollmentPages}
                        >
                          →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Summary Stats */}
                  <div className="row row-cols-2 row-cols-sm-3 row-cols-md-6 mt-4 g-2 text-center">
                    <div className="col text-center">
                      <div className="card bg-primary text-white shadow-sm h-100">
                        <div className="card-body py-3 px-2">
                          <h5 className='fw-bold mb-1'>{enrollments.length}</h5>
                          <small>Total</small>
                        </div>
                      </div>
                    </div>
                    <div className="col text-center">
                      <div className="card bg-success text-white shadow-sm h-100">
                        <div className="card-body py-3 px-2">
                          <h5 className='fw-bold mb-1'>{enrollments.filter(e => e.progress === 100).length}</h5>
                          <small>Completed</small>
                        </div>
                      </div>
                    </div>
                    <div className="col text-center">
                      <div className="card bg-warning text-white shadow-sm h-100">
                        <div className="card-body py-3 px-2">
                          <h5 className='fw-bold mb-1'>{enrollments.filter(e => e.progress > 0 && e.progress < 100).length}</h5>
                          <small>In Progress</small>
                        </div>
                      </div>
                    </div>
                    <div className="col text-center">
                      <div className="card bg-secondary text-white shadow-sm h-100">
                        <div className="card-body py-3 px-2">
                          <h5 className='fw-bold mb-1'>{enrollments.filter(e => e.progress === 0).length}</h5>
                          <small>Not Started</small>
                        </div>
                      </div>
                    </div>
                    <div className="col text-center">
                      <div className="card bg-danger text-white shadow-sm h-100">
                        <div className="card-body py-3 px-2">
                          <h5 className='fw-bold mb-1'>{enrollments.filter(e => 
                            e.enrolledAt && 
                            Math.floor((new Date() - new Date(e.enrolledAt)) / (1000 * 60 * 60 * 24)) > 15 &&
                            e.progress < 50
                          ).length}</h5>
                          <small>Overdue</small>
                        </div>
                      </div>
                    </div>
                    <div className="col text-center">
                      <div className="card bg-info text-white shadow-sm h-100">
                        <div className="card-body py-3 px-2">
                          <h5 className='fw-bold mb-1'>{getEmployeeReminderStats(selectedEmployee).totalReminders}</h5>
                          <small>Need Reminder</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}