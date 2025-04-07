import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  List,
  ListItem,
  ListItemText,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Snackbar,
  Alert,
  Paper,
  Box,
  Avatar,
  Divider,
  Chip,
} from "@mui/material";
import CloudUpload from "@mui/icons-material/CloudUpload";
import CircularProgress from "@mui/material/CircularProgress";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";

import {
  Delete as DeleteIcon,
  FitnessCenter,
  Forum,
  Restaurant,
  ExitToApp,
} from "@mui/icons-material";

const Forum1 = ({ userId }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [image, setImage] = useState(null);
  const [replyContent, setReplyContent] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPosts = () => {
    setLoading(true);
    setError(null);
    axios
      .get("http://localhost:5001/api/posts")
      .then((response) => {
        setPosts(response.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching posts", error);
        setError("Failed to load posts");
        setLoading(false);
      });
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
    if (!newPost.trim() && !image) {
      showSnackbar("Post cannot be empty");
      return;
    }

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
        showSnackbar("Post created successfully!");
      })
      .catch((error) => {
        console.error("Error creating post", error);
        showSnackbar("Failed to create post");
      });
  };

  const deletePost = (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      axios
        .delete(`http://localhost:5001/api/posts/${postId}`)
        .then(() => {
          fetchPosts();
          showSnackbar("Post deleted successfully!");
        })
        .catch((error) => {
          console.error("Error deleting post", error);
          showSnackbar("Failed to delete post");
        });
    }
  };

  const likePost = (postId) => {
    axios
      .post(`http://localhost:5001/api/posts/${postId}/like`, { userId })
      .then(() => {
        fetchPosts();
      })
      .catch((error) => {
        console.error("Error liking post", error);
        showSnackbar("Failed to like post");
      });
  };

  const addReply = (postId, parentReplyId = null) => {
    const content = replyContent[parentReplyId || postId];
    if (!content) {
      showSnackbar("Reply cannot be empty");
      return;
    }

    axios
      .post(`http://localhost:5001/api/posts/${postId}/reply`, {
        userId,
        content,
        parentReplyId,
      })
      .then(() => {
        setReplyContent({ ...replyContent, [parentReplyId || postId]: "" });
        fetchPosts();
        showSnackbar("Reply added successfully!");
      })
      .catch((error) => {
        console.error("Error adding reply", error);
        showSnackbar("Failed to add reply");
      });
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
        .delete(
          `http://localhost:5001/api/posts/${postId}/replies/${replyId}`,
          {
            data: { userId },
          }
        )
        .then(() => {
          fetchPosts();
          showSnackbar("Reply deleted successfully!");
        })
        .catch((error) => {
          console.error("Error deleting reply", error);
          showSnackbar("Failed to delete reply");
        });
    }
  };

  const renderReplies = (replies, postId) => {
    if (!replies || replies.length === 0) return null;

    return replies.map((reply) => {
      const parentReply = reply.parentReplyId
        ? findReplyById(replies, reply.parentReplyId)
        : null;
      return (
        <Card
          key={reply._id}
          style={{
            marginLeft: "20px",
            marginTop: "10px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <CardContent>
            <Typography variant="body1">{reply.content}</Typography>
            <Typography variant="caption" color="textSecondary">
              By: {reply.userId?.name || "Unknown User"}
            </Typography>
            {reply.parentReplyId && parentReply && (
              <Typography
                variant="caption"
                color="textSecondary"
                style={{ fontStyle: "italic" }}
              >
                Replying to: {parentReply.userId?.name || "Unknown User"}
              </Typography>
            )}

            {reply.userId?._id === userId && (
              <IconButton
                color="error"
                size="small"
                style={{ marginLeft: "10px" }}
                onClick={() => deleteReply(postId, reply._id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}

            <div style={{ marginTop: "10px" }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                value={replyContent[reply._id] || ""}
                onChange={(e) =>
                  setReplyContent({
                    ...replyContent,
                    [reply._id]: e.target.value,
                  })
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
            {renderReplies(reply.replies, postId)}
          </CardContent>
        </Card>
      );
    });
  };

  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#f8faf7",
      }}
    >
      <AppBar position="static" sx={{ backgroundColor: "#2E7D32" }}>
              <Toolbar>
                <Box
                  component={Link}
                  to="/dashboard"
                  sx={{
                    flexGrow: 1,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: '"Poppins", sans-serif',
                      fontSize: "1.25rem",
                      "&:hover": {
                        opacity: 0.8,
                      },
                    }}
                  >
                    HealthTrack
                  </Typography>
                </Box>
                <Button
                  color="inherit"
                  startIcon={<Restaurant />}
                  onClick={() => navigate("/recommendation")}
                  sx={{ mr: 2 }}
                >
                  Food
                </Button>
                <Button
                  color="inherit"
                  startIcon={<Forum />}
                  onClick={() => navigate("/forum")}
                  sx={{ mr: 2 }}
                >
                  Community
                </Button>
                <Button
                  color="inherit"
                  onClick={() => {
                    localStorage.removeItem("token");
                    navigate("/login");
                  }}
                >
                  Logout
                </Button>
              </Toolbar>
            </AppBar>

      <Container maxWidth="md" sx={{ pt: 4, pb: 6 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: "#2E7D32",
            mb: 3,
            fontFamily: '"Poppins", sans-serif',
          }}
        >
          Community Forum
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* New Post Card */}
        <Card
          sx={{
            mb: 4,
            borderRadius: 3,
            border: "1px solid rgba(0, 0, 0, 0.12)",
            boxShadow: "none",
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              Create New Post
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share your thoughts with the community..."
              sx={{ mb: 2 }}
              InputProps={{
                sx: {
                  borderRadius: 2,
                  backgroundColor: "background.paper",
                },
              }}
            />

            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  sx={{
                    mr: 2,
                    borderRadius: 2,
                    textTransform: "none",
                  }}
                >
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    hidden
                  />
                </Button>

                {image && (
                  <Chip
                    label={image.name}
                    onDelete={() => setImage(null)}
                    sx={{ mr: 2 }}
                  />
                )}
              </Box>

              <Button
                variant="contained"
                color="primary"
                sx={{
                  px: 3,
                  py: 1,
                  fontWeight: "bold",
                  textTransform: "none",
                  borderRadius: 2,
                }}
                onClick={createPost}
                disabled={!newPost.trim() && !image}
              >
                Post
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Posts List */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : posts.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 3,
              border: "1px solid rgba(0, 0, 0, 0.12)",
            }}
          >
            <img
              src="/images/no-posts.svg"
              alt="No posts"
              style={{ width: "150px", opacity: 0.6, marginBottom: "16px" }}
            />
            <Typography variant="h6" color="textSecondary">
              No posts yet. Be the first to share!
            </Typography>
          </Paper>
        ) : (
          posts.map((post) => (
            <Card
              key={post._id}
              sx={{
                mb: 4,
                borderRadius: 3,
                border: "1px solid rgba(0, 0, 0, 0.12)",
                boxShadow: "none",
              }}
            >
              <CardContent>
                {/* Post Header */}
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      bgcolor: "#2E7D32",
                      mr: 2,
                      width: 40,
                      height: 40,
                    }}
                  >
                    {post.userId?.name?.charAt(0) || "U"}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      {post.userId?.name || "Unknown User"}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(post.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>

                {/* Post Content */}
                <Typography
                  variant="body1"
                  paragraph
                  sx={{ whiteSpace: "pre-line" }}
                >
                  {post.content}
                </Typography>

                {/* Post Image */}
                {post.imageUrl && (
                  <Box
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      overflow: "hidden",
                      border: "1px solid rgba(0, 0, 0, 0.12)",
                    }}
                  >
                    <img
                      src={`http://localhost:5001${post.imageUrl}`}
                      alt="Post"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "400px",
                        display: "block",
                      }}
                    />
                  </Box>
                )}

                {/* Post Actions */}
                <Box display="flex" alignItems="center" mt={2}>
                  <IconButton
                    color={post.likes?.includes(userId) ? "primary" : "default"}
                    onClick={() => likePost(post._id)}
                    sx={{ mr: 1 }}
                  >
                    <ThumbUpIcon />
                  </IconButton>
                  <Chip
                    label={`${post.likes?.length || 0} Likes`}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 2 }}
                  />

                  {post.userId?._id === userId && (
                    <IconButton
                      color="error"
                      sx={{ ml: "auto" }}
                      onClick={() => deletePost(post._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Comments Section */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    Add a comment
                  </Typography>
                  <Box display="flex">
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      value={replyContent[post._id] || ""}
                      onChange={(e) =>
                        setReplyContent({
                          ...replyContent,
                          [post._id]: e.target.value,
                        })
                      }
                      placeholder="Write your comment..."
                      sx={{ mr: 1 }}
                      InputProps={{
                        sx: {
                          borderRadius: 2,
                          backgroundColor: "background.paper",
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => addReply(post._id)}
                      sx={{
                        minWidth: "100px",
                        height: "40px",
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: "bold",
                      }}
                    >
                      Comment
                    </Button>
                  </Box>
                </Box>

                {/* Comments List */}
                {post.replies?.length > 0 && (
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: "bold",
                      mb: 2,
                      color: "#2E7D32",
                    }}
                  >
                    {post.replies.length}{" "}
                    {post.replies.length === 1 ? "Comment" : "Comments"}
                  </Typography>
                )}

                {renderReplies(post.replies, post._id)}
              </CardContent>
            </Card>
          ))
        )}
      </Container>
    </div>
  );
};

export default Forum1;
