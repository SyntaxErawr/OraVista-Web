import PatientDialog from "../../components/PatientDialog";
import AuthIntro from "../../components/AuthIntro";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, CheckCircle2, X, Square, CheckSquare, ShieldCheck } from "lucide-react";
import loginBg from "../../assets/BG_LOGINPAGE.jpg";
import { API_BASE_URL } from "../../config/api";

function LoginPage() {
  const navigate = useNavigate();
  const brandBlue = "#087F8C";

  // --- LOGIN STATES ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [fullUser, setFullUser] = useState(null);

  // --- LOGIN OTP STATES (NEW 2FA FEATURE) ---
  const [showLoginOtpModal, setShowLoginOtpModal] = useState(false);
  const [loginOtpInput, setLoginOtpInput] = useState("");
  const [loginOtpSent, setLoginOtpSent] = useState("");
  const [loginOtpMessage, setLoginOtpMessage] = useState("");
  const [isLoginOtpLoading, setIsLoginOtpLoading] = useState(false);

  // --- FORGOT PASSWORD STATES ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpSent, setOtpSent] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpStep, setOtpStep] = useState("email");
  const [otpMessage, setOtpMessage] = useState("");
  const [isOtpLoading, setIsOtpLoading] = useState(false);

  // --- RESET PASSWORD STATES ---
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // --- FEEDBACK MODAL STATE ---
  const [feedbackModal, setFeedbackModal] = useState({ show: false, message: "", type: "error" });

  const [passwordCriteria, setPasswordCriteria] = useState({
    lower: false,
    upper: false,
    number: false,
    special: false,
    length: false
  });

  // --- TIMERS ---
  useEffect(() => {
    let interval;
    if (isLocked && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isLocked) {
      setIsLocked(false);
      setAttempts(0);
      setStatusMessage("");
      setErrors({ email: "", password: "" });
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isLocked, timer]);

  // --- REAL-TIME PASSWORD VALIDATION ---
  useEffect(() => {
    setPasswordCriteria({
      lower: /[a-z]/.test(newPassword),
      upper: /[A-Z]/.test(newPassword),
      number: /\d/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      length: newPassword.length >= 8,
    });
  }, [newPassword]);

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  // --- HELPER: SHOW FEEDBACK MODAL ---
  const showFeedback = (message, type = "error") => {
    setFeedbackModal({ show: true, message, type });
  };

  const closeFeedback = () => {
    setFeedbackModal({ ...feedbackModal, show: false });
    if (feedbackModal.type === "success" && feedbackModal.message.includes("updated")) {
      setShowResetModal(false);
      setForgotEmail("");
      setNewPassword("");
      setConfirmNewPassword("");
      setOtpStep("email");
    }
  };

  // --- 2FA LOGIN OTP FUNCTIONS (NEW) ---
  const sendLoginOTP = async (userEmail) => {
    if (isLoginOtpLoading) return;
    setLoginOtpSent("");
    setLoginOtpInput("");
    setIsLoginOtpLoading(true);
    setLoginOtpMessage("");
    setShowLoginOtpModal(true); // Show modal immediately while loading

    try {
      const response = await fetch(`${API_BASE_URL}/api/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, action: "login" }) // <--- ADDED ACTION TAG HERE
      });

      const data = await response.json();

      if (response.ok && /^\d{6}$/.test(String(data.generatedOtp || ""))) {
        setLoginOtpSent(String(data.generatedOtp || ""));
        setLoginOtpMessage("Security code sent! Please check your email.");
      } else {
        setLoginOtpMessage(data.message || "Failed to send verification code.");
      }
    } catch (err) {
      setLoginOtpMessage("Failed to connect to server.");
    } finally {
      setIsLoginOtpLoading(false);
    }
  };

  const verifyLoginOTP = () => {
    if (!isLoginOtpLoading && /^\d{6}$/.test(loginOtpInput) && loginOtpInput === loginOtpSent) {
      // If correct, hide OTP modal and show the final Success modal
      setShowLoginOtpModal(false);
      setShowSuccessModal(true);
      setLoginOtpMessage("");
      setLoginOtpInput("");
    } else {
      setLoginOtpMessage("Invalid code. Please try again.");
    }
  };

  // --- LOGIN FUNCTION ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    const newErrors = {
      email: !email.trim() ? "Email is required." : "",
      password: !password.trim() ? "Password is required." : "",
    };

    setErrors(newErrors);

    if (newErrors.email || newErrors.password) {
      setStatusMessage("");
      return;
    }

    setStatusMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Credentials are correct! Save the user data, but DON'T log them in yet.
        setFullUser(data.user);
        // Trigger the 2FA OTP instead of showing success modal
        sendLoginOTP(data.user.email);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3) {
          setIsLocked(true);
          setTimer(60);
          setStatusMessage("Too many failed attempts. Locked for 1 minute.");
        } else {
          setStatusMessage(`Incorrect information. ${3 - newAttempts} attempts remaining.`);
        }
      }
    } catch (err) {
      setStatusMessage("Server error. Ensure your Node backend is running.");
    }
  };

  const handleProceed = () => {
    const branch = localStorage.getItem("tempBranch");
    localStorage.setItem(
      "user",
      JSON.stringify({
        loggedIn: true,
        ...fullUser,
        selectedBranch: branch,
      }),
    );
    localStorage.removeItem("tempBranch");
    navigate("/dashboard");
    window.location.reload();
  };

  // --- FORGOT PASSWORD FUNCTIONS ---
  const sendOTP = async (e) => {
    e.preventDefault();
    if (isOtpLoading) return;
    setOtpSent("");
    setOtpInput("");
    if (!forgotEmail) {
      setOtpMessage("Please enter your email.");
      return;
    }

    setIsOtpLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, action: "forgot_password" }) // <--- ADDED ACTION TAG HERE
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(String(data.generatedOtp || ""));
        setOtpStep("verify");
        setOtpMessage("Code sent! Check your email.");
      } else {
        setOtpMessage(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      setOtpMessage("Failed to process request. Ensure backend is running.");
    } finally {
      setIsOtpLoading(false);
    }
  };

  const verifyOTP = () => {
    if (!isOtpLoading && /^\d{6}$/.test(otpInput) && otpInput === otpSent) {
      setShowForgotModal(false);
      setShowResetModal(true);
      setOtpMessage("");
      setOtpInput("");
    } else {
      setOtpMessage("Invalid code. Please try again.");
    }
  };

  const handlePasswordReset = async () => {
    if (!isPasswordValid) {
      showFeedback("Password does not meet all requirements.", "error");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showFeedback("Passwords do not match.", "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/reset-password-by-email`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, newPassword: newPassword }),
      });

      if (response.ok) {
        showFeedback("Password updated successfully! You can now login.", "success");
      } else {
        const data = await response.json();
        showFeedback(data.message || "Failed to update password.", "error");
      }
    } catch (error) {
      showFeedback("Server error. Check backend connection.", "error");
    }
  };

  // --- STYLES ---
  const labelStyle = { display: "block", fontWeight: "700", fontSize: "14px", marginBottom: "8px", textAlign: "left", color: brandBlue };
  const inputStyle = (error) => ({
    width: "100%", padding: "12px 15px", borderRadius: "8px", border: error ? "2px solid red" : "1px solid #ddd",
    fontSize: "14px", boxSizing: "border-box", fontFamily: "'Manrope', sans-serif", outline: "none", backgroundColor: isLocked ? "#f0f0f0" : "#fff",
  });
  const errorTextStyle = { color: "red", fontSize: "11px", display: "block", textAlign: "left", marginTop: "4px", fontWeight: "600" };
  
  const modalOverlayStyle = {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, backdropFilter: "blur(5px)",
    padding: "20px", boxSizing: "border-box"
  };

  const RequirementItem = ({ met, label }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: met ? "#28a745" : "#ff4d4d", marginBottom: "5px" }}>
      {met ? <CheckSquare size={16} /> : <Square size={16} />}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="ov-auth-page" style={{ backgroundImage: `url(${loginBg})`, backgroundSize: "cover", backgroundPosition: "center", height: "100vh", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "'Manrope', sans-serif", position: "relative", padding: "20px", boxSizing: "border-box" }}>
      <AuthIntro />

      <style>
        {`
          .responsive-login-box {
            background-color: rgba(255, 255, 255, 0.96);
            padding: 40px 45px;
            border-radius: 30px;
            width: 100%;
            max-width: 450px;
            text-align: center;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            box-sizing: border-box;
          }

          .responsive-modal-box {
            background-color: white;
            padding: 40px;
            border-radius: 25px;
            text-align: center;
            max-width: 450px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            position: relative;
            box-sizing: border-box;
          }

          .criteria-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            text-align: left;
            margin-bottom: 25px;
          }

          .login-title {
            color: ${brandBlue};
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 25px;
          }

          @media (max-width: 480px) {
            .responsive-login-box {
              padding: 30px 20px !important;
            }
            .responsive-modal-box {
              padding: 30px 20px !important;
            }
            .criteria-grid {
              grid-template-columns: 1fr !important;
            }
            .login-title {
              font-size: 26px !important;
            }
          }
        `}
      </style>

      {/* 2FA LOGIN VERIFICATION MODAL (NEW) */}
      {showLoginOtpModal && (
        <PatientDialog onClose={() => setShowLoginOtpModal(false)} style={modalOverlayStyle}>
          <div className="responsive-modal-box">
            <button type="button" className="ov-ui-button" aria-label="Close dialog" onClick={() => setShowLoginOtpModal(false)} style={{ position: "absolute", right: "20px", top: "20px", cursor: "pointer", color: "#999" }}><X size={24} aria-hidden="true" /></button>

            <div style={{ backgroundColor: "#E4F7F9", width: "60px", height: "60px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", margin: "0 auto 15px" }}>
              <ShieldCheck size={32} color={brandBlue} />
            </div>

            <h2 style={{ color: brandBlue, fontWeight: "800", marginBottom: "10px" }}>2-Step Verification</h2>
            <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
              {isLoginOtpLoading
                ? "Requesting your verification code. Please wait."
                : loginOtpSent
                  ? "A verification code was sent to your email. Enter it below to complete login."
                  : "We couldn't send your verification code. Try Resend Code. If this continues, contact the clinic for help."}
            </p>

            <input aria-label="Enter 6-digit code"
              type="text"
              placeholder="Enter 6-digit code"
              value={loginOtpInput}
              onChange={(e) => setLoginOtpInput(e.target.value)}
              style={{ ...inputStyle(false), marginBottom: "15px", letterSpacing: "5px", textAlign: "center", fontSize: "18px" }}
              maxLength="6"
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={isLoginOtpLoading || !loginOtpSent}
            />

            <button
              onClick={verifyLoginOTP}
              disabled={isLoginOtpLoading || !loginOtpSent || !/^\d{6}$/.test(loginOtpInput)}
              style={{ "--ov-on-color": "var(--ov-ink)", width: "100%", padding: "12px", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", opacity: isLoginOtpLoading ? 0.7 : 1 }}
            >
              {isLoginOtpLoading ? "Sending Code..." : "Verify & Login"}
            </button>

            <button className="ov-ui-button" disabled={isLoginOtpLoading} onClick={() => sendLoginOTP(fullUser.email)} style={{ marginTop: "15px", fontSize: "12px", color: brandBlue, cursor: "pointer", textDecoration: "underline" }} type="button">
              Resend Code
            </button>

            {loginOtpMessage && <p role={loginOtpSent ? "status" : "alert"} style={{ color: loginOtpSent ? "green" : "red", fontSize: "12px", marginTop: "10px", fontWeight: "600" }}>{loginOtpMessage}</p>}
          </div>
        </PatientDialog>
      )}

      {/* SUCCESS MODAL (LOGIN) */}
      {showSuccessModal && (
        <PatientDialog style={modalOverlayStyle}>
          <div className="responsive-modal-box">
            <div style={{ backgroundColor: "#e6f4ea", width: "70px", height: "70px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", margin: "0 auto 20px" }}>
              <CheckCircle2 size={40} color="#28a745" />
            </div>
            <h2 style={{ color: brandBlue, fontWeight: "800" }}>Welcome Back!</h2>
            <p style={{ color: "#555", marginBottom: "25px" }}>Successfully verified and logged in as {fullUser?.firstName} {fullUser?.lastName}.</p>
            <button onClick={handleProceed} style={{ "--ov-on-color": "var(--ov-ink)", width: "100%", padding: "14px", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>
              PROCEED TO ORAVISTA
            </button>
          </div>
        </PatientDialog>
      )}

      {/* FEEDBACK POPUP MODAL (Replaces Alerts) */}
      {feedbackModal.show && (
        <PatientDialog onClose={closeFeedback} style={{ ...modalOverlayStyle, zIndex: 3000 }}>
          <div className="responsive-modal-box" style={{ maxWidth: "350px" }}>
            <div style={{
              backgroundColor: feedbackModal.type === "success" ? "#e6f4ea" : "#fdecea",
              width: "60px", height: "60px", borderRadius: "50%",
              display: "flex", justifyContent: "center", alignItems: "center", margin: "0 auto 15px"
            }}>
              {feedbackModal.type === "success" ? <CheckCircle2 size={32} color="#28a745" /> : <AlertCircle size={32} color="#ff4d4d" />}
            </div>
            <h3 style={{ color: brandBlue, fontWeight: "800", marginBottom: "10px" }}>
              {feedbackModal.type === "success" ? "Success!" : "Attention"}
            </h3>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>{feedbackModal.message}</p>
            <button onClick={closeFeedback} style={{ "--ov-on-color": "var(--ov-ink)", width: "100%", padding: "12px", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>
              Okay
            </button>
          </div>
        </PatientDialog>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <PatientDialog onClose={() => { setShowForgotModal(false); setOtpStep("email"); setOtpMessage(""); }} style={modalOverlayStyle}>
          <div className="responsive-modal-box">
            <button type="button" className="ov-ui-button" aria-label="Close dialog" onClick={() => { setShowForgotModal(false); setOtpStep("email"); setOtpMessage(""); }} style={{ position: "absolute", right: "20px", top: "20px", cursor: "pointer", color: "#999" }}><X size={24} aria-hidden="true" /></button>
            <h2 style={{ color: brandBlue, fontWeight: "800", marginBottom: "10px" }}>Forgot Password?</h2>
            <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
              {otpStep === "email" ? "Enter your email to receive a verification code." : "Enter the code sent to your email."}
            </p>

            {otpStep === "email" ? (
              <>
                <input aria-label="Enter your email"
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{ ...inputStyle(false), marginBottom: "15px" }}
                />
                <button onClick={sendOTP} disabled={isOtpLoading} style={{ "--ov-on-color": "var(--ov-ink)", width: "100%", padding: "12px", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", opacity: isOtpLoading ? 0.7 : 1 }}>
                  {isOtpLoading ? "Sending..." : "Send Code"}
                </button>
              </>
            ) : (
              <>
                <input aria-label="Enter 6-digit code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  style={{ ...inputStyle(false), marginBottom: "15px", letterSpacing: "5px", textAlign: "center", fontSize: "18px" }}
                  maxLength="6"
                />
                <button onClick={verifyOTP} style={{ width: "100%", padding: "12px", backgroundColor: "#28a745", color: "var(--ov-on-color, #fff)", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>
                  Verify Code
                </button>
                <button type="button" className="ov-ui-button" onClick={() => setOtpStep("email")} style={{ marginTop: "15px", fontSize: "12px", color: brandBlue, cursor: "pointer", textDecoration: "underline" }}>
                  Resend Code
                </button>
              </>
            )}
            {otpMessage && <p style={{ color: otpMessage.includes("sent") ? "green" : "red", fontSize: "12px", marginTop: "10px", fontWeight: "600" }}>{otpMessage}</p>}
          </div>
        </PatientDialog>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && (
        <PatientDialog onClose={() => setShowResetModal(false)} style={modalOverlayStyle}>
          <div className="responsive-modal-box">
            <button type="button" className="ov-ui-button" aria-label="Close dialog" onClick={() => setShowResetModal(false)} style={{ position: "absolute", right: "20px", top: "20px", cursor: "pointer", color: "#999" }}><X size={24} aria-hidden="true" /></button>
            <h2 style={{ color: brandBlue, fontWeight: "800", marginBottom: "20px" }}>Reset Password</h2>

            <div style={{ marginBottom: "15px", textAlign: "left" }}>
              <label style={labelStyle}>New Password</label>
              <div style={{ position: "relative" }}>
                <input aria-label="Enter new password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle(false)}
                  placeholder="Enter new password"
                />
                <button className="ov-ui-button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: "absolute", right: "15px", top: "12px", cursor: "pointer", color: brandBlue }} type="button" aria-label="Show or hide password">
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "20px", textAlign: "left" }}>
              <label style={labelStyle}>Confirm Password</label>
              <input aria-label="Confirm new password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                style={inputStyle(false)}
                placeholder="Confirm new password"
              />
            </div>

            {/* REAL TIME CONDITIONS GRID */}
            <div className="criteria-grid">
              <RequirementItem met={passwordCriteria.lower} label="One lowercase" />
              <RequirementItem met={passwordCriteria.upper} label="One uppercase" />
              <RequirementItem met={passwordCriteria.number} label="One number" />
              <RequirementItem met={passwordCriteria.special} label="One special character" />
              <RequirementItem met={passwordCriteria.length} label="8 characters minimum" />
            </div>

            <button
              onClick={handlePasswordReset}
              style={{ "--ov-on-color": "var(--ov-ink)", width: "100%", padding: "12px", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", opacity: !isPasswordValid ? 0.7 : 1 }}
            >
              Change Password
            </button>
          </div>
        </PatientDialog>
      )}

      {/* MAIN LOGIN FORM */}
      <div className="responsive-login-box">
        <h2 className="login-title">Welcome back</h2>
        <p className="ov-login-subtitle">Sign in to take care of your smile.</p>
        <form onSubmit={handleLogin} noValidate>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Email Address</label>
            <input aria-label="Enter your email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
              style={inputStyle(errors.email)}
              disabled={isLocked}
              placeholder="Enter your email"
            />
            {errors.email && <span style={errorTextStyle}>{errors.email}</span>}
          </div>

          <div style={{ marginBottom: "10px", position: "relative" }}>
            <label style={labelStyle}>Password</label>
            <input aria-label="Enter your password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
              style={{ ...inputStyle(errors.password), paddingRight: "45px" }}
              disabled={isLocked}
              placeholder="Enter your password"
            />
            {!isLocked && (
              <button className="ov-ui-button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "15px", top: "38px", cursor: "pointer", color: brandBlue }} type="button" aria-label="Show or hide password">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
            {errors.password && <span style={errorTextStyle}>{errors.password}</span>}
          </div>

          <div style={{ textAlign: "right", marginBottom: "25px" }}>
            <button type="button" className="ov-ui-button" onClick={() => setShowForgotModal(true)} style={{ color: brandBlue, fontSize: "13px", textDecoration: "none", fontWeight: "600", cursor: "pointer" }}>
              Forgot Password?
            </button>
          </div>

          {statusMessage && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", color: "red", fontSize: "14px", marginBottom: "15px", fontWeight: "600" }}>
              <AlertCircle size={16} />
              {isLocked ? `${statusMessage} (${timer}s)` : statusMessage}
            </div>
          )}

          <button type="submit" disabled={isLocked} style={{ "--ov-on-color": "var(--ov-ink)", width: "100%", padding: "14px", backgroundColor: isLocked ? "#ccc" : "var(--ov-primary)", color: "var(--ov-on-color, #fff)", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "16px", cursor: isLocked ? "not-allowed" : "pointer", transition: "background-color 0.3s ease" }}>
            {isLocked ? `LOCKED (${timer}s)` : "LOGIN"}
          </button>
        </form>

        <p style={{ marginTop: "25px", fontSize: "14px", color: "#666" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: brandBlue, textDecoration: "none", fontWeight: "700" }}>
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
