import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import FormInput from "../../components/FormInput";
import Button from "../../components/Button";
import axios from "../../services/api";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    walletAddress: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!avatar) return alert("Avatar is required.");

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("avatar", avatar);

    try {
      setLoading(true);
      await axios.post("/user/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Registration successful!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 relative">
      <div className="w-full max-w-xl bg-transparent rounded-3xl  p-8 relative">
        {/* Overlay Spinner when loading */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-3xl">
            <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-slow-spin"></div>
          </div>
        )}

        <div className="bg-white shadow-lg rounded-3xl p-8 w-full max-w-xl animate-fade-in relative z-0">
          <h2 className="text-3xl font-bold text-indigo-700 text-center mb-6">
            Register
          </h2>

          <form
            onSubmit={handleSubmit}
            encType="multipart/form-data"
            className="space-y-5"
          >
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-4 w-24 h-24 rounded-full object-cover mx-auto shadow-md"
              />
            )}

            <FormInput
              label="Full Name"
              name="fullname"
              value={form.fullname}
              onChange={handleChange}
              placeholder="John Doe"
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="john@example.com"
            />

            <div className="relative">
              <FormInput
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute top-[38px] right-3 text-sm text-blue-600"
                onClick={togglePassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <FormInput
              label="Wallet Address"
              name="walletAddress"
              value={form.walletAddress}
              onChange={handleChange}
              placeholder="0x..."
            />

            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Upload Avatar
              </label>
              <input
                type="file"
                accept="image/*"
                name="avatar"
                onChange={handleFileChange}
                className="block w-full border border-gray-300 p-2 rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-lg transition"
              >
                Register
              </button>
            </div>

            <div className="text-right text-sm">
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <p className="text-center text-sm text-gray-600 mt-4">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-600 hover:underline font-medium"
              >
                Login here
              </Link>
            </p>
          </form>
        </div>
      </div>
      <style>{`
      @keyframes slow-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .animate-slow-spin {
        animation: slow-spin 1.6s linear infinite;
      }
    `}</style>
    </div>
  );
};

export default Register;
