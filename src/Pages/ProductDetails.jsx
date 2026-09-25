import { useEffect, useState } from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import { getProductById } from "../api/productApi";

const ProductDetails = () => {
  // Get product ID from URL
  const { id } = useParams();

  const [product, setProduct] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // --------------------------------------------------
  // FETCH PRODUCT
  // --------------------------------------------------

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getProductById(id);

        setProduct(response);
      } catch (err) {
        setError(
          err.message ||
            "Failed to load product",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="bg-light min-vh-100">
        <div className="container py-5">
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
                Loading product...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error) {
    return (
      <div className="bg-light min-vh-100">
        <div className="container py-5">
          <Link
            to="/products"
            className="btn btn-outline-dark mb-4"
          >
            ← Back to Products
          </Link>

          <div className="alert alert-danger">
            <h5 className="alert-heading">
              Unable to load product
            </h5>

            <p className="mb-3">
              {error}
            </p>

            <Link
              to="/products"
              className="btn btn-danger btn-sm"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // PRODUCT NOT FOUND
  // --------------------------------------------------

  if (!product) {
    return (
      <div className="bg-light min-vh-100">
        <div className="container py-5">
          <Link
            to="/products"
            className="btn btn-outline-dark mb-4"
          >
            ← Back to Products
          </Link>

          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <h4 className="fw-bold">
                Product not found
              </h4>

              <p className="text-muted">
                The requested product
                does not exist.
              </p>

              <Link
                to="/products"
                className="btn btn-dark"
              >
                Back to Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              Product Details
            </small>
          </div>

          <Link
            to="/products"
            className="btn btn-outline-dark btn-sm"
          >
            Back to Products
          </Link>
        </div>
      </nav>

      <main className="container py-4 py-md-5">
        {/* Back button */}
        <div className="mb-4">
          <Link
            to="/products"
            className="text-decoration-none text-dark"
          >
            ← Back to Products
          </Link>
        </div>

        {/* Product Details */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-3 p-md-5">
            <div className="row g-4 g-md-5">
              {/* Product Images */}
              <div className="col-12 col-md-5">
                <div className="bg-white border rounded p-3 text-center">
                  <img
                    src={
                      product.thumbnail
                    }
                    alt={
                      product.title
                    }
                    className="img-fluid"
                    style={{
                      width: "100%",
                      maxHeight: "350px",
                      objectFit: "contain",
                    }}
                  />
                </div>

                {/* Additional Images */}
                {product.images &&
                  product.images.length >
                    0 && (
                    <div className="row g-2 mt-2">
                      {product.images
                        .slice(0, 4)
                        .map(
                          (
                            image,
                            index,
                          ) => (
                            <div
                              className="col-3"
                              key={
                                index
                              }
                            >
                              <div className="border rounded p-1 bg-white">
                                <img
                                  src={
                                    image
                                  }
                                  alt={`${product.title} ${index + 1}`}
                                  className="img-fluid rounded"
                                  style={{
                                    height:
                                      "70px",
                                    width:
                                      "100%",
                                    objectFit:
                                      "contain",
                                  }}
                                />
                              </div>
                            </div>
                          ),
                        )}
                    </div>
                  )}
              </div>

              {/* Product Information */}
              <div className="col-12 col-md-7">
                {/* Category */}
                <span className="badge text-bg-light border mb-3">
                  {
                    product.category
                  }
                </span>

                {/* Title */}
                <h1 className="h2 fw-bold mb-3">
                  {
                    product.title
                  }
                </h1>

                {/* Brand */}
                {product.brand && (
                  <p className="text-muted mb-3">
                    Brand:{" "}
                    <strong>
                      {
                        product.brand
                      }
                    </strong>
                  </p>
                )}

                {/* Rating */}
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="badge bg-warning text-dark">
                    ★{" "}
                    {
                      product.rating
                    }
                  </span>

                  <span className="text-muted">
                    Product Rating
                  </span>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="fs-3 fw-bold">
                    $
                    {
                      product.price
                    }
                  </span>

                  {product.discountPercentage && (
                    <span className="text-success ms-3">
                      {
                        product.discountPercentage
                      }
                      % off
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="mb-4">
                  <h5 className="fw-semibold">
                    Description
                  </h5>

                  <p className="text-muted mb-0">
                    {
                      product.description
                    }
                  </p>
                </div>

                {/* Product Information */}
                <div className="border rounded p-3 mb-4">
                  <h5 className="fw-semibold mb-3">
                    Product Information
                  </h5>

                  <div className="row g-3">
                    <div className="col-6">
                      <small className="text-muted d-block">
                        Stock
                      </small>

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
                    </div>

                    <div className="col-6">
                      <small className="text-muted d-block">
                        SKU
                      </small>

                      <span className="fw-semibold">
                        {
                          product.sku ||
                            "N/A"
                        }
                      </span>
                    </div>

                    <div className="col-6">
                      <small className="text-muted d-block">
                        Availability
                      </small>

                      <span className="fw-semibold">
                        {
                          product.availabilityStatus ||
                            "N/A"
                        }
                      </span>
                    </div>

                    <div className="col-6">
                      <small className="text-muted d-block">
                        Minimum Order
                      </small>

                      <span className="fw-semibold">
                        {
                          product.minimumOrderQuantity ||
                            "N/A"
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {product.tags &&
                  product.tags.length >
                    0 && (
                    <div className="mb-4">
                      <h5 className="fw-semibold mb-2">
                        Tags
                      </h5>

                      <div className="d-flex flex-wrap gap-2">
                        {product.tags.map(
                          (
                            tag,
                          ) => (
                            <span
                              key={
                                tag
                              }
                              className="badge text-bg-light border"
                            >
                              {
                                tag
                              }
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Edit Button */}
                <Link
                  to={`/products/edit/${product.id}`}
                  className="btn btn-warning"
                >
                  Edit Product
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-body p-3 p-md-4">
            <h4 className="fw-bold mb-4">
              Reviews
            </h4>

            {product.reviews &&
            product.reviews.length >
              0 ? (
              <div className="d-flex flex-column gap-3">
                {product.reviews.map(
                  (
                    review,
                    index,
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="border rounded p-3"
                    >
                      <div className="d-flex justify-content-between align-items-start gap-3">
                        <div>
                          <h6 className="fw-semibold mb-1">
                            {
                              review.reviewerName
                            }
                          </h6>

                          <small className="text-muted">
                            {
                              review.reviewerEmail
                            }
                          </small>
                        </div>

                        <span className="badge bg-warning text-dark">
                          ★{" "}
                          {
                            review.rating
                          }
                        </span>
                      </div>

                      <p className="mt-3 mb-0 text-muted">
                        {
                          review.comment
                        }
                      </p>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-muted mb-0">
                No reviews available.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetails;