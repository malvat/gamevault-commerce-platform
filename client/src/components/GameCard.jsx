import React from "react";
import { Download, Heart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiRequest } from "../services/api.js";

const GameCard = ({ game }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [wishlisted, setWishlisted] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");

  useEffect(() => {
    if (!user || isAdmin || game._id.startsWith?.("demo-")) {
      setWishlisted(false);
      setPurchased(false);
      return;
    }

    Promise.all([
      apiRequest(`/wishlist/${game._id}/status`),
      apiRequest(`/games/${game._id}/review-status`)
    ])
      .then(([wishlistData, ownershipData]) => {
        setWishlisted(wishlistData.wishlisted);
        setPurchased(ownershipData.purchased);
      })
      .catch(() => {
        setWishlisted(false);
        setPurchased(false);
      });
  }, [game._id, isAdmin, user]);

  const toggleWishlist = async () => {
    if (!user || isAdmin) {
      return;
    }

    if (wishlisted) {
      await apiRequest(`/wishlist/${game._id}`, { method: "DELETE" });
      setWishlisted(false);
      return;
    }

    await apiRequest(`/wishlist/${game._id}`, { method: "POST" });
    setWishlisted(true);
  };

  const startDownload = () => {
    setDownloadMessage("Download Started");
    window.setTimeout(() => setDownloadMessage(""), 2500);
  };

  return (
    <article className="game-card">
      <Link to={`/games/${game.slug}`} className="cover-link">
        <img src={game.coverImage} alt={`${game.title} cover`} />
      </Link>
      <div className="game-card-body">
        <div className="game-card-meta">
          <span>{game.genre}</span>
          <span className="rating">
            <Star size={16} aria-hidden />
            {game.rating.toFixed(1)}
          </span>
        </div>
        <Link to={`/games/${game.slug}`} className="game-title">
          {game.title}
        </Link>
        <p>{game.description}</p>
        <div className="game-card-footer">
          <strong>${game.price.toFixed(2)}</strong>
          <div className="card-actions">
            {user && !isAdmin && (
              <button className={wishlisted ? "wishlist-button active" : "wishlist-button"} onClick={toggleWishlist} type="button" aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}>
                <Heart size={18} aria-hidden />
              </button>
            )}
            {purchased ? (
              <button className="purchased-button" onClick={startDownload} type="button">
                <Download size={18} aria-hidden />
                Download
              </button>
            ) : (
              <button disabled={isAdmin} onClick={() => addToCart(game)} type="button">
                Add to Cart
              </button>
            )}
          </div>
        </div>
        {downloadMessage && <p className="download-toast card-download-toast">{downloadMessage}</p>}
      </div>
    </article>
  );
};

export default GameCard;
