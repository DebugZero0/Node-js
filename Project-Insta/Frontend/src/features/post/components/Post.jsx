import React from 'react'

const Post = ({ _id, user, imgUrl, caption, onLike }) => {
    return (
        <div className="post">
            <div className="user">
                <img src={user?.profileImage || 'https://www.pngall.com/wp-content/uploads/5/Profile-PNG-High-Quality-Image.png'} alt="Profile" />
                <p>{user?.username}</p>
            </div>
            <img src={imgUrl} alt="Post" />
            <div className="bottom">
                <p className='caption'>{caption}</p>
                {onLike ? <button onClick={() => onLike(_id)}>Like</button> : null}
            </div>
        </div>
    )
}

export default Post
