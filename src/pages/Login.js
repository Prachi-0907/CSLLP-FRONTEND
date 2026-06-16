import React, { useState } from 'react';
import { authLogin, forgotPassword, verifyOtp, resetPassword, saveUserToStorage } from '../services/api'; 

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  async function submit(e) {
    e.preventDefault(); 
    setError(null);
    setIsLoading(true);

    try {
      const res = await authLogin({ email, password, role });
      
      console.log("Login Response : ", res);
      if(!res.success) {
        setError(res.message || "Login failed");
        return;
      }
      localStorage.setItem("token", res.data.token);
      saveUserToStorage(res.data.user);
      onLogin(res.data.user);
    } catch (err) {
      console.log(err);
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
    
    // try {
    //   const res = await authLogin({ email, password, role });
    //   if (!res.ok) {
    //     setError(res.body && res.body.message ? res.body.message : 'Login failed');
    //     return;
    //   }
    //   onLogin(res.body.data);
    // } catch (err) {
    //   setError('An unexpected error occurred. Please try again.');
    // } finally {
    //   setIsLoading(false);
    // }
  }

  // Forgot Password Functions
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');
    setError('');

    try {
      const res = await forgotPassword(email);
      if (res.success) {
        setForgotPasswordStep(2);
        setForgotPasswordMessage('OTP sent to your email');
      } else {
        setError(res.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');
    setError('');

    try {
      const res = await verifyOtp(email, otp);
      if (res.success) {
        setForgotPasswordStep(3);
        setForgotPasswordMessage('OTP verified successfully');
      } else {
        setError(res.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');
    setError('');

    try {
      const res = await resetPassword(email, otp, newPassword);
      if (res.success) {
        setForgotPasswordMessage('Password reset successfully! You can now login with your new password.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotPasswordStep(1);
          setOtp('');
          setNewPassword('');
        }, 3000);
      } else {
        setError(res.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep(1);
    setOtp('');
    setNewPassword('');
    setForgotPasswordMessage('');
    setError('');
  };

  return (
    <div style={styles.loginContainer}>
      {/* Brand Section */}
      <div style={styles.brandSection}>
        <div style={styles.brandContent}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>CS</div>
            <span>CSLLP Platform</span>
          </div>
          <p style={styles.tagline}>
            Empowering organizations with comprehensive employee evaluation, learning, and performance tracking.
          </p>
          
          <div style={styles.features}>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>📚</div>
              <div style={styles.featureText}>
                <div style={styles.featureTitle}>Learning Materials</div>
                <div>Access comprehensive study materials and resources</div>
              </div>
            </div>
            
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>🔒</div>
              <div style={styles.featureText}>
                <div style={styles.featureTitle}>Secure Evaluations</div>
                <div>Take secure exams with advanced proficiency</div>
              </div>
            </div>
            
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>📊</div>
              <div style={styles.featureText}>
                <div style={styles.featureTitle}>Performance Analytics</div>
                <div>Track progress with default reports and insights</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div style={styles.formSection}>
        <div style={styles.formContainer}>
          {!showForgotPassword ? (
            // LOGIN FORM
            <>
              <h2 style={styles.welcomeTitle}>Welcome Back</h2>
              <p style={styles.welcomeText}>
                Sign in to access your account. Only registered users can login.
              </p>
              
              <form onSubmit={submit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input 
                    style={styles.input}
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Password</label>
                  <input 
                    style={styles.input}
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Role</label>
                  <select 
                    style={styles.select}
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    required
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  style={{
                    ...styles.button,
                    ...(isLoading ? styles.buttonLoading : {})
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Login'}
                </button>
                
                {error && <div style={styles.errorMessage}>{error}</div>}
              </form>
              
              {/* Forgot Password Link */}
              <div style={styles.forgotPasswordContainer}>
                <button 
                  onClick={() => setShowForgotPassword(true)}
                  style={styles.forgotPasswordLink}
                >
                  Forgot your password?
                </button>
              </div>
              
              <p style={styles.adminContact}>
                Don't have an account? <a href="#contact" style={styles.contactLink}>Contact your administrator</a>
              </p>
            </>
          ) : (
            // FORGOT PASSWORD FORM
            <>
              <h2 style={styles.welcomeTitle}>
                {forgotPasswordStep === 1 && 'Reset Your Password'}
                {forgotPasswordStep === 2 && 'Enter OTP'}
                {forgotPasswordStep === 3 && 'Set New Password'}
              </h2>
              
              <p style={styles.welcomeText}>
                {forgotPasswordStep === 1 && 'Enter your email to receive a verification code'}
                {forgotPasswordStep === 2 && `Enter the 6-digit code sent to ${email}`}
                {forgotPasswordStep === 3 && 'Create your new password'}
              </p>

              {forgotPasswordMessage && (
                <div style={styles.successMessage}>{forgotPasswordMessage}</div>
              )}

              {error && <div style={styles.errorMessage}>{error}</div>}

              <form onSubmit={
                forgotPasswordStep === 1 ? handleForgotPassword :
                forgotPasswordStep === 2 ? handleVerifyOtp :
                handleResetPassword
              } style={styles.form}>
                
                {/* Step 1: Email */}
                {forgotPasswordStep === 1 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email Address</label>
                    <input 
                      style={styles.input}
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      required
                    />
                  </div>
                )}

                {/* Step 2: OTP */}
                {forgotPasswordStep === 2 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Verification Code</label>
                    <input 
                      style={styles.input}
                      type="text" 
                      value={otp} 
                      onChange={e => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                      required
                    />
                    <div style={styles.otpHint}>
                      Check your email for the 6-digit code
                    </div>
                  </div>
                )}

                {/* Step 3: New Password */}
                {forgotPasswordStep === 3 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>New Password</label>
                    <input 
                      style={styles.input}
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 6 characters)"
                      minLength="6"
                      required
                    />
                  </div>
                )}

                <div style={styles.forgotPasswordActions}>
                  <button 
                    type="submit" 
                    style={{
                      ...styles.button,
                      ...(forgotPasswordLoading ? styles.buttonLoading : {})
                    }}
                    disabled={forgotPasswordLoading}
                  >
                    {forgotPasswordLoading ? (
                      'Processing...'
                    ) : (
                      forgotPasswordStep === 1 ? 'Send OTP' :
                      forgotPasswordStep === 2 ? 'Verify OTP' :
                      'Reset Password'
                    )}
                  </button>

                  <button 
                    type="button"
                    onClick={handleBackToLogin}
                    style={styles.backButton}
                  >
                    Back to Login
                  </button>
                </div>
              </form>

              {/* Progress Steps */}
              <div style={styles.progressSteps}>
                <div style={{
                  ...styles.progressStep,
                  ...(forgotPasswordStep >= 1 ? styles.progressStepActive : {})
                }}>
                  <div style={styles.stepNumber}>1</div>
                  <div style={styles.stepLabel}>Email</div>
                </div>
                <div style={styles.progressLine}></div>
                <div style={{
                  ...styles.progressStep,
                  ...(forgotPasswordStep >= 2 ? styles.progressStepActive : {})
                }}>
                  <div style={styles.stepNumber}>2</div>
                  <div style={styles.stepLabel}>OTP</div>
                </div>
                <div style={styles.progressLine}></div>
                <div style={{
                  ...styles.progressStep,
                  ...(forgotPasswordStep >= 3 ? styles.progressStepActive : {})
                }}>
                  <div style={styles.stepNumber}>3</div>
                  <div style={styles.stepLabel}>Password</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline styles for professional appearance
const styles = {
  loginContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f7f9',
  },
  
  // Brand Section Styles
  brandSection: {
    flex: 1,
    background: 'linear-gradient(135deg, #1a56db 0%, #0a36a9 100%)',
    color: 'white',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  
  brandContent: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  
  logo: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
  },
  
  logoIcon: {
    background: 'rgba(255, 255, 255, 0.2)',
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '15px',
    fontWeight: '600',
  },
  
  tagline: {
    fontSize: '18px',
    marginBottom: '40px',
    opacity: '0.9',
    lineHeight: '1.5',
  },
  
  features: {
    marginTop: '40px',
  },
  
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '25px',
  },
  
  featureIcon: {
    background: 'rgba(255, 255, 255, 0.15)',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '15px',
    fontSize: '18px',
  },
  
  featureText: {
    flex: 1,
  },
  
  featureTitle: {
    fontWeight: '600',
    marginBottom: '5px',
  },
  
  // Form Section Styles
  formSection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  
  formContainer: {
    width: '100%',
    maxWidth: '450px',
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 5px 20px rgba(0, 0, 0, 0.05)',
  },
  
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '10px',
    color: '#1a56db',
  },
  
  welcomeText: {
    color: '#6b7280',
    marginBottom: '30px',
    lineHeight: '1.5',
  },
  
  form: {
    width: '100%',
  },
  
  formGroup: {
    marginBottom: '20px',
  },
  
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#374151',
    fontSize: '14px',
  },
  
  input: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
  },
  
  select: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
    backgroundColor: 'white',
  },
  
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#1a56db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '10px',
  },
  
  buttonLoading: {
    opacity: '0.7',
    cursor: 'not-allowed',
  },
  
  errorMessage: {
    color: '#e11d48',
    textAlign: 'center',
    marginTop: '15px',
    padding: '12px',
    backgroundColor: 'rgba(225, 29, 72, 0.05)',
    borderRadius: '6px',
    borderLeft: '4px solid #e11d48',
    fontSize: '14px',
  },
  
  successMessage: {
    color: '#059669',
    textAlign: 'center',
    marginTop: '15px',
    padding: '12px',
    backgroundColor: 'rgba(5, 150, 105, 0.05)',
    borderRadius: '6px',
    borderLeft: '4px solid #059669',
    fontSize: '14px',
  },
  
  // Forgot Password Styles
  forgotPasswordContainer: {
    textAlign: 'center',
    marginTop: '20px',
    marginBottom: '20px',
  },
  
  forgotPasswordLink: {
    background: 'none',
    border: 'none',
    color: '#1a56db',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: 'inherit',
  },
  
  forgotPasswordActions: {
    marginTop: '20px',
  },
  
  backButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '10px',
  },
  
  otpHint: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '5px',
  },
  
  // Progress Steps
  progressSteps: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '30px',
    padding: '20px 0',
  },
  
  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'all 0.3s',
  },
  
  progressStepActive: {
    color: '#1a56db',
  },
  
  stepNumber: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '5px',
    transition: 'all 0.3s',
  },
  
  progressStepActive_stepNumber: {
    backgroundColor: '#1a56db',
    color: 'white',
  },
  
  stepLabel: {
    fontSize: '12px',
    fontWeight: '500',
  },
  
  progressLine: {
    width: '40px',
    height: '2px',
    backgroundColor: '#e5e7eb',
    margin: '0 10px',
    marginBottom: '15px',
  },
  
  adminContact: {
    textAlign: 'center',
    marginTop: '25px',
    color: '#6b7280',
    fontSize: '14px',
  },
  
  contactLink: {
    color: '#1a56db',
    textDecoration: 'none',
    fontWeight: '500',
  },
  
  // Responsive styles
  '@media (max-width: 900px)': {
    loginContainer: {
      flexDirection: 'column',
    },
    
    brandSection: {
      padding: '30px 20px',
    },
    
    formSection: {
      padding: '30px 20px',
    },
    
    formContainer: {
      padding: '30px',
    },
  },
};