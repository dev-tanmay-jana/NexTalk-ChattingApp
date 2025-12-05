import { createContext } from "react";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { io } from "socket.io-client";


const API_URL = import.meta.env.VITE_API_URL;
axios.defaults.baseURL = API_URL;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);

    //check if user is authenticated and if so,set the authUser state
    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/user/getuser");
            if (data.success) {
                // server returns the authenticated user in data (not nested under `user`)
                setAuthUser(data.data);
                connectSocket(data.data);
            }
        } catch (error) {
            toast.error("Session expired. Please log in again.");
        }
    };

    //login user by setting token and storing it in localStorage
    const loginUser = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/user/${state}`, credentials);
            if (data.success) {
                setAuthUser(data.data.user);
                connectSocket(data.data.user);
                axios.defaults.headers.common["Authorization"] = `Bearer ${data.data.token}`;
                setToken(data.data.token);
                localStorage.setItem("token", data.data.token);
                toast.success(data.data.message);
                return true;
            } else {
                toast.error(data.message || `${state} failed`);
                console.log(data.message);
                return false;
            }
        } catch (error) {
            const errorMsg = error?.response?.data?.message || `${state} failed`;
            toast.error(errorMsg);
            console.log(errorMsg);
            return false;
        }
    };

    //logout user by clearing token and authUser state
    const logoutUser = () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        axios.defaults.headers.common["Authorization"] = null;
        if (socket) {
            socket.disconnect();
            setSocket(null);
        }
        toast.success("Logged out successfully");
    };
    //update user profile
    const updateProfile = async (profileData) => {
        try {
            const { data } = await axios.put("/user/updateprofile", profileData);
            if (data.success) {
                setAuthUser(data.data);
                toast.success(data.message);
            } else {
                toast.error(data.message || "Profile update failed");
            }
        } catch (error) {
            const errorMsg = error?.response?.data?.message || "Profile update failed";
            toast.error(errorMsg);
        }
    };

    //connect socket and handle socket connection and online users
    const connectSocket = (userData) => {
        if(!userData || socket?.connected) return;
        const newSocket = io(API_URL, {
            query: { userId: userData._id },
        });
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("connect", () => {
            // console.log("Socket connected:", newSocket.id);
            });

            newSocket.on("online-users", (userIds) => {
            setOnlineUsers(userIds);
            });
    };

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            checkAuth();
        } else {
            delete axios.defaults.headers.common["Authorization"];
            setAuthUser(null);
        }
    },[token]);

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        token,
        loginUser,
        logoutUser,
        updateProfile,
    };
    return ( 
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};