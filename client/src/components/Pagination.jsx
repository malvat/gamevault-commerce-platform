import React from "react";

const Pagination = ({ page, pages, total, onPageChange }) => {
  if (pages <= 1) {
    return null;
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} type="button">
        Previous
      </button>
      <span>
        Page {page} of {pages} | {total} games
      </span>
      <button disabled={page >= pages} onClick={() => onPageChange(page + 1)} type="button">
        Next
      </button>
    </nav>
  );
};

export default Pagination;
