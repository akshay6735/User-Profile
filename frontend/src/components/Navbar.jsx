import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "U";
}

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("common-goods-theme") || "light");

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); localStorage.setItem("common-goods-theme", theme); }, [theme]);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 10); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  useEffect(() => { const close = () => setOpen(false); window.addEventListener("resize", close); return () => window.removeEventListener("resize", close); }, []);

  async function handleLogout() { await logout(); setOpen(false); navigate("/"); }
  const linkClass = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;
  const avatarSrc = user?.avatar_url ? `${API_ORIGIN}${user.avatar_url}` : "";

  return (
    <header className={`navbar${scrolled ? " scrolled" : ""}`}>
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}><span className="brand-mark">CG</span>Common<span>Goods</span></Link>
        <button className="nav-menu" aria-label="Toggle navigation" onClick={() => setOpen((v) => !v)}>{open ? "×" : "☰"}</button>
        <nav className={`nav-links${open ? " open" : ""}`}>
          <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>Shop</NavLink>
          {user && !isAdmin && <NavLink to="/orders" className={linkClass} onClick={() => setOpen(false)}>Orders</NavLink>}
          {isAdmin && <><NavLink to="/admin/dashboard" className={linkClass} onClick={() => setOpen(false)}>Dashboard</NavLink><NavLink to="/admin/products" className={linkClass} onClick={() => setOpen(false)}>Products</NavLink><NavLink to="/admin/orders" className={linkClass} onClick={() => setOpen(false)}>Orders</NavLink></>}
          {!isAdmin && <Link to="/cart" className="nav-cart" onClick={() => setOpen(false)}>Cart {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}</Link>}
          <button type="button" className="theme-toggle" onClick={() => setTheme((current) => current === "light" ? "dark" : "light")} aria-label="Toggle theme">{theme === "light" ? "☾ Dark" : "☀ Light"}</button>
          {user ? <div className="nav-user">
            <Link to="/profile" className="nav-profile-link" onClick={() => setOpen(false)} title="My Profile">
              {avatarSrc ? <img className="avatar avatar-image" src={avatarSrc} alt="" /> : <span className="avatar">{initials(user.name)}</span>}
              <span className="nav-user-name">{user.name?.split(" ")[0]}</span>
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
          </div> : <Link to="/login" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>Sign in</Link>}
        </nav>
      </div>
    </header>
  );
}
