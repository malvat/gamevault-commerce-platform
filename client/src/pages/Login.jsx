import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-form" onSubmit={submit}>
        <span className="eyebrow">Welcome back</span>
        <h1>Login</h1>
        {error && <p className="form-error">{error}</p>}
        <label>
          Email
          <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required />
        </label>
        <label>
          Password
          <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" required />
        </label>
        <button type="submit">Login</button>
        <p>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </section>
  );
};

export default Login;
