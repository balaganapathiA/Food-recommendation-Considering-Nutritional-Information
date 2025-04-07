import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import axios from "axios";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import {
  Alert,
  Spinner,
  Table,
  Card,
  Row,
  Col,
  ProgressBar,
  Badge,
  ListGroup,
} from "react-bootstrap";

ChartJS.register(ArcElement, Tooltip, Legend);

const MacronutrientChart = ({ userId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("breakfast");

  useEffect(() => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `http://localhost:5001/api/macronutrients/${userId}`,
          {
            timeout: 10000,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        if (!response.data?.success) {
          throw new Error(response.data?.error || "Invalid response format");
        }

        const calculateTotals = (recommendations) => {
          let fats = 0;
          let proteins = 0;
          let carbs = 0;

          ["Breakfast", "Lunch", "Dinner"].forEach((mealType) => {
            if (recommendations[mealType]) {
              recommendations[mealType].forEach((meal) => {
                fats += meal.Fats || 0;
                proteins += meal.Protein || 0;
                carbs += meal.Carbs || 0;
              });
            }
          });

          return { fats, proteins, carbs };
        };

        const totals = calculateTotals(response.data.mealRecommendations);

        setData({
          Fats: totals.fats,
          Proteins: totals.proteins,
          Carbohydrates: totals.carbs,
          mealRecommendations: response.data.mealRecommendations,
          totalCalories:
            response.data.mealRecommendations["Total Recommended Calories"],
        });
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          err.response?.data?.error || err.message || "Failed to fetch data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center my-5 py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading your nutrition data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <Alert variant="danger" className="text-center">
          <Alert.Heading>Oops! Something went wrong</Alert.Heading>
          <p>{error}</p>
          <hr />
          <p className="mb-0">Please try again later or contact support.</p>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mt-5">
        <Alert variant="info" className="text-center">
          <Alert.Heading>No Nutrition Data Available</Alert.Heading>
          <p>We couldn't find any nutrition data for this user.</p>
        </Alert>
      </div>
    );
  }

  // Calculate values
  const totalMacros = data.Fats + data.Proteins + data.Carbohydrates;
  const percentages = {
    Fats: totalMacros > 0 ? Math.round((data.Fats / totalMacros) * 100) : 0,
    Proteins:
      totalMacros > 0 ? Math.round((data.Proteins / totalMacros) * 100) : 0,
    Carbs:
      totalMacros > 0
        ? Math.round((data.Carbohydrates / totalMacros) * 100)
        : 0,
  };

  const chartData = {
    labels: ["Fats", "Proteins", "Carbs"],
    datasets: [
      {
        data: [data.Fats, data.Proteins, data.Carbohydrates],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: "right",
        labels: {
          font: {
            size: 14,
          },
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.raw || 0;
            const percentage = percentages[context.label] || 0;
            return `${label}: ${value}g (${percentage}%)`;
          },
        },
      },
    },
    cutout: "65%",
    borderRadius: 10,
    spacing: 5,
  };

  const getMacroColor = (macro) => {
    switch (macro) {
      case "Fats":
        return "#FF6384";
      case "Proteins":
        return "#36A2EB";
      case "Carbs":
        return "#FFCE56";
      default:
        return "#6c757d";
    }
  };

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4">Daily Nutrition Overview</h2>

      <Row className="g-4 mb-4">
        <Col lg={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <Card.Title className="d-flex justify-content-between align-items-center">
                <span>Macronutrient Distribution </span>
                <Badge bg="primary">{data.totalCalories} kcal</Badge>
              </Card.Title>
              <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                <div
                  style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}
                >
                  <Pie data={chartData} options={chartOptions} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MacronutrientChart;