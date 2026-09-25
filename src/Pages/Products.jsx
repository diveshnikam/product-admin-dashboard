import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getProducts,
  searchProducts,
  getCategories,
  getProductsByCategory,
} from "../api/productApi";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Read page, limit, search and category from URL
  const urlPage = Number(searchParams.get("page"));
  const urlLimit = Number(searchParams.get("limit"));
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "";

  // Validate page
  // Page should be a positive whole number
  const pageValue = urlPage > 0 && Number.isInteger(urlPage) ? urlPage : 1;

  // Validate limit
  // Only 10, 20 and 50 are allowed
  const limitValue = [10, 20, 50].includes(urlLimit) ? urlLimit : 10;

  const [page, setPage] = useState(pageValue);
  const [limit, setLimit] = useState(limitValue);
  const [total, setTotal] = useState(0);

  // Categories
  const [categories, setCategories] = useState([]);

  // Selected category
  const [category, setCategory] = useState(urlCategory);

  // Which page-number array is currently visible
  const [pageArrayIndex, setPageArrayIndex] = useState(
    Math.floor((pageValue - 1) / 5),
  );

  // Search text
  // If category exists in URL, category gets priority
  const [search, setSearch] = useState(urlCategory ? "" : urlSearch);

  // Debounced search text
  const [debouncedSearch, setDebouncedSearch] = useState(
    urlCategory ? "" : urlSearch,
  );

  // Used to prevent search debounce from resetting
  // the page when the component loads from the URL
  const isFirstSearchRender = useRef(true);

  // Debounce search
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(search);

      // Search and category are mutually exclusive
      if (search.trim()) {
        setCategory("");
      }

      // When search changes, always start from page 1
      setPage(1);
      setPageArrayIndex(0);

      // Update URL
      setSearchParams({
        page: 1,
        limit: limit,
        search: search,
        category: search.trim() ? "" : category,
      });
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();

        setCategories(response);
      } catch (err) {
        console.log(err);
      }
    };

    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      // Calculate how many products to skip
      // Math.max ensures skip never becomes negative
      const skip = Math.max(0, (page - 1) * limit);

      let response;

      // Category has priority when selected
      if (category) {
        response = await getProductsByCategory(category, {
          limit: limit,
          skip: skip,
        });
      } else if (debouncedSearch.trim()) {
        // Search when no category is selected
        response = await searchProducts({
          q: debouncedSearch,
          limit: limit,
          skip: skip,
        });
      } else {
        // Get all products when there is no search or category
        response = await getProducts({
          limit: limit,
          skip: skip,
        });
      }

      // Store total products
      setTotal(response.total);

      // Calculate total number of pages
      const totalPages = Math.ceil(response.total / limit);

      // If current page is greater than available pages
      if (page > totalPages && totalPages > 0) {
        // Move to the last available page
        setPage(totalPages);

        // Show the page-number array containing the last page
        setPageArrayIndex(Math.floor((totalPages - 1) / 5));

        // Update URL with valid page
        setSearchParams({
          page: totalPages,
          limit: limit,
          search: debouncedSearch,
          category: category,
        });

        return;
      }

      // Set products only when page is valid
      setProducts(response.products);
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Fetch products whenever page, limit, search or category changes
  useEffect(() => {
    fetchProducts();
  }, [page, limit, debouncedSearch, category]);

  // Category change
  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;

    setCategory(selectedCategory);

    // Clear search because DummyJSON
    // does not support search + category together
    setSearch("");
    setDebouncedSearch("");

    // Start from page 1
    setPage(1);
    setPageArrayIndex(0);

    // Update URL
    setSearchParams({
      page: 1,
      limit: limit,
      search: "",
      category: selectedCategory,
    });
  };

  // Search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;

    setSearch(value);

    // If user starts searching,
    // clear the selected category
    if (value.trim()) {
      setCategory("");
    }
  };

  // Total number of pages
  const totalPages = Math.ceil(total / limit);

  // Create all page numbers
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  // Create arrays of 5 page numbers
  const pageArrays = [];

  for (let i = 0; i < pageNumbers.length; i += 5) {
    pageArrays.push(pageNumbers.slice(i, i + 5));
  }

  // Current page-number array
  const visiblePages = pageArrays[pageArrayIndex] || [];

  // Product range currently being displayed
  const startProduct = total > 0 ? (page - 1) * limit + 1 : 0;
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
    const newLimit = Number(e.target.value);

    setLimit(newLimit);

    // Start from page 1
    setPage(1);

    // Show first page-number array
    setPageArrayIndex(0);

    // Update URL
    setSearchParams({
      page: 1,
      limit: newLimit,
      search: debouncedSearch,
      category: category,
    });
  };

  // Page number click
  const handlePageChange = (pageNumber) => {
    setPage(pageNumber);

    // Update URL
    setSearchParams({
      page: pageNumber,
      limit: limit,
      search: debouncedSearch,
      category: category,
    });
  };

  return (
    <div>
      <h2>Products</h2>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {/* Category Filter */}
      <div>
        <label htmlFor="category">Category: </label>

        <select
          id="category"
          value={category}
          onChange={handleCategoryChange}
        >
          <option value="">All Categories</option>

          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Loading state */}
      {loading && <p>Loading...</p>}

      {/* Error state */}
      {error && <p>{error}</p>}

      {!loading && !error && (
        <>
          {/* Product List */}
          <div>
            {products.length > 0 ? (
              products.map((product) => (
                <div key={product.id}>
                  <h3>{product.title}</h3>

                  <p>Category: {product.category}</p>

                  <p>Price: ${product.price}</p>

                  <p>Rating: {product.rating}</p>

                  <p>Stock: {product.stock}</p>
                </div>
              ))
            ) : (
              <p>No products found.</p>
            )}
          </div>

          {/* Showing range */}
          <div>
            <p>
              Showing {startProduct}–{endProduct} of {total}
            </p>
          </div>

          {/* Page size */}
          <div>
            <label htmlFor="pageSize">Products per page: </label>

            <select id="pageSize" value={limit} onChange={handleLimitChange}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div>
              {/* Previous */}
              <button onClick={handlePrevious} disabled={pageArrayIndex === 0}>
                Previous
              </button>

              {/* Page numbers */}
              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
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
          )}
        </>
      )}
    </div>
  );
};

export default Products;