// src/components/CreateExamForm.jsx
import React, { useState, useEffect } from "react";
import { createExam, addQuestion, getCourses } from "../services/api";

export default function CreateExamForm() {
  const [examData, setExamData] = useState({
    title: "",
    description: "",
    durationMinutes: "",
    courseId: ""
    // REMOVED: startTime and endTime
  });

  const [questions, setQuestions] = useState([
    { 
      questionText: "", 
      optionsText: "", 
      correctAnswer: "",
      marks: 1
    }
  ]);

  const [courses, setCourses] = useState([]);
  const [examCreated, setExamCreated] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("exam");

  // Fetch courses
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await getCourses();
      setCourses(response.data || []);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      setMessage("❌ Failed to load courses");
    }
  };

  // Handle exam input change
  const handleExamChange = (e) => {
    const { name, value } = e.target;
    setExamData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle question field changes
  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  // Add new question
  const addNewQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { 
        questionText: "", 
        optionsText: "", 
        correctAnswer: "",
        marks: 1
      }
    ]);
    setActiveSection("questions");
  };

  // Remove question
  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  // Validate form - UPDATED: Removed time validation
  const validateForm = () => {
    const { title, description, durationMinutes, courseId } = examData;
    
    if (!title || !description || !durationMinutes || !courseId) {
      setMessage("❌ Please fill all exam details");
      setActiveSection("exam");
      return false;
    }

    // REMOVED: Time validation
    // if (new Date(startTime) >= new Date(endTime)) {
    //   setMessage("❌ End time must be after start time");
    //   setActiveSection("exam");
    //   return false;
    // }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.questionText.trim() || !q.optionsText.trim() || !q.correctAnswer.trim()) {
        setMessage(`❌ Please fill Question ${i + 1} completely`);
        setActiveSection("questions");
        return false;
      }

      if (!q.marks || q.marks < 1) {
        setMessage(`❌ Question ${i + 1} must have at least 1 mark`);
        setActiveSection("questions");
        return false;
      }

      const optionsArray = q.optionsText.split(',').map(opt => opt.trim());
      if (!optionsArray.includes(q.correctAnswer.trim())) {
        setMessage(`❌ Correct answer for Question ${i + 1} must be one of the options`);
        setActiveSection("questions");
        return false;
      }

      if (optionsArray.length < 2) {
        setMessage(`❌ Question ${i + 1} must have at least 2 options`);
        setActiveSection("questions");
        return false;
      }
    }

    return true;
  };

  // Submit form - UPDATED: Removed time from payload
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const creatorId = localStorage.getItem("userId") || 2;

      const examPayload = {
        ...examData,
        durationMinutes: parseInt(examData.durationMinutes),
        // REMOVED: startTime and endTime
        courseId: parseInt(examData.courseId)
      };

      const createdExam = await createExam(examPayload, creatorId);
      setExamCreated(createdExam);

      for (const q of questions) {
        const options = q.optionsText
          .split(",")
          .map((opt) => opt.trim())
          .filter((opt) => opt !== "")
          .map((opt) => ({
            text: opt,
            isCorrect: opt === q.correctAnswer.trim()
          }));

        const questionPayload = {
          questionText: q.questionText,
          questionType: "MCQ",
          marks: parseInt(q.marks),
          options
        };

        await addQuestion(createdExam.id, questionPayload);
      }

      setMessage("🎉 Exam and questions created successfully!");
      
      // Reset form
      setExamData({
        title: "",
        description: "",
        durationMinutes: "",
        courseId: ""
        // REMOVED: startTime and endTime
      });
      setQuestions([{ 
        questionText: "", 
        optionsText: "", 
        correctAnswer: "",
        marks: 1 
      }]);
    } catch (err) {
      console.error("Error creating exam:", err);
      setMessage("❌ Error creating exam or questions: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="glass-card">
        {/* Header */}
        <div className="header-section">
          <div className="icon-wrapper">
            <div className="form-icon">📝</div>
          </div>
          <h1 className="form-title">Create New Exam</h1>
          <p className="form-subtitle">Design your exam with questions and scoring</p>
        </div>

        {/* Progress Navigation */}
        <div className="progress-nav">
          <button 
            className={`nav-item ${activeSection === "exam" ? "active" : ""}`}
            onClick={() => setActiveSection("exam")}
          >
            <span className="nav-number">1</span>
            <span className="nav-text">Exam Details</span>
          </button>
          <button 
            className={`nav-item ${activeSection === "questions" ? "active" : ""}`}
            onClick={() => setActiveSection("questions")}
          >
            <span className="nav-number">2</span>
            <span className="nav-text">Questions</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Exam Section - UPDATED: Removed time inputs */}
          {activeSection === "exam" && (
            <div className="section-card">
              <div className="section-header">
                <div className="section-icon">📋</div>
                <h2 className="section-title">Exam Information</h2>
              </div>

              <div className="form-grid">
                <div className="input-group full-width">
                  <label className="input-label">
                    <span className="label-text">Exam Title</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Enter exam title..."
                    value={examData.title}
                    onChange={handleExamChange}
                    className="modern-input"
                    required
                  />
                </div>

                <div className="input-group full-width">
                  <label className="input-label">
                    <span className="label-text">Description</span>
                    <span className="required">*</span>
                  </label>
                  <textarea
                    name="description"
                    placeholder="Describe the exam purpose and scope..."
                    value={examData.description}
                    onChange={handleExamChange}
                    className="modern-textarea"
                    rows={3}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    <span className="label-text">Duration (minutes)</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    name="durationMinutes"
                    placeholder="e.g., 60"
                    value={examData.durationMinutes}
                    onChange={handleExamChange}
                    className="modern-input"
                    min="1"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    <span className="label-text">Course</span>
                    <span className="required">*</span>
                  </label>
                  <select
                    name="courseId"
                    value={examData.courseId}
                    onChange={handleExamChange}
                    className="modern-select"
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* REMOVED: Start Time and End Time inputs */}
              </div>

              <div className="section-actions">
                <button 
                  type="button" 
                  className="next-button"
                  onClick={() => setActiveSection("questions")}
                >
                  Continue to Questions
                  <span className="button-icon">→</span>
                </button>
              </div>
            </div>
          )}

          {/* Questions Section - NO CHANGES */}
          {activeSection === "questions" && (
            <div className="section-card">
              <div className="section-header">
                <div className="section-icon">❓</div>
                <div className="header-content">
                  <h2 className="section-title">Exam Questions</h2>
                  <p className="section-subtitle">Add questions with marks and correct answers</p>
                </div>
                <button
                  type="button"
                  className="add-question-btn"
                  onClick={addNewQuestion}
                >
                  <span className="btn-icon">+</span>
                  Add Question
                </button>
              </div>

              <div className="questions-container">
                {questions.map((q, index) => (
                  <div key={index} className="question-card">
                    <div className="question-header">
                      <div className="question-badge">
                        <span className="question-number">Q{index + 1}</span>
                        <span className="marks-badge">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                      </div>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          className="remove-question-btn"
                          onClick={() => removeQuestion(index)}
                        >
                          🗑️ Remove
                        </button>
                      )}
                    </div>

                    <div className="question-content">
                      <div className="input-group">
                        <label className="input-label">Question Text</label>
                        <textarea
                          placeholder="Enter your question here..."
                          value={q.questionText}
                          onChange={(e) => handleQuestionChange(index, "questionText", e.target.value)}
                          className="modern-textarea question-text"
                          rows={3}
                          required
                        />
                      </div>

                      <div className="question-details">
                        <div className="input-group">
                          <label className="input-label">Marks</label>
                          <input
                            type="number"
                            placeholder="Marks"
                            value={q.marks}
                            onChange={(e) => handleQuestionChange(index, "marks", parseInt(e.target.value) || 1)}
                            min="1"
                            className="modern-input marks-input"
                            required
                          />
                        </div>
                        
                        <div className="input-group">
                          <label className="input-label">Question Type</label>
                          <select className="modern-select" disabled>
                            <option value="MCQ">Multiple Choice (MCQ)</option>
                          </select>
                        </div>
                      </div>

                      <div className="input-group">
                        <label className="input-label">
                          Options
                          <span className="help-text">(comma separated)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Option 1, Option 2, Option 3, Option 4"
                          value={q.optionsText}
                          onChange={(e) => handleQuestionChange(index, "optionsText", e.target.value)}
                          className="modern-input"
                          required
                        />
                      </div>

                      <div className="input-group">
                        <label className="input-label">Correct Answer</label>
                        <input
                          type="text"
                          placeholder="Enter the exact correct option"
                          value={q.correctAnswer}
                          onChange={(e) => handleQuestionChange(index, "correctAnswer", e.target.value)}
                          className="modern-input correct-answer-input"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="section-actions dual-buttons">
                <button 
                  type="button" 
                  className="back-button"
                  onClick={() => setActiveSection("exam")}
                >
                  <span className="button-icon">←</span>
                  Back to Exam Details
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`submit-button ${loading ? 'loading' : ''}`}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Creating Exam...
                    </>
                  ) : (
                    <>
                      🚀 Create Exam & Questions
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Messages */}
        {message && (
          <div className={`message ${message.includes("❌") ? 'error' : 'success'}`}>
            <div className="message-content">
              <span className="message-icon">
                {message.includes("❌") ? "❌" : "✅"}
              </span>
              {message.replace("❌", "").replace("✅", "")}
            </div>
          </div>
        )}

        {examCreated && (
          <div className="success-card">
            <div className="success-header">
              <div className="success-icon">🎉</div>
              <h3>Exam Created Successfully!</h3>
            </div>
            <div className="success-details">
              <div className="detail-item">
                <span className="detail-label">Exam ID:</span>
                <span className="detail-value">{examCreated.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Title:</span>
                <span className="detail-value">{examCreated.title}</span>
              </div>
              
            </div>
          </div>
        )}
      </div>

      {/* CSS STYLES - NO CHANGES */}
      <style jsx>{`
        .form-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          padding: 20px 8px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 30px 15px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          width: 100%;
          max-width: 95%;
          margin: 10px 0;
        }

        .header-section {
          text-align: center;
          margin-bottom: 30px;
          padding: 0 5px;
        }

        .icon-wrapper {
          display: inline-flex;
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .form-icon {
          font-size: 2rem;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
        }

        .form-title {
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0 0 6px 0;
        }

        .form-subtitle {
          color: #6b7280;
          font-size: 1rem;
          margin: 0;
        }

        .progress-nav {
          display: flex;
          justify-content: center;
          margin-bottom: 30px;
          gap: 6px;
          padding: 0 5px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border: none;
          background: #f8fafc;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .nav-item.active {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
        }

        .nav-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #e5e7eb;
          font-weight: 700;
          font-size: 0.8rem;
          transition: all 0.3s ease;
        }

        .nav-item.active .nav-number {
          background: rgba(255, 255, 255, 0.3);
        }

        .section-card {
          background: white;
          border-radius: 14px;
          padding: 24px 18px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          border: 1px solid #f1f5f9;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }

        .section-icon {
          font-size: 1.6rem;
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          border-radius: 10px;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .header-content {
          flex: 1;
        }

        .section-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .section-subtitle {
          color: #6b7280;
          margin: 0;
          font-size: 0.9rem;
        }

        .add-question-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
          font-size: 0.85rem;
          white-space: nowrap;
        }

        .add-question-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .input-group {
          display: flex;
          flex-direction: column;
        }

        .input-label {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 6px;
          font-weight: 600;
          color: #374151;
          font-size: 0.85rem;
        }

        .required {
          color: #ef4444;
        }

        .help-text {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: normal;
          margin-left: 4px;
        }

        .modern-input, .modern-select, .modern-textarea {
          padding: 10px 12px;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          background: white;
        }

        .modern-input:focus, .modern-select:focus, .modern-textarea:focus {
          outline: none;
          border-color: #0ea5e9;
          box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1);
        }

        .modern-textarea {
          resize: vertical;
          min-height: 70px;
        }

        .questions-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .question-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .question-card:hover {
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .question-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .question-number {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: white;
          padding: 5px 12px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 0.75rem;
        }

        .marks-badge {
          background: #f59e0b;
          color: white;
          padding: 4px 8px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.7rem;
        }

        .remove-question-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-question-btn:hover {
          background: #dc2626;
          transform: scale(1.02);
        }

        .question-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .question-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .marks-input {
          max-width: 100px;
        }

        .correct-answer-input {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .section-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .dual-buttons {
          justify-content: space-between;
        }

        .next-button, .back-button, .submit-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .next-button {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: white;
          box-shadow: 0 2px 10px rgba(14, 165, 233, 0.3);
        }

        .next-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
        }

        .back-button {
          background: #6b7280;
          color: white;
        }

        .back-button:hover {
          background: #4b5563;
          transform: translateY(-1px);
        }

        .submit-button {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
        }

        .submit-button:hover:not(.loading) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .submit-button.loading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .button-icon {
          font-weight: 700;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .message {
          margin-top: 16px;
          padding: 12px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .message.success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .message.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .message-content {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .success-card {
          margin-top: 16px;
          background: linear-gradient(135deg, #dbeafe, #e0e7ff);
          border-radius: 12px;
          padding: 18px;
          border: 1px solid #bfdbfe;
        }

        .success-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .success-icon {
          font-size: 1.2rem;
        }

        .success-header h3 {
          margin: 0;
          color: #1e40af;
          font-size: 1rem;
        }

        .success-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-item {
          display: flex;
          gap: 8px;
        }

        .detail-label {
          font-weight: 600;
          color: #374151;
          min-width: 60px;
          font-size: 0.8rem;
        }

        .detail-value {
          color: #1e40af;
          font-weight: 600;
          font-size: 0.8rem;
        }

        @media (max-width: 768px) {
          .form-container {
            padding: 10px 4px;
          }

          .glass-card {
            padding: 20px 10px;
            margin: 5px 0;
            max-width: 98%;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .question-details {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .progress-nav {
            flex-direction: column;
            padding: 0 2px;
            gap: 4px;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .dual-buttons {
            flex-direction: column;
            gap: 8px;
          }

          .back-button, .submit-button {
            width: 100%;
            justify-content: center;
          }

          .form-title {
            font-size: 1.6rem;
          }

          .section-card {
            padding: 18px 12px;
          }
        }

        @media (max-width: 480px) {
          .glass-card {
            padding: 16px 8px;
            border-radius: 12px;
          }

          .form-title {
            font-size: 1.4rem;
          }

          .section-card {
            padding: 14px 8px;
          }

          .question-card {
            padding: 14px;
          }
        }
      `}</style>
    </div>
  );
}