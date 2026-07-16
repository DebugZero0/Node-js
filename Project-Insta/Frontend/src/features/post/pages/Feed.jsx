import React,{useEffect, useState} from 'react'
import '../styles/feed.scss'
import Post from '../components/Post'
import { usePost } from '../hooks/usePost'
import { useAuth } from '../../auth/hooks/useAuth'
import { useNavigate } from 'react-router'

const Feed = () => {
  const {
    feed,
    posts,
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
    loading,
  } = usePost()
  const { user, handleLogout } = useAuth()
  const navigate = useNavigate()

  const [caption, setCaption] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [targetUsername, setTargetUsername] = useState('')
  const [postId, setPostId] = useState('')

  useEffect(() => {
    handleFeed()
    handleMyPosts()
  }, [])

  const submitCreatePost = async (e) => {
    e.preventDefault()
    const ok = await handleCreatePost(caption, imageFile)
    if (ok) {
      setCaption('')
      setImageFile(null)
      e.target.reset()
    }
  }

  const submitPostDetail = async (e) => {
    e.preventDefault()
    await handlePostDetails(postId)
  }

  const logout = async () => {
    const ok = await handleLogout()
    if (ok) {
      navigate('/login')
    }
  }

  if (loading) {
    return (<main><h1>Feed is loading...</h1></main>)
  }

  return (
    <main className='feed-page'>
        <div className="feed-shell">
            <section className='panel profile-panel'>
              <h2>Welcome {user?.username}</h2>
              <p>{user?.email}</p>
              <button onClick={logout}>Logout</button>
              {message ? <p className='status-message'>{message}</p> : null}
            </section>

            <section className='panel'>
              <h2>Create Post</h2>
              <form onSubmit={submitCreatePost} className='inline-form'>
                <input
                  type='text'
                  placeholder='Write caption'
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
                <input
                  type='file'
                  accept='image/*'
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                <button type='submit'>Create</button>
              </form>
            </section>

            <section className='panel'>
              <h2>Follow Controls</h2>
              <div className='inline-form'>
                <input
                  type='text'
                  placeholder='Target username'
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                />
              </div>
              <div className='actions-row'>
                <button onClick={() => handleFollow(targetUsername)}>Follow</button>
                <button onClick={() => handleUnfollow(targetUsername)}>Unfollow</button>
                <button onClick={() => handleAcceptFollow(targetUsername)}>Accept Request</button>
                <button onClick={() => handleRejectFollow(targetUsername)}>Reject Request</button>
              </div>
            </section>

            <section className='panel'>
              <h2>Get Post Details</h2>
              <form onSubmit={submitPostDetail} className='inline-form'>
                <input
                  type='text'
                  placeholder='Enter post id'
                  value={postId}
                  onChange={(e) => setPostId(e.target.value)}
                />
                <button type='submit'>Fetch</button>
              </form>
              {selectedPost ? (
                <div className='selected-post'>
                  <p><strong>ID:</strong> {selectedPost._id}</p>
                  <p><strong>Caption:</strong> {selectedPost.caption}</p>
                  <img src={selectedPost.imgUrl} alt='Selected post' />
                </div>
              ) : null}
            </section>

            <section className="panel">
              <h2>My Posts</h2>
              <div className="posts">
                {Array.isArray(posts) && posts.length > 0 ? posts.map((post) => (
                  <Post key={post._id || post.id} {...post} />
                )) : <p>No personal posts yet.</p>}
              </div>
            </section>

            <section className="panel">
              <h2>Feed</h2>
              <div className="posts">
                {Array.isArray(feed) && feed.length > 0 ? feed.map((post) => (
                  <Post key={post._id || post.id} {...post} onLike={handleLikePost} />
                )) : <p>No posts in feed yet.</p>}
              </div>
            </section>
        </div>
    </main>
  )
}

export default Feed
