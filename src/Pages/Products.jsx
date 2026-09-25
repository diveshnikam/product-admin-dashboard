import { useEffect, useState } from "react";
import { getProducts } from "../api/productApi";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Which page-number array is currently visible
  const [pageArrayIndex, setPageArrayIndex] = useState(0);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      // Calculate how many products to skip
      const skip = (page - 1) * limit;

      const response = await getProducts({
        limit: limit,
        skip: skip,
      });

      setProducts(response.products);
      setTotal(response.total);
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, limit]);

  // Total number of pages
  const totalPages = Math.ceil(total / limit);

  // Create all page numbers
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  // Create arrays of 5 page numbers
  const pageArrays = [];

  for (let i = 0; i < pageNumbers.length; i += 5) {
    pageArrays.push(pageNumbers.slice(i, i + 5));
  }

  // Current page-number array
  const visiblePages = pageArrays[pageArrayIndex] || [];

  // Product range currently being displayed
  const startProduct = (page - 1) * limit + 1;

  const endProduct = Math.min(page * limit, total);

  // Previous array
  const handlePrevious = () => {
    if (pageArrayIndex > 0) {
      setPageArrayIndex(pageArrayIndex - 1);
    }
  };

  // Next array
  const handleNext = () => {
    if (pageArrayIndex < pageArrays.length - 1) {
      setPageArrayIndex(pageArrayIndex + 1);
    }
  };

  // Page size change
  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));

    // Start from page 1
    setPage(1);

    // Show first page-number array
    setPageArrayIndex(0);
  };

  return (
    <div>
      <h2>Products</h2>

      {/* Loading state */}
      {loading && <p>Loading...</p>}

      {/* Error state */}
      {error && <p>{error}</p>}

      {!loading && !error && (
        <>
          {/* Product List */}
          <div>
            {products.map((product) => (
              <div key={product.id}>
                <h3>{product.title}</h3>

                <p>Category: {product.category}</p>

                <p>Price: ${product.price}</p>

                <p>Rating: {product.rating}</p>

                <p>Stock: {product.stock}</p>
              </div>
            ))}
          </div>

          {/* Showing range */}
          <div>
            <p>
              Showing {startProduct}–{endProduct} of {total}
            </p>
          </div>

          {/* Page size */}
          <div>
            <label htmlFor="pageSize">
              Products per page:{" "}
            </label>

            <select
              id="pageSize"
              value={limit}
              onChange={handleLimitChange}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Pagination */}
          <div>
            {/* Previous */}
            <button
              onClick={handlePrevious}
              disabled={pageArrayIndex === 0}
            >
              Previous
            </button>

            {/* Page numbers */}
            {visiblePages.map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                disabled={page === pageNumber}
              >
                {pageNumber}
              </button>
            ))}

            {/* Next */}
            <button
              onClick={handleNext}
              disabled={pageArrayIndex === pageArrays.length - 1}
            >
              Next
            </button>

            {/* Current page information */}
            <div>
              <p>
                Page {page} of {totalPages}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Products;
