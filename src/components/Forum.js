import React, { useState, useEffect } from "react";

// import React, { useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { Delete as DeleteIcon, ThumbUp as ThumbUpIcon } from "@mui/icons-material";

const Forum = ({ userId }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [image, setImage] = useState(null); // State for storing the image file
  const [replyContent, setReplyContent] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const fetchPosts = () => {
    axios
      .get("http://localhost:5001/api/posts")
      .then((response) => setPosts(response.data))
      .catch((error) => console.error("Error fetching posts", error));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const createPost = () => {
    if (!newPost.trim() && !image) return; // Ensure the post has content or an image

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("content", newPost);
    if (image) {
      formData.append("image", image);
    }

    axios
      .post("http://localhost:5001/api/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        setNewPost("");
        setImage(null);
        fetchPosts();
        showSnackbar("Post created!");
      })
      .catch((error) => console.error("Error creating post", error));
  };

  const deletePost = (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      axios
        .delete(`http://localhost:5001/api/posts/${postId}`)
        .then(() => {
          fetchPosts();
          showSnackbar("Post deleted!");
        })
        .catch((error) => console.error("Error deleting post", error));
    }
  };

  const likePost = (postId) => {
    axios
      .post(`http://localhost:5001/api/posts/${postId}/like`, { userId })
      .then(() => {
        fetchPosts();
      })
      .catch((error) => console.error("Error liking post", error));
  };

  const addReply = (postId, parentReplyId = null) => {
    const content = replyContent[parentReplyId || postId];
    if (!content) return;

    axios
      .post(`http://localhost:5001/api/posts/${postId}/reply`, {
        userId,
        content,
        parentReplyId,
      })
      .then(() => {
        setReplyContent({ ...replyContent, [parentReplyId || postId]: "" });
        fetchPosts();
        showSnackbar("Reply added!");
      })
      .catch((error) => console.error("Error adding reply", error));
  };

  const findReplyById = (replies, replyId) => {
    for (const reply of replies) {
      if (reply._id === replyId) {
        return reply;
      }
      if (reply.replies && reply.replies.length > 0) {
        const foundReply = findReplyById(reply.replies, replyId);
        if (foundReply) {
          return foundReply;
        }
      }
    }
    return null;
  };
  const deleteReply = (postId, replyId) => {
    if (window.confirm("Are you sure you want to delete this reply?")) {
      axios
        .delete(`http://localhost:5001/api/posts/${postId}/replies/${replyId}`, {
          data: { userId }, // Send the user ID in the request body
        })
        .then(() => {
          fetchPosts(); // Refresh the posts to reflect the deletion
          showSnackbar("Reply deleted!");
        })
        .catch((error) => {
          console.error("Error deleting reply", error);
          showSnackbar("Error deleting reply. Please try again.");
        });
    }
  };

  const renderReplies = (replies, postId) => {
    return replies.map((reply) => {
      const parentReply = reply.parentReplyId ? findReplyById(replies, reply.parentReplyId) : null;

      return (
        <Card
          key={reply._id}
          style={{ marginLeft: "20px", marginTop: "10px", backgroundColor: "#f5f5f5" }}
        >
          <CardContent>
            <Typography variant="body1">{reply.content}</Typography>
            <Typography variant="caption" color="textSecondary">
              By: {reply.userId.name}
            </Typography>
            {reply.parentReplyId && parentReply && (
              <Typography variant="caption" color="textSecondary" style={{ fontStyle: "italic" }}>
                Replying to: {parentReply.userId.name}
              </Typography>
            )}

            {/* Delete Button (only for the user who created the reply) */}
          {reply.userId._id === userId && (
            <IconButton
              color="error"
              size="small"
              style={{ marginLeft: "10px" }}
              onClick={() => deleteReply(postId, reply._id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
          {/* Reply Section */}
            <div style={{ marginTop: "10px" }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                value={replyContent[reply._id] || ""}
                onChange={(e) =>
                  setReplyContent({ ...replyContent, [reply._id]: e.target.value })
                }
                placeholder="Write a reply..."
              />
              <Button
                variant="contained"
                color="primary"
                size="small"
                style={{ marginTop: "5px" }}
                onClick={() => addReply(postId, reply._id)}
              >
                Reply
              </Button>
             { /* Render Nested Replies */}
            </div>
            {renderReplies(reply.replies, postId)}
          </CardContent>
        </Card>
      );
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Forum
      </Typography>

      {/* New Post Section */}
      <Card style={{ marginBottom: "20px" }}>
        <CardContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Write a new post..."
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            style={{ marginTop: "10px" }}
          />
          <Button
            variant="contained"
            color="primary"
            style={{ marginTop: "10px" }}
            onClick={createPost}
          >
            Post
          </Button>
        </CardContent>
      </Card>

      {/* Display Posts */}
      {posts.map((post) => (
        <Card key={post._id} style={{ marginBottom: "20px" }}>
          <CardContent>
            <Typography variant="h6">{post.content}</Typography>
            {post.imageUrl && (
              <img
                src={`http://localhost:5001${post.imageUrl}`}
                alt="Post"
                style={{ maxWidth: "100%", marginTop: "10px" }}
              />
            )}
            <Typography variant="caption" color="textSecondary">
              By: {post.userId.name}
            </Typography>

            {/* Like and Delete Buttons */}
            <div style={{ marginTop: "10px" }}>
              <IconButton
                color={post.likes.includes(userId) ? "primary" : "default"}
                onClick={() => likePost(post._id)}
              >
                <ThumbUpIcon />
              </IconButton>
              <Typography variant="caption" color="textSecondary">
                {post.likes.length} Likes
              </Typography>

              {post.userId._id === userId && (
                <IconButton
                  color="error"
                  style={{ marginLeft: "10px" }}
                  onClick={() => deletePost(post._id)}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </div>

            {/* Reply Section */}
            <div style={{ marginTop: "10px" }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                value={replyContent[post._id] || ""}
                onChange={(e) =>
                  setReplyContent({ ...replyContent, [post._id]: e.target.value })
                }
                placeholder="Write a reply..."
              />
              <Button
                variant="contained"
                color="primary"
                size="small"
                style={{ marginTop: "5px" }}
                onClick={() => addReply(post._id)}
              >
                Reply
              </Button>
            </div>

            {/* Display Replies */}
            {renderReplies(post.replies, post._id)}
          </CardContent>
        </Card>
      ))}

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Forum;