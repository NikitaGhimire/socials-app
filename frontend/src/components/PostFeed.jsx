import { useState } from 'react';
import '../styles/components/PostFeed.css';

const PostFeed = ({
  posts,
  loadingPosts,
  handleLikePost,
  toggleCommentsVisibility,
  handleDeletePost,
  handleAddComment,
  user,
}) => {
  const [expandedImage, setExpandedImage] = useState(null);

  const handleImageClick = (imageSrc) => {
    setExpandedImage(imageSrc);
  };

  const closeExpandedImage = () => {
    setExpandedImage(null);
  };

  return (
    <>
      <section className="posts-feed">
        {loadingPosts ? (
          <div className="loading-state">
            <p>Loading posts...</p>
          </div>
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
              <article key={post._id} className="post-card">
                <div className="author-details">
                  <img 
                    src={
                      post.author?.profilePicture
                        ? `${post.author.profilePicture}?v=${post.author._id}`
                        : '/images/default.jpg'
                    }
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
                      src={post.content.image} 
                      alt="Post" 
                      className='post-image'
                      onClick={() => handleImageClick(post.content.image)}
                      style={{ cursor: 'pointer' }}
                      title="Click to expand"
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
                    <p>No comments yet.</p>
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
            </article>
          );
        })
      )}
    </section>

    {/* Image Expansion Modal */}
    {expandedImage && (
      <div className="image-modal-overlay" onClick={closeExpandedImage}>
        <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="image-modal-close" onClick={closeExpandedImage}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          <img 
            src={expandedImage} 
            alt="Expanded post" 
            className="expanded-image"
          />
        </div>
      </div>
    )}
  </>
  );
};

export default PostFeed;