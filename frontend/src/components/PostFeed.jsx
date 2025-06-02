import React from 'react';
import { API_URL } from '../pages/Home';

const PostFeed = ({
  posts,
  loadingPosts,
  handleLikePost,
  toggleCommentsVisibility,
  handleDeletePost,
  handleAddComment,
  user,
}) => {
  return (
    <div className="post-section">
      <div className="your-posts">
        {loadingPosts ? (
          <p>Loading posts...</p>
        ) : posts.length === 0 ? (
            <div className="no-posts-placeholder">
                <h3>It's quiet in here...</h3>
                <p>Be the first to add a post or find friends to see their posts!</p>
            </div>
        ) : (
          posts.map((post, index) => {
            if (!post || !post._id || !post.author) {
              console.error(`Invalid post at index ${index}:`, post);
              return null;
            }
            return (
              <div key={post._id} className="post-item">
                                                    <div className="author-details">
                                                        <img 
                                                            src={post.author && post.author.profilePicture ? 
                                                                `${API_URL}${post.author.profilePicture}` : 
                                                                '/images/default.jpg'} 
                                                            alt="author" 
                                                            className='author-pic'
                                                        />
                                                        <div className="author-name">
                                                            <strong>{post.author ? post.author.name : 'Unknown Author'}</strong>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="post-content">
                                                        {post.content.text && (
                                                            <p className="post-text">{post.content.text}</p>
                                                        )}
                                                        
                                                        {post.content && post.content.image && (
                                                            <img 
                                                                src={`${API_URL}${post.content.image}`} 
                                                                alt="Post" 
                                                                className='post-image'
                                                            />
                                                        )}
                                                    </div>
                                                
                                                    <div className='like-comment'>
                                                        <div className="like">
                                                            <button 
                                                                onClick={() => handleLikePost(post._id)} 
                                                                className={`like-button ${post.likes?.includes(user._id) ? 'liked' : ''}`}
                                                            >
                                                                <img 
                                                                    src={post.likes?.includes(user._id) ? '/images/liked-icon.png' : '/images/like-icon.png'} 
                                                                    alt="Like" 
                                                                    className='like-icon'
                                                                /> 
                                                                ({post.likes ? post.likes.length : 0})
                                                            </button>
                                                        </div>
                                                        
                                                        <div className='comment'>
                                                            <button 
                                                                onClick={() => toggleCommentsVisibility(post._id)} 
                                                                className="comment-icon-button"
                                                            >
                                                                <img src="/images/comment-icon.png" alt="Comment" className="comment-icon"/> 
                                                            </button>
                                                        </div>

                                                        {post.author._id === user._id && (
                                                            <div className="delete">
                                                                <button className="delete-button" onClick={() => handleDeletePost(post._id)}> 
                                                                    <img src="/images/delete-icon.png" alt="" className='delete-post-icon' />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Comments section */}
                                                    {post.showComments && (
                                                        <div className="comments">
                                                            <h4>Comments</h4>
                                                            {post.comments ? (
                                                                post.comments.map((comment) => (
                                                                    <div key={comment._id}>
                                                                        <strong>{comment.commenter?.name || 'Unknown'}</strong>: {comment.text}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p>No comments yet.</p> /* Added fallback for undefined */
                                                            )}
                                                            <textarea
                                                                placeholder="Add a comment"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        handleAddComment(post._id, e.target.value);
                                                                        e.target.value = '';
                                                                    }
                                                                }}
                                                            ></textarea>
                                                            <hr />
                                                        </div>
                                                    )}
                                                </div>
                                                );
          })
        )}
      </div>
    </div>
  );
};

export default PostFeed;