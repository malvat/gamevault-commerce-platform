import React from "react";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import GameCard from "../components/GameCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { demoGames } from "../data/demoGames.js";
import { apiRequest } from "../services/api.js";

const genres = [
  "all",
  "Action",
  "Adventure",
  "RPG",
  "Puzzle",
  "Racing",
  "Fighting",
  "Shooter",
  "Horror",
  "Sports",
  "Simulation",
  "Strategy"
];

const Home = () => {
  const [games, setGames] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search, genre]);

  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ search, genre, page, limit: 8 });
        const data = await apiRequest(`/games?${params.toString()}`);
        setGames(data.games);
        setPagination({ page: data.page, pages: data.pages, total: data.total });
      } catch (err) {
        const filteredGames = demoGames.filter((game) => {
          const matchesSearch = game.title.toLowerCase().includes(search.toLowerCase()) || game.description.toLowerCase().includes(search.toLowerCase());
          const matchesGenre = genre === "all" || game.genre === genre;
          return matchesSearch && matchesGenre;
        });
        const pages = Math.max(Math.ceil(filteredGames.length / 8), 1);
        const safePage = Math.min(page, pages);
        setGames(filteredGames.slice((safePage - 1) * 8, safePage * 8));
        setPagination({ page: safePage, pages, total: filteredGames.length });
        setError("");
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, [search, genre, page]);

  const featured = useMemo(() => games.find((game) => game.featured) || games[0], [games]);

  return (
    <div className="page">
      {featured && (
        <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(9, 13, 22, 0.92), rgba(9, 13, 22, 0.48)), url(${featured.coverImage})` }}>
          <div>
            <span className="eyebrow">Featured release</span>
            <h1>{featured.title}</h1>
            <p>{featured.description}</p>
            <div className="hero-actions">
              <a href={`/games/${featured.slug}`}>View Details</a>
              <strong>${featured.price.toFixed(2)}</strong>
            </div>
          </div>
        </section>
      )}

      <section className="toolbar">
        <label className="search-box">
          <Search size={18} aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search games"
            type="search"
          />
        </label>
        <div className="genre-tabs" aria-label="Filter by genre">
          {genres.map((item) => (
            <button
              className={genre === item ? "active" : ""}
              key={item}
              onClick={() => setGenre(item)}
              type="button"
            >
              {item === "all" ? "All" : item}
            </button>
          ))}
        </div>
      </section>

      {loading && <p className="status">Loading games...</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && !error && (
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

export default Home;
