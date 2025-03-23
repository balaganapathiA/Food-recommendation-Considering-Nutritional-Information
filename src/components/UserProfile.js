import React, { useState, useEffect } from "react";
import axios from "axios";

const UserProfile = ({ userId }) => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5001/api/profile/${userId}`)
  .then((response) => setProfile(response.data))
  .catch((error) => console.error("Error fetching profile", error));;
  }, [userId]);

  return (
    <div>
      <h2>Profile</h2>
      {profile && (
        <div>
          <p>{profile.bio}</p>
          <p>Weight Loss: {profile.progress.weightLoss} kg</p>
          <p>Calorie Goal: {profile.progress.calorieGoal} cal</p>
        </div>
      )}
    </div>
  );
};

export default UserProfile;