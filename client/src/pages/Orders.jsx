import React from "react";
import { useEffect, useState } from "react";
import { apiRequest } from "../services/api.js";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/orders/mine")
      .then(setOrders)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <span className="eyebrow">Library history</span>
      <h1>Your Orders</h1>
      {error && <p className="form-error">{error}</p>}
      {orders.length === 0 ? (
        <p className="status">No orders yet.</p>
      ) : (
        <section className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order._id}>
              <div>
                <h2>Order #{order._id.slice(-6).toUpperCase()}</h2>
                <p>{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <strong>${order.totalPrice.toFixed(2)}</strong>
              <span>{order.status}</span>
              <ul>
                {order.items.map((item) => (
                  <li key={item.game}>{item.title}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default Orders;
