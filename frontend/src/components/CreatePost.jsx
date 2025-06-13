import React, { useState } from 'react';
import '../styles/components/CreatePost.css';

const CreatePost = ({ onCreatePost }) => {
  const [newPost, setNewPost] = useState({ text: '', image: null });

  const handleCreatePost = () => {
    onCreatePost(newPost);
    setNewPost({ text: '', image: null });
  };

  return (
    <div className="popup-overlay" onClick={() => onCreatePost(null)}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={() => onCreatePost(null)}>×</button>
        <h3>Create a New Post</h3>
        <div className="create-post">
          <textarea
            value={newPost.text}
            onChange={(e) => setNewPost({ ...newPost, text: e.target.value })}
            placeholder="What's on your mind?"
            className="post-textarea"
          />
          <div className="post-actions">
            <div className="left-actions">
              <label htmlFor="file-input" className="attachment-icon">
                <img src="/images/image-attachment-icon.png" alt="Attachment" className="attachment-img" />
                <span>Add Photo</span>
              </label>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={(e) => setNewPost({ ...newPost, image: e.target.files[0] })}
                style={{ display: 'none' }}
              />
              {newPost.image && (
                <div className="image-preview" style={{ marginTop: '10px' }}>
                  <img 
                    src={URL.createObjectURL(newPost.image)} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                  />
                </div>
              )}
            </div>
            <button
              onClick={handleCreatePost}
              disabled={!newPost.text.trim() && !newPost.image}
              className="post-button"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;