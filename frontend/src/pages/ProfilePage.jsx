import { useEffect, useRef, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useForm } from "../hooks/useForm.js";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "U";
}

function Avatar({ user, preview }) {
  const src = preview || (user?.avatar_url ? `${API_ORIGIN}${user.avatar_url}` : "");
  return src ? <img className="profile-avatar" src={src} alt="Profile" /> : <div className="profile-avatar profile-avatar-placeholder">{initials(user?.name)}</div>;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { notify } = useToast();
  const fileRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");

  const profileForm = useForm({ name: "", email: "" });
  const passwordForm = useForm({ current_password: "", new_password: "", confirm_password: "" });

  useEffect(() => {
    if (user) profileForm.setValues({ name: user.name || "", email: user.email || "" });
  }, [user]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function choosePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify("Please select an image file", { type: "error" });
    if (file.size > 2 * 1024 * 1024) return notify("Image must be 2MB or smaller", { type: "error" });
    if (preview) URL.revokeObjectURL(preview);
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto() {
    if (!selectedFile) return notify("Choose a photo first", { type: "error" });
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      const res = await api.put("/me/avatar", formData);
      updateUser({ avatar_url: res.data.avatar_url });
      setSelectedFile(null);
      notify("Profile picture updated", { type: "success" });
      if (fileRef.current) fileRef.current.value = "";
    } catch (error) {
      notify(error.response?.data?.error || "Could not upload photo", { type: "error" });
    } finally { setUploading(false); }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setProfileError("");
    if (!profileForm.values.name.trim() || !profileForm.values.email.trim()) {
      setProfileError("Name and email are required");
      return;
    }
    try {
      await api.put("/me", profileForm.values);
      updateUser(profileForm.values);
      notify("Profile updated", { type: "success" });
    } catch (error) {
      if (error.response?.status === 409) setProfileError("Email is already in use");
      else setProfileError(error.response?.data?.error || "Could not update profile");
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordError("");
    setCurrentPasswordError("");
    const { current_password, new_password, confirm_password } = passwordForm.values;
    if (new_password !== confirm_password) { setPasswordError("New passwords do not match"); return; }
    if (new_password.length < 6) { setPasswordError("New password must be at least 6 characters"); return; }
    try {
      await api.put("/me/password", passwordForm.values);
      passwordForm.resetForm();
      notify("Password changed successfully", { type: "success" });
    } catch (error) {
      if (error.response?.status === 401) setCurrentPasswordError("Current password is incorrect");
      else setPasswordError(error.response?.data?.error || "Could not change password");
    }
  }

  return (
    <main className="container page profile-page">
      <div className="page-head">
        <div><p className="eyebrow">Account</p><h1 className="page-title">My Profile</h1><p className="page-subtitle">Manage your profile details, photo and password.</p></div>
      </div>

      <div className="profile-grid">
        <section className="form-card profile-card">
          <h2>Profile picture</h2><p className="form-help">Upload a JPG, PNG or WEBP image up to 2MB.</p>
          <div className="profile-photo-row"><Avatar user={user} preview={preview} /><div><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={choosePhoto} hidden /><button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()}>Change Photo</button>{selectedFile && <button type="button" className="btn btn-primary" onClick={uploadPhoto} disabled={uploading}>{uploading ? "Uploading..." : "Upload"}</button>}</div></div>
        </section>

        <section className="form-card profile-card">
          <h2>Edit profile</h2><p className="form-help">Update the name and email used for your account.</p>
          <form onSubmit={saveProfile} className="profile-form">
            <label>Name<input name="name" value={profileForm.values.name} onChange={profileForm.handleChange} /></label>
            <label>Email<input type="email" name="email" value={profileForm.values.email} onChange={profileForm.handleChange} /></label>
            {profileError && <p className="inline-error">{profileError}</p>}
            <button className="btn btn-primary" type="submit">Save Changes</button>
          </form>
        </section>

        <section className="form-card profile-card profile-password-card">
          <h2>Change password</h2><p className="form-help">Use your current password to set a new one.</p>
          <form onSubmit={changePassword} className="profile-form">
            <label>Current Password<input type="password" name="current_password" value={passwordForm.values.current_password} onChange={passwordForm.handleChange} />{currentPasswordError && <span className="inline-error">{currentPasswordError}</span>}</label>
            <label>New Password<input type="password" name="new_password" value={passwordForm.values.new_password} onChange={passwordForm.handleChange} /></label>
            <label>Confirm New Password<input type="password" name="confirm_password" value={passwordForm.values.confirm_password} onChange={passwordForm.handleChange} /></label>
            {passwordError && <p className="inline-error">{passwordError}</p>}
            <button className="btn btn-primary" type="submit">Change Password</button>
          </form>
        </section>
      </div>
    </main>
  );
}
