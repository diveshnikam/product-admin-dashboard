import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  getProducts,
  searchProducts,
  getCategories,
  getProductsByCategory,
} from "../api/productApi";

const Products = () => {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const navigate = useNavigate();

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

    if (search.trim()) {
      params.search = search;
    }

    if (category) {
      params.category = category;
    }

    if (sortBy && order) {
      params.sortBy = sortBy;
      params.order = order;
    }

    setSearchParams(params);
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Read values from URL
  const urlPage = Number(searchParams.get("page"));
  const urlLimit = Number(searchParams.get("limit"));
  const urlSearch =
    searchParams.get("search") || "";
  const urlCategory =
    searchParams.get("category") || "";
  const urlSortBy =
    searchParams.get("sortBy") || "";
  const urlOrder =
    searchParams.get("order") || "";

  // Validate page
  const pageValue =
    urlPage > 0 && Number.isInteger(urlPage)
      ? urlPage
      : 1;

  // Validate limit
  const limitValue = [10, 20, 50].includes(
    urlLimit,
  )
    ? urlLimit
    : 10;

  // Validate sorting
  const validSortBy = [
    "price",
    "rating",
    "title",
  ];

  const validOrder = ["asc", "desc"];

  const isValidSorting =
    validSortBy.includes(urlSortBy) &&
    validOrder.includes(urlOrder);

  const sortByValue = isValidSorting
    ? urlSortBy
    : "";

  const orderValue = isValidSorting
    ? urlOrder
    : "";

  const [page, setPage] =
    useState(pageValue);

  const [limit, setLimit] =
    useState(limitValue);

  const [total, setTotal] =
    useState(0);

  // Categories
  const [categories, setCategories] =
    useState([]);

  const [
    categoriesLoaded,
    setCategoriesLoaded,
  ] = useState(false);

  // Category
  const [category, setCategory] =
    useState(urlCategory);

  // Sorting
  const [sortBy, setSortBy] =
    useState(sortByValue);

  const [order, setOrder] =
    useState(orderValue);

  // Pagination page group
  const [
    pageArrayIndex,
    setPageArrayIndex,
  ] = useState(
    Math.floor((pageValue - 1) / 5),
  );

  // Search
  const [search, setSearch] =
    useState(
      urlCategory ? "" : urlSearch,
    );

  // Debounced search
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState(
    urlCategory ? "" : urlSearch,
  );

  // Prevent first search effect
  // from resetting page
  const isFirstSearchRender =
    useRef(true);

  // Used to prevent stale API responses
  const requestIdRef = useRef(0);

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem(
      "accessToken",
    );

    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  // --------------------------------------------------
  // SEARCH DEBOUNCE
  // --------------------------------------------------

  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current =
        false;

      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(search);

      // Search and category are mutually exclusive
      if (search.trim()) {
        setCategory("");
      }

      // Search always starts from page 1
      setPage(1);
      setPageArrayIndex(0);

      updateUrl({
        page: 1,
        limit: limit,
        search: search,
        category: search.trim()
          ? ""
          : category,
        sortBy: sortBy,
        order: order,
      });
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // --------------------------------------------------
  // FETCH CATEGORIES
  // --------------------------------------------------

  useEffect(() => {
    const fetchCategories =
      async () => {
        try {
          const response =
            await getCategories();

          setCategories(response);

          // Check category from URL
          const isValidCategory =
            response.some(
              (item) =>
                item.slug ===
                urlCategory,
            );

          // Invalid category
          if (
            urlCategory &&
            !isValidCategory
          ) {
            setCategory("");

            if (urlSearch) {
              setSearch(urlSearch);
              setDebouncedSearch(
                urlSearch,
              );
            }

            updateUrl({
              page: pageValue,
              limit: limitValue,
              search: urlSearch,
              category: "",
              sortBy: sortByValue,
              order: orderValue,
            });
          }

          // Search + category
          // Category gets priority
          if (
            urlCategory &&
            isValidCategory &&
            urlSearch
          ) {
            setSearch("");
            setDebouncedSearch("");

            updateUrl({
              page: pageValue,
              limit: limitValue,
              search: "",
              category: urlCategory,
              sortBy: sortByValue,
              order: orderValue,
            });
          }

          // Invalid sorting
          if (
            (urlSortBy || urlOrder) &&
            !isValidSorting
          ) {
            setSortBy("");
            setOrder("");

            updateUrl({
              page: pageValue,
              limit: limitValue,
              search:
                urlCategory &&
                isValidCategory
                  ? ""
                  : urlSearch,
              category:
                isValidCategory
                  ? urlCategory
                  : "",
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

  // --------------------------------------------------
  // FETCH PRODUCTS
  // --------------------------------------------------

  const fetchProducts = async () => {
    const requestId =
      ++requestIdRef.current;

    try {
      setLoading(true);
      setError("");

      const skip = Math.max(
        0,
        (page - 1) * limit,
      );

      const params = {
        limit: limit,
        skip: skip,
      };

      // Sorting
      if (sortBy && order) {
        params.sortBy = sortBy;
        params.order = order;
      }

      let response;

      // Category
      if (category) {
        response =
          await getProductsByCategory(
            category,
            params,
          );
      }

      // Search
      else if (
        debouncedSearch.trim()
      ) {
        response =
          await searchProducts({
            q: debouncedSearch,
            ...params,
          });
      }

      // All products
      else {
        response =
          await getProducts(params);
      }

      // Ignore old request
      if (
        requestId !==
        requestIdRef.current
      ) {
        return;
      }

      setTotal(response.total);

      const totalPages =
        Math.ceil(
          response.total / limit,
        );

      // Invalid page
      if (
        page > totalPages &&
        totalPages > 0
      ) {
        setPage(totalPages);

        setPageArrayIndex(
          Math.floor(
            (totalPages - 1) / 5,
          ),
        );

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

      setProducts(
        response.products,
      );
    } catch (err) {
      if (
        requestId !==
        requestIdRef.current
      ) {
        return;
      }

      setError(
        err.message ||
          "Failed to load products",
      );
    } finally {
      if (
        requestId ===
        requestIdRef.current
      ) {
        setLoading(false);
      }
    }
  };

  // Fetch whenever filters/pagination change
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

  // --------------------------------------------------
  // CATEGORY
  // --------------------------------------------------

  const handleCategoryChange = (
    e,
  ) => {
    const selectedCategory =
      e.target.value;

    setCategory(
      selectedCategory,
    );

    // Clear search
    setSearch("");
    setDebouncedSearch("");

    // Start page 1
    setPage(1);
    setPageArrayIndex(0);

    updateUrl({
      page: 1,
      limit: limit,
      search: "",
      category:
        selectedCategory,
      sortBy: sortBy,
      order: order,
    });
  };

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const handleSearchChange = (
    e,
  ) => {
    const value = e.target.value;

    setSearch(value);

    // Clear category when searching
    if (value.trim()) {
      setCategory("");
    }
  };

  // --------------------------------------------------
  // SORT
  // --------------------------------------------------

  const handleSortChange = (
    e,
  ) => {
    const selectedSort =
      e.target.value;

    // Default sorting
    if (!selectedSort) {
      setSortBy("");
      setOrder("");
      setPage(1);
      setPageArrayIndex(0);

      updateUrl({
        page: 1,
        limit: limit,
        search:
          debouncedSearch,
        category: category,
      });

      return;
    }

    const [
      newSortBy,
      newOrder,
    ] = selectedSort.split("-");

    setSortBy(newSortBy);
    setOrder(newOrder);

    setPage(1);
    setPageArrayIndex(0);

    updateUrl({
      page: 1,
      limit: limit,
      search:
        debouncedSearch,
      category: category,
      sortBy: newSortBy,
      order: newOrder,
    });
  };

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------

  const totalPages =
    Math.ceil(total / limit);

  const pageNumbers =
    Array.from(
      { length: totalPages },
      (_, index) =>
        index + 1,
    );

  const pageArrays = [];

  for (
    let i = 0;
    i < pageNumbers.length;
    i += 5
  ) {
    pageArrays.push(
      pageNumbers.slice(
        i,
        i + 5,
      ),
    );
  }

  const visiblePages =
    pageArrays[
      pageArrayIndex
    ] || [];

  // Product range
  const startProduct =
    total > 0
      ? (page - 1) * limit + 1
      : 0;

  const endProduct =
    Math.min(
      page * limit,
      total,
    );

  // Previous page group
  const handlePrevious =
    () => {
      if (pageArrayIndex > 0) {
        setPageArrayIndex(
          pageArrayIndex - 1,
        );
      }
    };

  // Next page group
  const handleNext = () => {
    if (
      pageArrayIndex <
      pageArrays.length - 1
    ) {
      setPageArrayIndex(
        pageArrayIndex + 1,
      );
    }
  };

  // Page size
  const handleLimitChange = (
    e,
  ) => {
    const newLimit = Number(
      e.target.value,
    );

    setLimit(newLimit);
    setPage(1);
    setPageArrayIndex(0);

    updateUrl({
      page: 1,
      limit: newLimit,
      search:
        debouncedSearch,
      category: category,
      sortBy: sortBy,
      order: order,
    });
  };

  // Page number
  const handlePageChange = (
    pageNumber,
  ) => {
    setPage(pageNumber);

    updateUrl({
      page: pageNumber,
      limit: limit,
      search:
        debouncedSearch,
      category: category,
      sortBy: sortBy,
      order: order,
    });
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="bg-light min-vh-100">
      {/* Header */}
      <nav className="navbar bg-white border-bottom">
        <div className="container">
          <div>
            <h4 className="mb-0 fw-bold">
              Product Dashboard
            </h4>

            <small className="text-muted">
              Manage your products
            </small>
          </div>

          {/* Logout */}
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="container py-4 py-md-5">
        {/* Page heading */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">
              Products
            </h1>

            <p className="text-muted mb-0">
              Browse and manage products
            </p>
          </div>

          {/* Add Product */}
          <Link
            to="/products/new"
            className="btn btn-dark"
          >
            + Add Product
          </Link>
        </div>

        {/* Filters */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-3 p-md-4">
            <div className="row g-3">
              {/* Search */}
              <div className="col-12 col-md-5">
                <label
                  htmlFor="search"
                  className="form-label fw-semibold"
                >
                  Search
                </label>

                <input
                  id="search"
                  type="text"
                  className="form-control"
                  placeholder="Search products..."
                  value={search}
                  onChange={
                    handleSearchChange
                  }
                />
              </div>

              {/* Category */}
              <div className="col-12 col-md-3">
                <label
                  htmlFor="category"
                  className="form-label fw-semibold"
                >
                  Category
                </label>

                <select
                  id="category"
                  className="form-select"
                  value={category}
                  onChange={
                    handleCategoryChange
                  }
                >
                  <option value="">
                    All Categories
                  </option>

                  {categories.map(
                    (
                      categoryItem,
                    ) => (
                      <option
                        key={
                          categoryItem.slug
                        }
                        value={
                          categoryItem.slug
                        }
                      >
                        {
                          categoryItem.name
                        }
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Sorting */}
              <div className="col-12 col-md-4">
                <label
                  htmlFor="sort"
                  className="form-label fw-semibold"
                >
                  Sort By
                </label>

                <select
                  id="sort"
                  className="form-select"
                  value={
                    sortBy &&
                    order
                      ? `${sortBy}-${order}`
                      : ""
                  }
                  onChange={
                    handleSortChange
                  }
                >
                  <option value="">
                    Default
                  </option>

                  <option value="price-asc">
                    Price: Low to
                    High
                  </option>

                  <option value="price-desc">
                    Price: High to
                    Low
                  </option>

                  <option value="rating-asc">
                    Rating: Low to
                    High
                  </option>

                  <option value="rating-desc">
                    Rating: High to
                    Low
                  </option>

                  <option value="title-asc">
                    Title: A to Z
                  </option>

                  <option value="title-desc">
                    Title: Z to A
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <div
                className="spinner-border mb-3"
                role="status"
              >
                <span className="visually-hidden">
                  Loading...
                </span>
              </div>

              <p className="text-muted mb-0">
                Loading products...
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="alert alert-danger">
            <h6 className="alert-heading">
              Unable to load products
            </h6>

            <p className="mb-3">
              {error}
            </p>

            <button
              className="btn btn-danger btn-sm"
              onClick={
                fetchProducts
              }
            >
              Retry
            </button>
          </div>
        )}

        {/* Products */}
        {!loading &&
          !error && (
            <>
              {products.length >
              0 ? (
                <>
                  {/* Desktop Table */}
                  <div className="card border-0 shadow-sm d-none d-md-block">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="px-4 py-3">
                              Product
                            </th>

                            <th>
                              Category
                            </th>

                            <th>
                              Price
                            </th>

                            <th>
                              Rating
                            </th>

                            <th>
                              Stock
                            </th>

                            <th className="text-end px-4">
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {products.map(
                            (
                              product,
                            ) => (
                              <tr
                                key={
                                  product.id
                                }
                              >
                                <td className="px-4">
                                  <div className="d-flex align-items-center gap-3">
                                    <img
                                      src={
                                        product.thumbnail
                                      }
                                      alt={
                                        product.title
                                      }
                                      className="rounded border"
                                      style={{
                                        width:
                                          "60px",
                                        height:
                                          "60px",
                                        objectFit:
                                          "contain",
                                      }}
                                    />

                                    <div>
                                      <div className="fw-semibold">
                                        {
                                          product.title
                                        }
                                      </div>

                                      {product.brand && (
                                        <small className="text-muted">
                                          {
                                            product.brand
                                          }
                                        </small>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  <span className="badge text-bg-light border">
                                    {
                                      product.category
                                    }
                                  </span>
                                </td>

                                <td className="fw-semibold">
                                  $
                                  {
                                    product.price
                                  }
                                </td>

                                <td>
                                  <span className="badge bg-warning text-dark">
                                    ★{" "}
                                    {
                                      product.rating
                                    }
                                  </span>
                                </td>

                                <td>
                                  <span
                                    className={
                                      product.stock >
                                      0
                                        ? "text-success"
                                        : "text-danger"
                                    }
                                  >
                                    {
                                      product.stock
                                    }
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="text-end px-4">
                                  <div className="d-flex justify-content-end gap-2">
                                    {/* View */}
                                    <Link
                                      to={`/products/${product.id}`}
                                      className="btn btn-sm btn-outline-dark"
                                    >
                                      View
                                    </Link>

                                    {/* Edit */}
                                    <Link
                                      to="/products/new"
                                      className="btn btn-sm btn-outline-warning"
                                    >
                                      Edit
                                    </Link>

                                    {/* Delete - logic will be added later */}
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="d-md-none">
                    <div className="row g-3">
                      {products.map(
                        (
                          product,
                        ) => (
                          <div
                            className="col-12"
                            key={
                              product.id
                            }
                          >
                            <div className="card border-0 shadow-sm h-100">
                              <div className="row g-0">
                                {/* Image */}
                                <div className="col-4">
                                  <div
                                    className="h-100 d-flex align-items-center justify-content-center bg-white rounded-start"
                                    style={{
                                      minHeight:
                                        "160px",
                                    }}
                                  >
                                    <img
                                      src={
                                        product.thumbnail
                                      }
                                      alt={
                                        product.title
                                      }
                                      className="img-fluid p-2"
                                      style={{
                                        maxHeight:
                                          "150px",
                                        objectFit:
                                          "contain",
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Content */}
                                <div className="col-8">
                                  <div className="card-body p-3">
                                    <span className="badge text-bg-light border mb-2">
                                      {
                                        product.category
                                      }
                                    </span>

                                    <h5 className="card-title fw-semibold mb-2">
                                      {
                                        product.title
                                      }
                                    </h5>

                                    <div className="d-flex align-items-center gap-2 mb-2">
                                      <span className="fw-bold">
                                        $
                                        {
                                          product.price
                                        }
                                      </span>

                                      <span className="badge bg-warning text-dark">
                                        ★{" "}
                                        {
                                          product.rating
                                        }
                                      </span>
                                    </div>

                                    <p className="text-muted small mb-3">
                                      Stock:{" "}
                                      <span
                                        className={
                                          product.stock >
                                          0
                                            ? "text-success fw-semibold"
                                            : "text-danger fw-semibold"
                                        }
                                      >
                                        {
                                          product.stock
                                        }
                                      </span>
                                    </p>

                                    {/* Mobile Actions */}
                                    <div className="d-flex gap-2">
                                      {/* View */}
                                      <Link
                                        to={`/products/${product.id}`}
                                        className="btn btn-sm btn-outline-dark flex-fill"
                                      >
                                        View
                                      </Link>

                                      {/* Edit */}
                                      <Link
                                        to={`/products/edit/${product.id}`}
                                        className="btn btn-sm btn-outline-warning flex-fill"
                                      >
                                        Edit
                                      </Link>

                                      {/* Delete - logic will be added later */}
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger flex-fill"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Empty state */
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center py-5">
                    <h5 className="fw-semibold">
                      No products
                      found
                    </h5>

                    <p className="text-muted mb-0">
                      Try changing
                      your search
                      or filters.
                    </p>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {products.length >
                0 && (
                <div className="card border-0 shadow-sm mt-4">
                  <div className="card-body p-3">
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-center gap-3">
                      {/* Showing */}
                      <div className="text-muted small text-center text-lg-start">
                        Showing{" "}
                        <strong>
                          {
                            startProduct
                          }
                        </strong>
                        –
                        <strong>
                          {
                            endProduct
                          }
                        </strong>{" "}
                        of{" "}
                        <strong>
                          {total}
                        </strong>
                      </div>

                      {/* Pagination */}
                      {totalPages >
                        0 && (
                        <div className="d-flex align-items-center gap-1 flex-wrap justify-content-center">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={
                              handlePrevious
                            }
                            disabled={
                              pageArrayIndex ===
                              0
                            }
                          >
                            Previous
                          </button>

                          {visiblePages.map(
                            (
                              pageNumber,
                            ) => (
                              <button
                                key={
                                  pageNumber
                                }
                                className={`btn btn-sm ${
                                  page ===
                                  pageNumber
                                    ? "btn-dark"
                                    : "btn-outline-secondary"
                                }`}
                                onClick={() =>
                                  handlePageChange(
                                    pageNumber,
                                  )
                                }
                              >
                                {
                                  pageNumber
                                }
                              </button>
                            ),
                          )}

                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={
                              handleNext
                            }
                            disabled={
                              pageArrayIndex ===
                              pageArrays.length -
                                1
                            }
                          >
                            Next
                          </button>
                        </div>
                      )}

                      {/* Page size */}
                      <div className="d-flex align-items-center gap-2">
                        <label
                          htmlFor="pageSize"
                          className="small text-muted"
                        >
                          Per
                          page:
                        </label>

                        <select
                          id="pageSize"
                          className="form-select form-select-sm"
                          style={{
                            width:
                              "75px",
                          }}
                          value={
                            limit
                          }
                          onChange={
                            handleLimitChange
                          }
                        >
                          <option value={10}>
                            10
                          </option>

                          <option value={20}>
                            20
                          </option>

                          <option value={50}>
                            50
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Page information */}
                    {totalPages >
                      0 && (
                      <div className="text-center text-muted small mt-3">
                        Page{" "}
                        {page}{" "}
                        of{" "}
                        {
                          totalPages
                        }
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
      </main>
    </div>
  );
};

export default Products;