import React, { useState, useEffect } from "react";
import axios from "axios";

const Challenges = ({ userId }) => {
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5001/api/challenges")
  .then((response) => setChallenges(response.data))
  .catch((error) => console.error("Error fetching challenges", error));
  }, []);

  const joinChallenge = (challengeId) => {
    axios.post(`http://localhost:5001/api/challenges/${challengeId}/join`, { userId }).then(() => {
      alert("Joined challenge!");
    });
  };

  return (
    <div>
      <h2>Challenges</h2>
      {challenges.map((challenge) => (
        <div key={challenge._id}>
          <h3>{challenge.title}</h3>
          <p>{challenge.description}</p>
          <button onClick={() => joinChallenge(challenge._id)}>Join</button>
        </div>
      ))}
    </div>
  );
};

export default Challenges;