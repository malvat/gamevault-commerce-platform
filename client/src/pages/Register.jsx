import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-form" onSubmit={submit}>
        <span className="eyebrow">Create profile</span>
        <h1>Register</h1>
        {error && <p className="form-error">{error}</p>}
        <div className="form-grid two-column">
          <label>
            First name
            <input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required />
          </label>
          <label>
            Last name
            <input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required />
          </label>
        </div>
        <label>
          Email
          <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required />
        </label>
        <label>
          Password
          <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" minLength="6" required />
        </label>
        <button type="submit">Create Account</button>
        <p>
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </section>
  );
};

export default Register;
