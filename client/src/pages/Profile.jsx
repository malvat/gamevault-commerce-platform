import React, { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const splitName = (name = "") => {
  const [firstName = "", ...lastNameParts] = name.trim().split(/\s+/);
  return {
    firstName,
    lastName: lastNameParts.join(" ")
  };
};

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const fallbackName = useMemo(() => splitName(user?.name), [user?.name]);
  const [form, setForm] = useState({
    firstName: user?.firstName || fallbackName.firstName,
    lastName: user?.lastName || fallbackName.lastName
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await updateProfile(form);
      setSuccess("Profile updated");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="profile-page">
      <form className="auth-form profile-form" onSubmit={submit}>
        <span className="eyebrow">Account details</span>
        <h1>Profile</h1>
        <p>Update the name shown on your account and reviews.</p>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="success">{success}</p>}
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
          <input value={user?.email || ""} readOnly />
        </label>
        <button disabled={saving} type="submit">
          <Save size={18} aria-hidden />
          {saving ? "Saving" : "Save Profile"}
        </button>
      </form>
    </section>
  );
};

export default Profile;
