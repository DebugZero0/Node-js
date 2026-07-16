import { useContext } from "react";
import { PostContext } from "../post.context.jsx";
import { createPost, getFeed, getMyPosts, getPostDetails, likePost as likePostApi } from "../services/post.api.js";
import { acceptFollowRequest, followUser, rejectFollowRequest, unfollowUser } from "../../user/services/user.api.js";



export const usePost=()=>{
    const context = useContext(PostContext)

    const {
        loading,
        setLoading,
        posts,
        setPosts,
        feed,
        setFeed,
        selectedPost,
        setSelectedPost,
        message,
        setMessage,
    } = context

    const setSuccessMessage = (text) => setMessage(text)

    const setErrorMessage = (error, fallbackText) => {
        const text = error?.response?.data?.message || fallbackText
        setMessage(text)
    }

    const handleFeed=async ()=>{
        setLoading(true)
        try {
            const data = await getFeed()
            setFeed(data?.posts ?? [])
            setSuccessMessage(data?.message || 'Feed loaded')
        } catch (error) {
            setErrorMessage(error, 'Could not load feed')
            setFeed([])
        } finally {
            setLoading(false)
        }
    }

    const handleCreatePost = async (caption, imageFile) => {
        if (!imageFile) {
            setMessage('Please select an image')
            return false
        }

        setLoading(true)
        try {
            const data = await createPost(caption, imageFile)
            setSuccessMessage(data?.message || 'Post created')
            await handleMyPosts()
            await handleFeed()
            return true
        } catch (error) {
            setErrorMessage(error, 'Could not create post')
            return false
        } finally {
            setLoading(false)
        }
    }

    const handleMyPosts = async () => {
        setLoading(true)
        try {
            const data = await getMyPosts()
            setPosts(data?.posts ?? [])
            setSuccessMessage(data?.message || 'Posts loaded')
            return data?.posts ?? []
        } catch (error) {
            setErrorMessage(error, 'Could not load your posts')
            setPosts([])
            return []
        } finally {
            setLoading(false)
        }
    }

    const handlePostDetails = async (postId) => {
        if (!postId) {
            setMessage('Please provide post id')
            return null
        }
        setLoading(true)
        try {
            const data = await getPostDetails(postId)
            setSelectedPost(data?.post ?? null)
            setSuccessMessage(data?.message || 'Post details loaded')
            return data?.post ?? null
        } catch (error) {
            setErrorMessage(error, 'Could not load post details')
            setSelectedPost(null)
            return null
        } finally {
            setLoading(false)
        }
    }

    const handleLikePost = async (postId) => {
        setLoading(true)
        try {
            const data = await likePostApi(postId)
            setSuccessMessage(data?.message || 'Post liked')
            return true
        } catch (error) {
            setErrorMessage(error, 'Could not like post')
            return false
        } finally {
            setLoading(false)
        }
    }

    const runUserAction = async (fn, username, fallbackMessage) => {
        if (!username) {
            setMessage('Please provide a username')
            return false
        }

        setLoading(true)
        try {
            const data = await fn(username)
            setSuccessMessage(data?.message || 'Action completed')
            return true
        } catch (error) {
            setErrorMessage(error, fallbackMessage)
            return false
        } finally {
            setLoading(false)
        }
    }

    const handleFollow = (username) => runUserAction(followUser, username, 'Could not follow user')
    const handleUnfollow = (username) => runUserAction(unfollowUser, username, 'Could not unfollow user')
    const handleAcceptFollow = (username) => runUserAction(acceptFollowRequest, username, 'Could not accept follow request')
    const handleRejectFollow = (username) => runUserAction(rejectFollowRequest, username, 'Could not reject follow request')

    return {
        loading,
        posts,
        feed,
        selectedPost,
        message,
        handleFeed,
        handleCreatePost,
        handleMyPosts,
        handlePostDetails,
        handleLikePost,
        handleFollow,
        handleUnfollow,
        handleAcceptFollow,
        handleRejectFollow,
    }
}