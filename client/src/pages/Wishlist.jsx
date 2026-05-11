import React, { useEffect, useState } from "react";
import GameCard from "../components/GameCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { apiRequest } from "../services/api.js";

const Wishlist = () => {
  const [games, setGames] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest(`/wishlist?page=${page}&limit=8`)
      .then((data) => {
        setGames(data.games);
        setPagination({ page: data.page, pages: data.pages, total: data.total });
      })
      .catch((err) => setError(err.message));
  }, [page]);

  return (
    <div className="page">
      <span className="eyebrow">Saved for later</span>
      <h1>Wishlist</h1>
      {error && <p className="form-error">{error}</p>}
      {games.length === 0 ? (
        <p className="status">No wishlisted games yet.</p>
      ) : (
        <>
          <section className="game-grid">
            {games.map((game) => (
              <GameCard game={game} key={game._id} />
            ))}
          </section>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default Wishlist;
