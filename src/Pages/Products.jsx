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

  // Helper function to keep URL clean
  const updateUrl = ({
    page,
    limit,
    search = "",
    category = "",
    sortBy = "",
    order = "",
  }) => {
    const params = {
      page,
      limit,
    };

    // Add search only when it has a value
    if (search.trim()) {
      params.search = search;
    }

    // Add category only when selected
    if (category) {
      params.category = category;
    }

    // Add sorting only when both values exist
    if (sortBy && order) {
      params.sortBy = sortBy;
      params.order = order;
    }

    setSearchParams(params);
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Read page, limit, search, category and sorting from URL
  const urlPage = Number(searchParams.get("page"));
  const urlLimit = Number(searchParams.get("limit"));
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "";
  const urlSortBy = searchParams.get("sortBy") || "";
  const urlOrder = searchParams.get("order") || "";

  // Validate page
  // Page should be a positive whole number
  const pageValue = urlPage > 0 && Number.isInteger(urlPage) ? urlPage : 1;

  // Validate limit
  // Only 10, 20 and 50 are allowed
  const limitValue = [10, 20, 50].includes(urlLimit) ? urlLimit : 10;

  // Validate sorting
  // sortBy and order should be a valid pair
  const validSortBy = ["price", "rating", "title"];
  const validOrder = ["asc", "desc"];

  const isValidSorting =
    validSortBy.includes(urlSortBy) && validOrder.includes(urlOrder);

  const sortByValue = isValidSorting ? urlSortBy : "";
  const orderValue = isValidSorting ? urlOrder : "";

  const [page, setPage] = useState(pageValue);
  const [limit, setLimit] = useState(limitValue);
  const [total, setTotal] = useState(0);

  // Categories
  const [categories, setCategories] = useState([]);

  // Used to know when categories are loaded
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  // Selected category
  const [category, setCategory] = useState(urlCategory);

  // Sorting
  const [sortBy, setSortBy] = useState(sortByValue);
  const [order, setOrder] = useState(orderValue);

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

  // Used to identify the latest API request
  // This prevents old responses from overwriting new results
  const requestIdRef = useRef(0);

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

      // Update clean URL
      updateUrl({
        page: 1,
        limit: limit,
        search: search,
        category: search.trim() ? "" : category,
        sortBy: sortBy,
        order: order,
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

        // Check whether category from URL is valid
        const isValidCategory = response.some(
          (item) => item.slug === urlCategory,
        );

        // If category exists in URL but is invalid
        if (urlCategory && !isValidCategory) {
          setCategory("");

          // If category is invalid, allow search from URL
          if (urlSearch) {
            setSearch(urlSearch);
            setDebouncedSearch(urlSearch);
          }

          // Update URL without invalid category
          updateUrl({
            page: pageValue,
            limit: limitValue,
            search: urlSearch,
            category: "",
            sortBy: sortByValue,
            order: orderValue,
          });
        }

        // If both search and category exist,
        // category gets priority
        if (urlCategory && isValidCategory && urlSearch) {
          setSearch("");
          setDebouncedSearch("");

          // Remove search from URL
          updateUrl({
            page: pageValue,
            limit: limitValue,
            search: "",
            category: urlCategory,
            sortBy: sortByValue,
            order: orderValue,
          });
        }

        // If sorting is invalid, clean it from URL
        if ((urlSortBy || urlOrder) && !isValidSorting) {
          setSortBy("");
          setOrder("");

          updateUrl({
            page: pageValue,
            limit: limitValue,
            search:
              urlCategory && isValidCategory ? "" : urlSearch,
            category: isValidCategory ? urlCategory : "",
          });
        }

        setCategoriesLoaded(true);
      } catch (err) {
        console.log(err);
        setCategoriesLoaded(true);
      }
    };

    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    // Create a unique ID for this request
    // Every new request gets a new ID
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError("");

      // Calculate how many products to skip
      // Math.max ensures skip never becomes negative
      const skip = Math.max(0, (page - 1) * limit);

      // Common pagination and sorting parameters
      const params = {
        limit: limit,
        skip: skip,
      };

      // Add sorting parameters only when sorting is selected
      if (sortBy && order) {
        params.sortBy = sortBy;
        params.order = order;
      }

      let response;

      // Category has priority when selected
      if (category) {
        response = await getProductsByCategory(category, params);
      } else if (debouncedSearch.trim()) {
        // Search when no category is selected
        response = await searchProducts({
          q: debouncedSearch,
          ...params,
        });
      } else {
        // Get all products when there is no search or category
        response = await getProducts(params);
      }

      // If another request started after this request,
      // ignore this old response
      if (requestId !== requestIdRef.current) {
        return;
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

        // Update clean URL with valid page
        updateUrl({
          page: totalPages,
          limit: limit,
          search: debouncedSearch,
          category: category,
          sortBy: sortBy,
          order: order,
        });

        return;
      }

      // Set products only when page is valid
      setProducts(response.products);
    } catch (err) {
      // Ignore errors from old requests too
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(err.message || "Failed to load products");
    } finally {
      // Only the latest request controls loading state
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  // Fetch products whenever page, limit, search, category or sorting changes
  useEffect(() => {
    if (!categoriesLoaded) {
      return;
    }

    fetchProducts();
  }, [
    categoriesLoaded,
    page,
    limit,
    debouncedSearch,
    category,
    sortBy,
    order,
  ]);

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

    // Update clean URL
    updateUrl({
      page: 1,
      limit: limit,
      search: "",
      category: selectedCategory,
      sortBy: sortBy,
      order: order,
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

  // Sorting change
  const handleSortChange = (e) => {
    const selectedSort = e.target.value;

    // Default option
    if (!selectedSort) {
      setSortBy("");
      setOrder("");
      setPage(1);
      setPageArrayIndex(0);

      // Update URL without sorting
      updateUrl({
        page: 1,
        limit: limit,
        search: debouncedSearch,
        category: category,
      });

      return;
    }

    // Split value into sortBy and order
    const [newSortBy, newOrder] = selectedSort.split("-");

    setSortBy(newSortBy);
    setOrder(newOrder);

    // Start from page 1
    setPage(1);
    setPageArrayIndex(0);

    // Update clean URL
    updateUrl({
      page: 1,
      limit: limit,
      search: debouncedSearch,
      category: category,
      sortBy: newSortBy,
      order: newOrder,
    });
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

    // Update clean URL
    updateUrl({
      page: 1,
      limit: newLimit,
      search: debouncedSearch,
      category: category,
      sortBy: sortBy,
      order: order,
    });
  };

  // Page number click
  const handlePageChange = (pageNumber) => {
    setPage(pageNumber);

    // Update clean URL
    updateUrl({
      page: pageNumber,
      limit: limit,
      search: debouncedSearch,
      category: category,
      sortBy: sortBy,
      order: order,
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

      {/* Sorting */}
      <div>
        <label htmlFor="sort">Sort By: </label>

        <select
          id="sort"
          value={sortBy && order ? `${sortBy}-${order}` : ""}
          onChange={handleSortChange}
        >
          <option value="">Default</option>

          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>

          <option value="rating-asc">Rating: Low to High</option>
          <option value="rating-desc">Rating: High to Low</option>

          <option value="title-asc">Title: A to Z</option>
          <option value="title-desc">Title: Z to A</option>
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