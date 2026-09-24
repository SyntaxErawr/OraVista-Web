import AuthIntro from "../../components/AuthIntro";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, Square, CheckSquare } from "lucide-react";
import signupBg from "../../assets/BG_LOGINPAGE.jpg";

function SignupPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const brandBlue = "#087F8C";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const passwordRequirements = [
    { label: "One lowercase", regex: /[a-z]/ },
    { label: "One uppercase", regex: /[A-Z]/ },
    { label: "One number", regex: /[0-9]/ },
    {
      label: "One special character",
      regex: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/,
    },
    { label: "8 characters minimum", regex: /.{8,}/ },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "firstName" || name === "lastName") {
      const letterOnlyRegex = /^[a-zA-Z\s]*$/;
      let errorMsg = "";

      if (!letterOnlyRegex.test(value)) {
        errorMsg = "Only letters allowed (no numbers or symbols).";
      } else if (value.length >= 20) {
        errorMsg = "Maximum of 20 characters reached.";
      }

      setErrors((prev) => ({ ...prev, [name]: errorMsg }));

      if (value.length <= 20) {
        const filteredValue = value.replace(/[^a-zA-Z\s]/g, "");
        setFormData((prev) => ({ ...prev, [name]: filteredValue }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      let errorMsg = "";
      if (value !== "") {
        if (!value.toLowerCase().endsWith("@gmail.com")) {
          errorMsg = "Incorrect email format";
        }
      }
      setErrors((prev) => ({ ...prev, email: errorMsg }));
    }

    if (name === "confirmPassword" || name === "password") {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitError("");

    const newErrors = {};

    Object.keys(formData).forEach((key) => {
      if (!formData[key].trim()) {
        newErrors[key] = "This field is required.";
      }
    });

    if (
      formData.password !== formData.confirmPassword &&
      formData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    const allRequirementsMet = passwordRequirements.every((req) =>
      req.regex.test(formData.password),
    );
    if (formData.password && !allRequirementsMet) {
      newErrors.password = "Password does not meet requirements.";
    }

    if (
      Object.keys(newErrors).length > 0 ||
      Object.values(errors).some(
        (err) => err !== "" && err !== "This field is required.",
      )
    ) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    // --- LOGIC TO INCLUDE BRANCH ---
    const selectedBranch = localStorage.getItem("tempBranch") || "Main Branch";
    const payload = {
      ...formData,
      branch: selectedBranch,
      role: "patient" // Standard role for signup
    };

    setIsSubmitting(true);
    try {
      const response = await fetch("https://oravista-server-474976105474.asia-southeast1.run.app/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // Send payload with branch
      });
      if (response.ok) {
        setShowSuccessModal(true);
      } else {
        const data = await response.json();
        setSubmitError(data.message || "Your account could not be created. Please try again.");
        if (data.message && data.message.includes("Email")) {
          setErrors((prev) => ({ ...prev, email: data.message }));
        }
      }
    } catch (err) {
      setSubmitError("We could not connect. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = (error) => ({
    width: "100%",
    padding: "12px 45px 12px 15px",
    borderRadius: "8px",
    border: error ? "2px solid red" : `1px solid #ddd`,
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "'Manrope', sans-serif",
  });

  const labelStyle = {
    display: "block",
    textAlign: "left",
    fontWeight: "700",
    color: brandBlue,
    fontSize: "14px",
    marginBottom: "8px",
  };

  const errorTextStyle = {
    color: "red",
    fontSize: "11px",
    display: "block",
    textAlign: "left",
    marginTop: "4px",
  };

  const eyeIconContainerStyle = {
    position: "absolute",
    right: "15px",
    top: "38px",
    cursor: "pointer",
    color: brandBlue,
    display: "flex",
    alignItems: "center",
  };

  return (
    <div className="ov-auth-page"
      style={{
        backgroundImage: `url(${signupBg})`,
        backgroundSize: "cover",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      <AuthIntro />
      {showSuccessModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "25px",
              textAlign: "center",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                backgroundColor: "#e6f4ea",
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle2 size={40} color="#28a745" />
            </div>
            <h2 style={{ color: brandBlue, fontWeight: "800" }}>Success!</h2>
            <p style={{ color: "#555", marginBottom: "25px" }}>
              Your OraVista account has been created successfully.
            </p>
            <button
              onClick={() => navigate("/login")}
              style={{ "--ov-on-color": "var(--ov-ink)",
                width: "100%",
                padding: "14px",
                backgroundColor: "var(--ov-primary)",
                color: "var(--ov-on-color, #fff)",
                border: "none",
                borderRadius: "10px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              PROCEED TO LOGIN
            </button>
          </div>
        </div>
      )}

      <div className="ov-auth-card"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          padding: "35px 45px",
          borderRadius: "30px",
          width: "100%",
          maxWidth: "550px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            color: brandBlue,
            fontSize: "32px",
            fontWeight: "800",
            marginBottom: "5px",
          }}
        >
          Create Account
        </h2>
        <p style={{ marginBottom: "25px" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: brandBlue,
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            Login
          </Link>
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>First Name</label>
              <input aria-label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                style={inputStyle(errors.firstName)}
                placeholder="First Name"
              />
              {errors.firstName && (
                <span style={errorTextStyle}>{errors.firstName}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Last Name</label>
              <input aria-label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                style={inputStyle(errors.lastName)}
                placeholder="Last Name"
              />
              {errors.lastName && (
                <span style={errorTextStyle}>{errors.lastName}</span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={labelStyle}>Email Address</label>
            <input aria-label="example@gmail.com"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle(errors.email)}
              placeholder="example@gmail.com"
            />
            {errors.email && <span style={errorTextStyle}>{errors.email}</span>}
          </div>

          <div style={{ marginBottom: "15px", position: "relative" }}>
            <label style={labelStyle}>Password</label>
            <input aria-label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              style={inputStyle(errors.password)}
              placeholder="Password"
            />
            <button className="ov-ui-button"
              onClick={() => setShowPassword(!showPassword)}
              style={eyeIconContainerStyle}
             type="button" aria-label="Show or hide password">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && (
              <span style={errorTextStyle}>{errors.password}</span>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "20px",
              textAlign: "left",
            }}
          >
            {passwordRequirements.map((req, i) => {
              const isMet = req.regex.test(formData.password);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: isMet ? "#28a745" : "#d93025",
                  }}
                >
                  {isMet ? <CheckSquare size={16} /> : <Square size={16} />}
                  <span style={{ fontSize: "13px" }}>{req.label}</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginBottom: "25px", position: "relative" }}>
            <label style={labelStyle}>Confirm Password</label>
            <input aria-label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              style={inputStyle(errors.confirmPassword)}
              placeholder="Confirm Password"
            />
            <button className="ov-ui-button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={eyeIconContainerStyle}
             type="button" aria-label="Show or hide password">
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.confirmPassword && (
              <span style={errorTextStyle}>{errors.confirmPassword}</span>
            )}
          </div>

          {submitError && <p className="ov-inline-error" role="alert">{submitError}</p>}
          <button
            disabled={isSubmitting}
            type="submit"
            style={{ "--ov-on-color": "var(--ov-ink)",
              width: "100%",
              padding: "14px",
              backgroundColor: "var(--ov-primary)",
              color: "var(--ov-on-color, #fff)",
              border: "none",
              borderRadius: "10px",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            {isSubmitting ? "Creating account..." : "CREATE ACCOUNT"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignupPage;