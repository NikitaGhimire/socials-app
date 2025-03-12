// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContex";
import "../styles/login.css";
import Footer from '../components/Footer';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post("/users/login", { email, password });
            // Save the token and user data to localStorage
            localStorage.setItem("token", data.token);  // Save the token
            localStorage.setItem("user", JSON.stringify(data));  // Save user data
            login(data); // Save user data in context
            navigate("/"); // Redirect to home/dashboard
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        }
    };

    return (
        <>
            <div className="login-container">
                <div className="auth-wrapper">
                    <div className="decoration-section">
                        <div className="circles">
                            <div className="circle one"></div>
                            <div className="circle two"></div>
                            <div className="circle three"></div>
                        </div>
                        <div className="content">
                            <h2>Connect with friends</h2>
                            <p>Share moments, chat with friends, and stay connected with your loved ones.</p>
                        </div>
                    </div>
                    <div className="login-box">
                        <h2 className="login-title">Welcome</h2>
                        {error && <p className="error-message">{error}</p>}
                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="login-button"
                                disabled={!email || !password}
                            >
                                Login
                            </button>
                        </form>
                        <p className="register-link">
                            Don't have an account? <Link to="/register">Register</Link>
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Login;