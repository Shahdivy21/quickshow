// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_API_URL;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shows, setShows] = useState([]);
  const [showsLoading, setShowsLoading] = useState(true);
  const [favoritesMovies, setFavoriteMovies] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL;
  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  // -----------------------------
  // Load user on page refresh
  // -----------------------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.post(`${API_URL}/api/auth/is-authenticated`, {}, { withCredentials: true });
        if (res.data.success) {
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
        } else {
          setUser(null);
          localStorage.removeItem("user");
        }
      } catch (err) {
        setUser(null);
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [API_URL]);

  // -----------------------------
  // Login
  // -----------------------------
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password }, { withCredentials: true });
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        toast.success("Login Successful! Welcome back 🎬");
      }

      return res.data;
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Login failed" };
    }
  };

  // -----------------------------
  // Register
  // -----------------------------
  const register = async (name, email, password, profilePicFile) => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      if (profilePicFile) formData.append("profilePic", profilePicFile);

      const res = await axios.post(`${API_URL}/api/auth/register`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        toast.success("Account Created Successfully! Welcome to QuickShow 🎉");
      }

      return res.data;
    } catch (err) {
      console.error(err);
      return { success: false, message: err.response?.data?.message || "Registration failed" };
    }
  };

  // -----------------------------
  // Logout
  // -----------------------------
  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      localStorage.removeItem("user");
      toast.success("Logged out successfully. See you soon! 👋");
    } catch (err) {
      console.error(err);
    }
  };

  // -----------------------------
  // Upload Profile Picture
  // -----------------------------
  const uploadProfilePic = async (file) => {
    try {
      const formData = new FormData();
      formData.append("profilePic", file);

      const res = await axios.post(`${API_URL}/api/user/upload-profile-pic`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        const updatedUser = { ...user, profilePic: res.data.profilePic };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      return res.data;
    } catch (err) {
      console.error("Upload profile picture failed:", err);
      return { success: false, message: err.response?.data?.message || "Upload failed" };
    }
  };

  // -----------------------------
  // Fetch Shows
  // -----------------------------
  const fetchShows = async () => {
    setShowsLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/shows/all`);
      if (data.success) setShows(data.shows);
    } catch (err) {
      console.error("Fetch shows error:", err);
      // Don't show toast on every refresh if possible, or handle silenty
    } finally {
      setShowsLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  // -----------------------------
  // Fetch Favorite Movies
  // -----------------------------
  const fetchFavoriteMovies = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get(`${API_URL}/api/favorites`, { withCredentials: true });
      if (data.success) setFavoriteMovies(data.favorites || []);
    } catch (err) {
      console.error("Fetch favorite movies error:", err);
    }
  };

  useEffect(() => {
    if (user) fetchFavoriteMovies();
  }, [user]);

  // -----------------------------
  // Toggle Favorite Movie
  // -----------------------------
  const toggleFavoriteMovie = async ({ movieId, title, poster_path }) => {
    if (!user) return toast.error("Login to manage favorites");
    try {
      const { data } = await axios.post(`${API_URL}/api/favorites/toggle`, {
        movieId,
        title,
        poster_path
      }, { withCredentials: true });

      if (data.success) {
        setFavoriteMovies(data.favorites);
        toast.success(data.message);
      } else toast.error(data.message || "Failed to update favorite");
    } catch (err) {
      console.error("Toggle favorite error:", err);
      toast.error("Failed to update favorite");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        uploadProfilePic,
        shows,
        showsLoading,
        favoritesMovies,
        fetchFavoriteMovies,
        toggleFavoriteMovie,
        image_base_url,
        API_URL,
        axios,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);