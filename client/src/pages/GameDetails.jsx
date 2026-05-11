import React from "react";
import { CheckCircle2, Download, Heart, ShoppingCart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { demoGames } from "../data/demoGames.js";
import { apiRequest } from "../services/api.js";

const GameDetails = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [game, setGame] = useState(null);
  const [reviewStatus, setReviewStatus] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [editingReview, setEditingReview] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [downloadMessage, setDownloadMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setReviewStatus(null);
    apiRequest(`/games/slug/${slug}`)
      .then((data) => {
        setGame(data);
        return data;
      })
      .catch(() => {
        const demoGame = demoGames.find((currentGame) => currentGame.slug === slug);
        if (demoGame) {
          setGame(demoGame);
          return;
        }
        setError("Game not found");
      });
  }, [slug]);

  useEffect(() => {
    if (!user || !game?._id || game._id.startsWith?.("demo-")) {
      setReviewStatus(null);
      return;
    }

    apiRequest(`/games/${game._id}/review-status`)
      .then((status) => {
        setReviewStatus(status);
        setEditingReview(false);
      })
      .catch(() => setReviewStatus(null));
  }, [game?._id, user]);

  useEffect(() => {
    if (!user || isAdmin || !game?._id || game._id.startsWith?.("demo-")) {
      setWishlisted(false);
      return;
    }

    apiRequest(`/wishlist/${game._id}/status`)
      .then((data) => setWishlisted(data.wishlisted))
      .catch(() => setWishlisted(false));
  }, [game?._id, isAdmin, user]);

  const submitReview = async (event) => {
    event.preventDefault();
    setReviewError("");

    try {
      const updatedGame = await apiRequest(editingReview ? `/games/${game._id}/reviews/mine` : `/games/${game._id}/reviews`, {
        method: editingReview ? "PUT" : "POST",
        body: JSON.stringify(reviewForm)
      });
      setGame(updatedGame);
      setReviewStatus({ purchased: true, hasReviewed: true, canReview: false });
      setReviewForm({ rating: 5, comment: "" });
      setEditingReview(false);
    } catch (err) {
      setReviewError(err.message);
    }
  };

  const currentUserReview = game?.reviews?.find((review) => review.user === user?._id);

  const startEditingReview = () => {
    if (!currentUserReview) {
      return;
    }

    setReviewForm({
      rating: currentUserReview.rating,
      comment: currentUserReview.comment
    });
    setReviewError("");
    setEditingReview(true);
  };

  const startDownload = () => {
    setDownloadMessage("Download Started");
    window.setTimeout(() => setDownloadMessage(""), 2500);
  };

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

  if (error) {
    return <p className="status error">{error}</p>;
  }

  if (!game) {
    return <p className="status">Loading game...</p>;
  }

  return (
    <div className="page detail-page">
      <img className="detail-cover" src={game.coverImage} alt={`${game.title} cover`} />
      <section className="detail-content">
        <span className="eyebrow">{game.genre}</span>
        <h1>{game.title}</h1>
        <p>{game.description}</p>
        <div className="platforms">
          {game.platform.map((platform) => (
            <span key={platform}>{platform}</span>
          ))}
        </div>
        <div className="detail-stats">
          <span className="detail-rating">
            <Star size={18} aria-hidden />
            {game.rating.toFixed(1)}
          </span>
        </div>
        <div className="purchase-bar">
          <strong>${game.price.toFixed(2)}</strong>
          {user && !isAdmin && (
            <button className={wishlisted ? "wishlist-detail-button active" : "wishlist-detail-button"} onClick={toggleWishlist} type="button">
              <Heart size={18} aria-hidden />
              {wishlisted ? "Wishlisted" : "Wishlist"}
            </button>
          )}
          {isAdmin ? (
            <button disabled type="button">
              <ShoppingCart size={18} aria-hidden />
              Add to Cart
            </button>
          ) : reviewStatus?.purchased ? (
            <button className="purchased-button" onClick={startDownload} type="button">
              <CheckCircle2 size={18} aria-hidden />
              Purchased
              <Download size={18} aria-hidden />
            </button>
          ) : (
            <button onClick={() => addToCart(game)} type="button">
              <ShoppingCart size={18} aria-hidden />
              Add to Cart
            </button>
          )}
        </div>
        {downloadMessage && <p className="download-toast">{downloadMessage}</p>}
      </section>

      <section className="reviews-panel">
        <div className="reviews-header">
          <div>
            <span className="eyebrow">Player feedback</span>
            <h2>Reviews</h2>
          </div>
          <span>{game.numReviews || 0} total</span>
        </div>

        {reviewStatus?.hasReviewed && currentUserReview && !editingReview && (
          <button className="ghost-button review-edit-button" onClick={startEditingReview} type="button">
            Edit Your Review
          </button>
        )}

        {(reviewStatus?.canReview || editingReview) && (
          <form className="review-form" onSubmit={submitReview}>
            {reviewError && <p className="form-error">{reviewError}</p>}
            <label>
              Rating
              <select
                value={reviewForm.rating}
                onChange={(event) => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })}
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Great</option>
                <option value="3">3 - Good</option>
                <option value="2">2 - Fair</option>
                <option value="1">1 - Poor</option>
              </select>
            </label>
            <label>
              Review
              <textarea
                value={reviewForm.comment}
                onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })}
                placeholder="Share what stood out after playing"
                required
              />
            </label>
            <div className="form-actions">
              <button type="submit">{editingReview ? "Save Review" : "Post Review"}</button>
              {editingReview && (
                <button className="ghost-button" onClick={() => setEditingReview(false)} type="button">
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {game.reviews?.length ? (
          <div className="reviews-list">
            {game.reviews.map((review) => (
              <article className="review-card" key={review._id}>
                <div>
                  <strong>{review.name}</strong>
                  <span>
                    <Star size={16} aria-hidden />
                    {review.rating}
                  </span>
                </div>
                <p>{review.comment}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="status">No player reviews yet.</p>
        )}
      </section>
    </div>
  );
};

export default GameDetails;
