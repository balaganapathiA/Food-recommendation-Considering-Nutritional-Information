import React, { useState, useEffect } from "react";
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
  const [replyContent, setReplyContent] = useState({}); // Store reply content for each post/reply
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Fetch posts when the component mounts or when a new post is created
  const fetchPosts = () => {
    axios
      .get("http://localhost:5001/api/posts")
      .then((response) => setPosts(response.data))
      .catch((error) => console.error("Error fetching posts", error));
  };

  useEffect(() => {
    fetchPosts(); // Fetch posts when the component mounts
  }, []);

  // Show snackbar message
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Create a new post
  const createPost = () => {
    if (!newPost.trim()) return; // Ensure the post content is not empty

    axios
      .post("http://localhost:5001/api/posts", { userId, content: newPost })
      .then(() => {
        setNewPost(""); // Clear the input field
        fetchPosts(); // Fetch updated posts after creating a new one
        showSnackbar("Post created!");
      })
      .catch((error) => console.error("Error creating post", error));
  };

  // Delete a post
  const deletePost = (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      axios
        .delete(`http://localhost:5001/api/posts/${postId}`)
        .then(() => {
          fetchPosts(); // Fetch updated posts after deletion
          showSnackbar("Post deleted!");
        })
        .catch((error) => console.error("Error deleting post", error));
    }
  };

  // Like a post
  const likePost = (postId) => {
    axios
      .post(`http://localhost:5001/api/posts/${postId}/like`, { userId })
      .then(() => {
        fetchPosts(); // Fetch updated posts after liking
      })
      .catch((error) => console.error("Error liking post", error));
  };

  // Add a reply to a post or a reply
  const addReply = (postId, parentReplyId = null) => {
    const content = replyContent[parentReplyId || postId];
    if (!content) return; // Ensure reply content is not empty

    axios
      .post(`http://localhost:5001/api/posts/${postId}/reply`, {
        userId,
        content,
        parentReplyId,
      })
      .then(() => {
        setReplyContent({ ...replyContent, [parentReplyId || postId]: "" }); // Clear the reply input field
        fetchPosts(); // Fetch updated posts after adding a reply
        showSnackbar("Reply added!");
      })
      .catch((error) => console.error("Error adding reply", error));
  };

  // Helper function to find a reply by ID recursively
  const findReplyById = (replies, replyId) => {
    for (const reply of replies) {
      if (reply._id === replyId) {
        return reply; // Found the reply
      }
      // Search recursively in nested replies
      if (reply.replies && reply.replies.length > 0) {
        const foundReply = findReplyById(reply.replies, replyId);
        if (foundReply) {
          return foundReply; // Return if found in nested replies
        }
      }
    }
    return null; // Reply not found
  };

  // Render nested replies recursively
  const renderReplies = (replies, postId) => {
    return replies.map((reply) => {
      // Find the parent reply if it exists (recursively)
      const parentReply = reply.parentReplyId ? findReplyById(replies, reply.parentReplyId) : null;

      return (
        <Card
          key={reply._id}
          style={{ marginLeft: "20px", marginTop: "10px", backgroundColor: "#f5f5f5" }}
        >
          <CardContent>
            {/* Display the reply content */}
            <Typography variant="body1">{reply.content}</Typography>

            {/* Display who created the reply */}
            <Typography variant="caption" color="textSecondary">
              By: {reply.userId.name}
            </Typography>

            {/* Display whom the reply is replying to */}
            {reply.parentReplyId && parentReply && (
              <Typography variant="caption" color="textSecondary" style={{ fontStyle: "italic" }}>
                Replying to: {parentReply.userId.name}
              </Typography>
            )}

            {/* Reply to this reply */}
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
            </div>

            {/* Render nested replies */}
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

              {/* Show delete button only for the user who created the post */}
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