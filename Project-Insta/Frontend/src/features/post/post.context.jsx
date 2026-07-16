import { createContext, useState } from "react";

// object that will hold the state of the post and a function to update it

export const PostContext = createContext()

export const PostProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [posts, setPosts] = useState([]);
    const [feed, setFeed] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [message, setMessage] = useState('');

    const value = {
        posts,
        setPosts,
        loading,
        setLoading,
        feed,
        setFeed,
        selectedPost,
        setSelectedPost,
        message,
        setMessage
    };

    return (
        <PostContext.Provider value={value}>
            {children}
        </PostContext.Provider>
    );
};
