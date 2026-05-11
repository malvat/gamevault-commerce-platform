import React from "react";
import { Gamepad2, LogOut, ShoppingCart, ShieldCheck, UserRound } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

const Header = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const accountLabel = user?.firstName || user?.name?.split(" ")[0] || "Profile";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="site-header">
      <Link className="brand" to="/">
        <Gamepad2 aria-hidden />
        GameVault
      </Link>
      <nav>
        <NavLink to="/">Store</NavLink>
        {user && !isAdmin && <NavLink to="/wishlist">Wishlist</NavLink>}
        {user && !isAdmin && <NavLink to="/library">Library</NavLink>}
        {user && !isAdmin && <NavLink to="/orders">Orders</NavLink>}
        {user && (
          <NavLink to="/profile">
            <UserRound size={18} aria-hidden />
            {accountLabel}
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/admin">
            <ShieldCheck size={18} aria-hidden />
            Admin
          </NavLink>
        )}
        {!isAdmin && (
          <NavLink className="cart-link" to="/cart">
            <ShoppingCart size={18} aria-hidden />
            Cart
            {itemCount > 0 && <span>{itemCount}</span>}
          </NavLink>
        )}
        {user ? (
          <button className="ghost-button" onClick={handleLogout} type="button">
            <LogOut size={18} aria-hidden />
            Logout
          </button>
        ) : (
          <NavLink to="/login">
            <UserRound size={18} aria-hidden />
            Login
          </NavLink>
        )}
      </nav>
    </header>
  );
};

export default Header;
