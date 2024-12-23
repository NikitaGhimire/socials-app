import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);

    // Load user data from localStorage on initial load (if exists)
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) {
            setUser(storedUser);
        }
    }, []);
    const login = (userData) => {
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
    };

    const updateUser = (updatedUserData) => {
        localStorage.setItem("user", JSON.stringify(updatedUserData));
        setUser(updatedUserData);
    };

    return (
        <AuthContext.Provider value={{user, login, logout, updateUser}}>
            { children }
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);