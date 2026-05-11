import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination.jsx";
import { apiRequest } from "../services/api.js";

const Library = () => {
  const [games, setGames] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [downloadMessage, setDownloadMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest(`/orders/library?page=${page}&limit=8`)
      .then((data) => {
        setGames(data.games);
        setPagination({ page: data.page, pages: data.pages, total: data.total });
      })
      .catch((err) => setError(err.message));
  }, [page]);

  const startDownload = (title) => {
    setDownloadMessage(`Download Started: ${title}`);
    window.setTimeout(() => setDownloadMessage(""), 2500);
  };

  return (
    <div className="page">
      <span className="eyebrow">Owned games</span>
      <h1>Library</h1>
      {downloadMessage && <p className="download-toast">{downloadMessage}</p>}
      {error && <p className="form-error">{error}</p>}
      {games.length === 0 ? (
        <p className="status">Purchased games will appear here.</p>
      ) : (
        <>
          <section className="library-grid">
            {games.map((game) => (
              <article className="library-card" key={game._id}>
                <Link to={`/games/${game.slug}`}>
                  <img src={game.coverImage} alt={`${game.title} cover`} />
                  <h2>{game.title}</h2>
                  <p>{game.genre} | ${game.price.toFixed(2)}</p>
                </Link>
                <button onClick={() => startDownload(game.title)} type="button">
                  <Download size={18} aria-hidden />
                  Download
                </button>
              </article>
            ))}
          </section>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default Library;
