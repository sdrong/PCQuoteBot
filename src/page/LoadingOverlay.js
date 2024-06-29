import React from "react";
import "./LoadingOverlay.css";

const LoadingOverlay = ({ message }) => (
  <div className="loading-overlay">
    <div className="spinner"></div>
    <p>{message}</p>
  </div>
);

export default LoadingOverlay;
