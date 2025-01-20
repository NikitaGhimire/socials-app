import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);

    // Load user data from localStorage on initial load (if exists)
    useEffect(() => {
        try{
            const storedUser = JSON.parse(localStorage.getItem("user"));
            if (storedUser) {
                setUser(storedUser);
            }
        } catch (err){
            console.error("Failed to parse user from localStorage:", err);
            setUser(null);
        }
        }, []);
    const login = (userData) => {
        try {
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
        } catch (err) {
            console.error("Error during login:", err);
        }
    };

    const logout = () => {
        try {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            setUser(null);
        } catch (err) {
            console.error("Error during logout:", err);
        }
    };

    const updateUser = (updatedUserData) => {
        try {
            localStorage.setItem("user", JSON.stringify(updatedUserData));
            setUser(updatedUserData);
        } catch (err) {
            console.error("Error updating user:", err);
        }
    };

    return (
        <AuthContext.Provider value={{user, login, logout, updateUser}}>
            { children }
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);