/* eslint-disable react/prop-types */
import { createContext, useEffect, useState } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from "firebase/auth";
import { auth, firebaseConfigError } from "../../Firebase/firebase.config";
import { GoogleAuthProvider } from "firebase/auth";
import axios from "axios";

export const Context = createContext();

export const Provider = ({ children }) => {
    const Googleprovider = new GoogleAuthProvider();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [price, setprice] = useState(5000);  // Price for subscription

    const authConfigError = () => new Error(firebaseConfigError || "Firebase is not configured.");

    // Register
    const handleRegister = (email, password) => {
        if (!auth) return Promise.reject(authConfigError());
        return createUserWithEmailAndPassword(auth, email, password);
    };

    // Login
    const handleLogin = (email, password) => {
        if (!auth) return Promise.reject(authConfigError());
        return signInWithEmailAndPassword(auth, email, password);
    };

    // Signout
    const handleLogOut = () => {
        if (!auth) {
            setUser(null);
            setLoading(false);
            return Promise.resolve();
        }

        return signOut(auth);
    };

    const handleGoogleLogin = () => {
        if (!auth) return Promise.reject(authConfigError());
        setLoading(true);
        return signInWithPopup(auth, Googleprovider);
    }

    // Update Profile
    const manageProfile = (name, image) => {
        if (!auth?.currentUser) return Promise.reject(authConfigError());
        return updateProfile(auth.currentUser, {
            displayName: name,
            photoURL: image,
        }).then(() => {

            setUser({
                ...auth.currentUser,
                displayName: name,
                photoURL: image,
            });
        });
    };

    // Observer
    useEffect(() => {
        if (!auth) {
            console.warn(firebaseConfigError);
            setLoading(false);
            return undefined;
        }

        const unSubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
    
            try {
                if (currentUser?.email) {
                    setUser({
                        ...currentUser,
                        photoURL: currentUser.photoURL,
                    });
    
                    const { data } = await axios.post(
                        'https://product-hunt-server-green.vercel.app/jwt',
                        { email: currentUser?.email },
                        { withCredentials: true }
                    );
    
                    console.log("Login successful", data);
                } else {
                    setUser(null);
    
                    const { data } = await axios.post(
                        'https://product-hunt-server-green.vercel.app/logout',
                        {},
                        { withCredentials: true }
                    );
    
                    console.log("Logout successful", data);
                }
            } catch (error) {
                console.error("Error in authentication observer:", error);
            } finally {
                setLoading(false);
            }
        });
    
        return () => unSubscribe();
    }, []);
    


    const authInfo = {
        handleRegister,
        handleLogin,
        handleLogOut,
        handleGoogleLogin,
        manageProfile,
        user,
        setUser,
        loading,
        price,
        setprice
    };

    return (
        <Context.Provider value={authInfo}>
            {children}
        </Context.Provider>
    );
};
