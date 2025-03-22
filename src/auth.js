import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, TextField, Button, Typography, Box, MenuItem } from "@mui/material";

const Register = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", age: "", height: "", weight: "", activity_level: "", goal: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("http://localhost:5001/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (response.ok) navigate("/login");
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Register</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField label="Name" name="name" onChange={handleChange} required fullWidth />
        <TextField label="Email" type="email" name="email" onChange={handleChange} required fullWidth />
        <TextField label="Password" type="password" name="password" onChange={handleChange} required fullWidth />
        <TextField label="Age" type="number" name="age" onChange={handleChange} required fullWidth />
        <TextField label="Height (cm)" type="number" name="height" onChange={handleChange} required fullWidth />
        <TextField label="Weight (kg)" type="number" name="weight" onChange={handleChange} required fullWidth />
        <TextField select label="Activity Level" name="activity_level" onChange={handleChange} required fullWidth>
          <MenuItem value="sedentary">Sedentary</MenuItem>
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="moderate">Moderate</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="very_active">Very Active</MenuItem>
        </TextField>
        <TextField select label="Goal" name="goal" onChange={handleChange} required fullWidth>
          <MenuItem value="weight_loss">Weight Loss</MenuItem>
          <MenuItem value="weight_gain">Weight Gain</MenuItem>
          <MenuItem value="maintenance">Maintenance</MenuItem>
        </TextField>
        <Button type="submit" variant="contained" color="primary">Register</Button>
      </Box>
    </Container>
  );
};
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("http://localhost:5001/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Login</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField label="Email" type="email" onChange={(e) => setEmail(e.target.value)} required fullWidth />
        <TextField label="Password" type="password" onChange={(e) => setPassword(e.target.value)} required fullWidth />
        <Button type="submit" variant="contained" color="primary">Login</Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => navigate("/register")} // Redirect to the register page
          sx={{ mt: 2 }}
        >
          Register
        </Button>
      </Box>
    </Container>
  );
};
export { Register, Login };
