import React from "react";
import { Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import Pagination from "../components/Pagination.jsx";
import { apiRequest } from "../services/api.js";

const genres = [
  "all",
  "Action",
  "Adventure",
  "RPG",
  "Puzzle",
  "Strategy",
  "Racing",
  "Fighting",
  "Shooter",
  "Horror",
  "Sports",
  "Simulation"
];

const emptyForm = {
  title: "",
  description: "",
  genre: "Action",
  platform: "PC",
  price: 19.99,
  coverImage: "",
  rating: 4.5,
  featured: false,
  releaseDate: ""
};

const AdminDashboard = () => {
  const [games, setGames] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search, genre]);

  const loadGames = async () => {
    const params = new URLSearchParams({ search, genre, page, limit: 8 });
    const data = await apiRequest(`/games?${params.toString()}`);
    setGames(data.games);
    setPagination({ page: data.page, pages: data.pages, total: data.total });
  };

  useEffect(() => {
    loadGames().catch((err) => setError(err.message));
  }, [search, genre, page]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const payload = {
      ...form,
      platform: form.platform.split(",").map((item) => item.trim()).filter(Boolean),
      price: Number(form.price),
      rating: Number(form.rating)
    };

    try {
      await apiRequest(editingId ? `/games/${editingId}` : "/games", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      resetForm();
      await loadGames();
    } catch (err) {
      setError(err.message);
    }
  };

  const editGame = (game) => {
    setEditingId(game._id);
    setForm({
      title: game.title,
      description: game.description,
      genre: game.genre,
      platform: game.platform.join(", "),
      price: game.price,
      coverImage: game.coverImage,
      rating: game.rating,
      featured: game.featured,
      releaseDate: game.releaseDate ? game.releaseDate.slice(0, 10) : ""
    });
  };

  const deleteGame = async (id) => {
    await apiRequest(`/games/${id}`, { method: "DELETE" });
    await loadGames();
  };

  return (
    <div className="page admin-page">
      <section>
        <span className="eyebrow">Admin tools</span>
        <h1>Catalog Manager</h1>
        <form className="admin-form" onSubmit={submit}>
          {error && <p className="form-error">{error}</p>}
          <div className="form-grid">
            <label>
              Title
              <input value={form.title} onChange={(event) => setField("title", event.target.value)} required />
            </label>
            <label>
              Genre
              <select value={form.genre} onChange={(event) => setField("genre", event.target.value)}>
                {genres
                  .filter((item) => item !== "all")
                  .map((item) => (
                    <option key={item}>{item}</option>
                  ))}
              </select>
            </label>
            <label>
              Platforms
              <input value={form.platform} onChange={(event) => setField("platform", event.target.value)} required />
            </label>
            <label>
              Price
              <input value={form.price} onChange={(event) => setField("price", event.target.value)} min="0" step="0.01" type="number" required />
            </label>
            <label>
              Rating
              <input value={form.rating} onChange={(event) => setField("rating", event.target.value)} min="0" max="5" step="0.1" type="number" required />
            </label>
            <label className="full-width">
              Cover Image URL
              <input value={form.coverImage} onChange={(event) => setField("coverImage", event.target.value)} required />
            </label>
            <label className="full-width">
              Description
              <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} required />
            </label>
            <label className="checkbox-label">
              <input checked={form.featured} onChange={(event) => setField("featured", event.target.checked)} type="checkbox" />
              Featured
            </label>
          </div>
          <div className="form-actions">
            <button type="submit">
              {editingId ? <Save size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
              {editingId ? "Save Changes" : "Add Game"}
            </button>
            {editingId && (
              <button className="ghost-button" onClick={resetForm} type="button">
                <X size={18} aria-hidden />
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="toolbar admin-toolbar">
        <label className="search-box">
          <Search size={18} aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search catalog"
            type="search"
          />
        </label>
        <div className="genre-tabs" aria-label="Filter admin catalog by genre">
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

      <section className="admin-list">
        {games.map((game) => (
          <article className="admin-row" key={game._id}>
            <img src={game.coverImage} alt={`${game.title} cover`} />
            <div>
              <h2>{game.title}</h2>
              <p>{game.genre} | ${game.price.toFixed(2)}</p>
            </div>
            <button onClick={() => editGame(game)} type="button" aria-label={`Edit ${game.title}`}>
              <Pencil size={18} aria-hidden />
            </button>
            <button className="icon-danger" onClick={() => deleteGame(game._id)} type="button" aria-label={`Delete ${game.title}`}>
              <Trash2 size={18} aria-hidden />
            </button>
          </article>
        ))}
      </section>

      <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />
    </div>
  );
};

export default AdminDashboard;
