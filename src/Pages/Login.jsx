import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import loginUser from "../api/authApi";

const Login = () => {
  const nav = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    password: "",
    form: "",
    server: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      nav("/products");
    }
  }, [nav]);

  const validateUsername = (value) => {
    if (!value.trim()) {
      return "Username is required";
    }

    return "";
  };

  const validatePassword = (value) => {
    if (!value.trim()) {
      return "Password is required";
    }

    return "";
  };

  

  const submit = async (e) => {
    e.preventDefault();

    setErrors({
      ...errors,
      form: "",
      server: "",
    });

    const usernameValidation = validateUsername(form.username);
    const passwordValidation = validatePassword(form.password);

    setErrors({
      ...errors,
      username: usernameValidation,
      password: passwordValidation,
    });

    if (!usernameValidation && !passwordValidation) {
      try {
        setLoading(true);

        const response = await loginUser({
          username: form.username.trim().toLowerCase(),
          password: form.password,
        });

        localStorage.setItem("accessToken", response.accessToken);
        localStorage.setItem("user", JSON.stringify(response));

        nav("/products");
      } catch (err) {
        setErrors({
          ...errors,
          server: err.message || "Login failed. Please try again.",
        });

        setTimeout(() => {
          setErrors((prev) => ({
            ...prev,
            server: "",
          }));
        }, 3500);
      } finally {
        setLoading(false);
      }
    } else {
      setErrors({
        ...errors,
        username: usernameValidation,
        password: passwordValidation,
        form: "Please correct all highlighted fields before submitting.",
      });

      setTimeout(() => {
        setErrors((prev) => ({
          ...prev,
          form: "",
        }));
      }, 3500);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
            <div className="card shadow border-0 p-4 rounded-4">
              <h3 className="fw-bold mb-4 text-center">Product Admin Login</h3>

              {errors.form && (
                <div className="alert alert-light d-flex align-items-center mb-3">
                  <span className="text-danger">{errors.form}</span>
                </div>
              )}

              {errors.server && (
                <div className="alert alert-light d-flex align-items-center mb-3">
                  <span className="text-danger">{errors.server}</span>
                </div>
              )}

              <form onSubmit={submit}>
                <div className="mb-3">
                  <label className="form-label">Username</label>

                  <input
                    type="text"
                    className={`form-control ${
                      errors.username ? "is-invalid" : ""
                    }`}
                    placeholder="Enter username"
                    value={form.username}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        username: e.target.value,
                      });

                      setErrors({
                        ...errors,
                        username: validateUsername(e.target.value),
                      });
                    }}
                  />

                  {errors.username && (
                    <small className="text-danger">{errors.username}</small>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>

                  <input
                    type="password"
                    className={`form-control ${
                      errors.password ? "is-invalid" : ""
                    }`}
                    placeholder="Enter password"
                    value={form.password}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        password: e.target.value,
                      });

                      setErrors({
                        ...errors,
                        password: validatePassword(e.target.value),
                      });
                    }}
                  />

                  {errors.password && (
                    <small className="text-danger">{errors.password}</small>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-dark w-100 mt-3 py-2"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="text-center small text-muted mt-4">
                <div>
                  Demo Username: <strong>emilys</strong>
                </div>

                <div className="mt-1">
                  Demo Password: <strong>emilyspass</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;