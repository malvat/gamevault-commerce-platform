import React from "react";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiRequest } from "../services/api.js";

const Cart = () => {
  const { items, total, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (user?.role === "admin") {
    return (
      <div className="page">
        <p className="status">Admins manage the catalog from the admin dashboard.</p>
      </div>
    );
  }

  const checkout = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setError("");
    setMessage("Opening secure Stripe checkout...");

    try {
      const session = await apiRequest("/orders/checkout-session", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((item) => ({ gameId: item._id, quantity: item.quantity }))
        })
      });
      window.location.href = session.url;
    } catch (err) {
      setMessage("");
      setError(err.message);
    }
  };

  return (
    <div className="page cart-page">
      <section>
        <span className="eyebrow">Checkout</span>
        <h1>Your Cart</h1>
        {message && <p className="success">{message}</p>}
        {error && <p className="form-error">{error}</p>}
        {items.length === 0 ? (
          <p className="status">
            Your cart is empty. <Link to="/">Browse the store</Link>
          </p>
        ) : (
          <div className="cart-list">
            {items.map((item) => (
              <article className="cart-item" key={item._id}>
                <img src={item.coverImage} alt={`${item.title} cover`} />
                <div>
                  <h2>{item.title}</h2>
                  <p>${item.price.toFixed(2)}</p>
                </div>
                <span className="owned-copy">1 copy</span>
                <button className="icon-danger" onClick={() => removeFromCart(item._id)} type="button" aria-label="Remove from cart">
                  <Trash2 size={18} aria-hidden />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
      {items.length > 0 && (
        <aside className="order-summary">
          <h2>Order Summary</h2>
          <div>
            <span>Subtotal</span>
            <strong>${total.toFixed(2)}</strong>
          </div>
          <button onClick={checkout} type="button">Purchase Games</button>
        </aside>
      )}
    </div>
  );
};

export default Cart;
