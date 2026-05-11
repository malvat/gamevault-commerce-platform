import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { apiRequest } from "../services/api.js";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const confirmedSession = useRef("");
  const [status, setStatus] = useState("Confirming your Stripe payment...");
  const [error, setError] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setError("Stripe did not return a checkout session.");
      setStatus("");
      return;
    }

    if (confirmedSession.current === sessionId) {
      return;
    }

    confirmedSession.current = sessionId;

    apiRequest("/orders/checkout-session/confirm", {
      method: "POST",
      body: JSON.stringify({ sessionId })
    })
      .then(() => {
        clearCart();
        setStatus("Purchase complete. Your games are now in your library.");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("");
      });
  }, [clearCart, searchParams]);

  return (
    <section className="auth-page">
      <div className="auth-form checkout-result">
        <CheckCircle2 size={34} aria-hidden />
        <span className="eyebrow">Stripe checkout</span>
        <h1>Payment</h1>
        {status && <p className="success">{status}</p>}
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <Link className="button-link" to="/library">Library</Link>
          <Link className="button-link secondary" to="/orders">Orders</Link>
        </div>
      </div>
    </section>
  );
};

export default CheckoutSuccess;
