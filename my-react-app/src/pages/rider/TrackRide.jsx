import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import MapComponent from "../../components/MapComponent";
import API from "../../services/api";


const socket = io("https://cab-booking1.onrender.com");

// Status configuration
const STATUS_STEPS = [
  { id: "searching", label: "Searching", icon: "🔍" },
  { id: "arriving", label: "Driver Arriving", icon: "🚕" },
  { id: "on_trip", label: "On Trip", icon: "📍" },
  { id: "completed", label: "Completed", icon: "🏁" }
];

function TrackRide() {
  const locationState = useLocation();
  const { trip, pickupCoords, dropCoords } = locationState.state || {};

  const mapStatus = (status) => {
    switch (status) {
      case "pending": return "searching";
      case "accepted": return "arriving";
      case "ongoing": return "on_trip";
      case "completed": return "completed";
      default: return "searching";
    }
  };

  const [rideStatus, setRideStatus] = useState(trip ? mapStatus(trip.status) : "searching");
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverDetails, setDriverDetails] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const navigate = useNavigate();

  // Polling / Initial Sync for status
  useEffect(() => {
    if (!trip) return;
    const tripId = trip._id || trip.id;

    const syncStatus = async () => {
      try {
        const res = await API.get(`/trip/${tripId}`);
        if (res.data) {
          setRideStatus(mapStatus(res.data.status));
          if (res.data.driver && typeof res.data.driver === 'object') {
            setDriverDetails({
              driverName: res.data.driver.name || "Rajesh Kumar",
              rating: res.data.driver.rating || 4.8,
              vehicle: (res.data.driver.vehicle && typeof res.data.driver.vehicle === 'object')
                ? res.data.driver.vehicle.model
                : (typeof res.data.driver.vehicle === 'string' ? res.data.driver.vehicle : "White Maruti Suzuki Swift")
            });
          }
        }
      } catch (err) {
        console.error("Rider: Error syncing trip status:", err);
      }
    };
    syncStatus();
  }, [trip]);

  useEffect(() => {
    socket.on("connect", () => console.log("Rider: Connected to socket server!", socket.id));
    socket.on("connect_error", (err) => console.error("Rider: Socket connection error!", err));
    return () => {
      socket.off("connect");
      socket.off("connect_error");
    };
  }, []);

  useEffect(() => {
    if (!trip) return;

    const tripId = trip._id || trip.id;
    console.log("Rider: Joining trip room:", tripId);
    socket.emit("joinTrip", tripId);

    const handleAccepted = (data) => {
      console.log("Rider: Ride Accepted!", data);
      setRideStatus("arriving");
      setDriverDetails(data.driverDetails);
    };

    const handleLocation = (data) => {
      if (data.tripId === tripId) {
        setDriverLocation({ lat: data.lat, lng: data.lng });
      }
    };

    const handleStarted = () => {
      console.log("Rider: Ride Started!");
      setRideStatus("on_trip");
    };

    const handleCompleted = () => {
      console.log("Rider: Ride Completed!");
      setRideStatus("completed");
      setShowFeedback(true);
    };

    const handleCancelled = () => {
      console.log("Rider: Ride Cancelled!");
      alert("This ride has been cancelled.");
      navigate("/rider/dashboard");
    };

    socket.on(`rideAccepted_${tripId}`, handleAccepted);
    socket.on("locationUpdated", handleLocation);
    socket.on(`rideStarted_${tripId}`, handleStarted);
    socket.on(`rideCompleted_${tripId}`, handleCompleted);
    socket.on(`rideCancelled_${tripId}`, handleCancelled);

    return () => {
      socket.off(`rideAccepted_${tripId}`, handleAccepted);
      socket.off("locationUpdated", handleLocation);
      socket.off(`rideStarted_${tripId}`, handleStarted);
      socket.off(`rideCompleted_${tripId}`, handleCompleted);
      socket.off(`rideCancelled_${tripId}`, handleCancelled);
    };
  }, [trip, navigate]);

  const cancelRide = async () => {
    const tripId = trip._id || trip.id;
    if (window.confirm("Are you sure you want to cancel this ride?")) {
      try {
        await API.put(`/trip/${tripId}`, { status: "cancelled" });
        navigate("/rider/dashboard");
      } catch (err) {
        alert("Error cancelling ride");
      }
    }
  };

  // Show feedback modal when completed
  useEffect(() => {
    if (rideStatus === "completed") {
      setShowFeedback(true);
    }
  }, [rideStatus]);

  const handleSOS = () => {
    alert("⚠️ SOS ALERT: Emergency services notified with your live coordinates.");
  };

  const submitFeedback = () => {
    alert(`Thank you! Rating: ${rating}⭐\nFeedback: ${feedback}`);
    setShowFeedback(false);
    navigate("/book");
  };

  if (!trip) {
    return (
      <div className="track-page-wrapper">
        <div className="track-page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h2>No active trip found.</h2>
          <button onClick={() => navigate("/book")}>Book a Ride</button>
        </div>
      </div>
    );
  }

  return (
    <div className="track-page-wrapper">
      {/* Floating SOS */}
      <button className="sos-btn" onClick={handleSOS}>SOS</button>

      <div className="track-page-container">
        {/* Map Area */}
        <div className="map-section">
          <MapComponent
            pickup={pickupCoords}
            drop={dropCoords}
            driver={driverLocation}
          />
          {/* Driver Marker Overlay */}
          <div className="driver-overlay-indicator">
            {rideStatus === "searching" ? "Finding a driver..." :
              rideStatus === "arriving" ? "Driver is arriving now" :
                rideStatus === "on_trip" ? "On the way to destination" : "Trip Completed"}
          </div>
        </div>

        {/* Status Sidebar */}
        <div className="status-sidebar">
          <div className="ride-header">
            <h3>Live Ride Tracking</h3>
            <span className={`status-badge ${rideStatus}`}>{rideStatus.replace('_', ' ')}</span>
          </div>

          {/* Progress Timeline */}
          <div className="status-timeline">
            {STATUS_STEPS.map((step, index) => {
              const isCurrent = step.id === rideStatus;
              const isPast = STATUS_STEPS.findIndex(s => s.id === rideStatus) > index;
              return (
                <div key={step.id} className={`timeline-item ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}`}>
                  <div className="timeline-marker">
                    {isPast ? "✓" : step.icon}
                  </div>
                  <div className="timeline-content">
                    <span className="step-label">{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <hr className="divider" />

          {/* Driver Card */}
          {driverDetails ? (
            <div className="driver-card">
              <div className="driver-info">
                <div className="driver-avatar">👨‍✈️</div>
                <div className="driver-details">
                  <span className="driver-name">{driverDetails.driverName}</span>
                  <span className="driver-meta">⭐ {driverDetails.rating} • 2.5k Trips</span>
                </div>
              </div>
              <div className="vehicle-details">
                <span className="plate-number">{driverDetails.plate || "TN-01-AB-1234"}</span>
                <span className="car-model">{driverDetails.vehicle || "White Maruti Suzuki Swift"}</span>
              </div>
              <div className="action-buttons">
                <button className="btn-call">📞 Call Driver</button>
                <button className="btn-message">💬 Message</button>
              </div>
            </div>
          ) : (
            <div className="searching-card">
              <p>Searching for nearby drivers...</p>
            </div>
          )}

          {/* Trip Actions */}
          <div className="trip-actions">
            <button className="btn-cancel" onClick={cancelRide}>Cancel Ride</button>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="feedback-modal-overlay">
          <div className="feedback-modal">
            <h2>Trip Completed! 🏁</h2>
            <p>How was your ride with Rajesh Kumar?</p>

            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(s => (
                <span
                  key={s}
                  className={rating >= s ? "star active" : "star"}
                  onClick={() => setRating(s)}
                >⭐</span>
              ))}
            </div>

            <textarea
              placeholder="Write your feedback here..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />

            <button className="btn-submit" onClick={submitFeedback}>Submit Feedback</button>
          </div>
        </div>
      )}

      <style>{`
        .track-page-wrapper { display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 70px); padding: 20px; background: transparent; }
        .track-page-container { display: flex; width: 100%; max-width: 1100px; height: 620px; background: rgba(10, 10, 15, 0.6); backdrop-filter: blur(25px) saturate(180%); -webkit-backdrop-filter: blur(25px) saturate(180%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); }
        .map-section { flex: 7; background: #1a1a1a; position: relative; }
        .status-sidebar { flex: 3; min-width: 320px; padding: 25px; border-left: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; color: white; }
        
        .ride-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .ride-header h3 { font-size: 18px; font-weight: 800; color: #fbbf24; }
        .status-badge { font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; background: rgba(255,255,255,0.08); color: white; }
        .status-badge.arriving { background: #dcfce7; color: #166534; }
        .status-badge.on_trip { background: #dbeafe; color: #1e40af; }
        
        .status-timeline { margin-bottom: 25px; }
        .timeline-item { display: flex; align-items: center; gap: 15px; margin-bottom: 12px; opacity: 0.4; }
        .timeline-item.past, .timeline-item.current { opacity: 1; }
        .timeline-marker { width: 32px; height: 32px; background: rgba(255,255,255,0.08); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; position: relative; }
        .timeline-item.current .timeline-marker { background: #fbbf24; color: #1e1e2f; transform: scale(1.15); box-shadow: 0 4px 10px rgba(251,191,36,0.3); }
        .timeline-item.past .timeline-marker { background: #10b981; color: white; }
        .step-label { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.8); }
        
        .divider { border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 10px 0 25px; }
        
        .driver-card { background: rgba(255,255,255,0.03); padding: 20px; border-radius: 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .driver-avatar { width: 50px; height: 50px; background: rgba(255,255,255,0.08); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .driver-name { display: block; font-weight: 700; color: white; }
        .driver-meta { font-size: 12px; color: rgba(255,255,255,0.5); }
        .plate-number { font-weight: 800; color: #1e1e2f; background: #fbbf24; padding: 2px 6px; border-radius: 4px; margin-right: 8px; }
        .car-model { color: rgba(255,255,255,0.6); }
        
        .btn-call, .btn-message { flex: 1; padding: 10px; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; background: rgba(255,255,255,0.03); color: white; transition: 0.2s; }
        .btn-call:hover, .btn-message:hover { background: rgba(255,255,255,0.08); }
        
        .btn-cancel { width: 100%; padding: 12px; border: none; background: rgba(239, 68, 68, 0.15); color: #f87171; font-weight: 700; border-radius: 10px; cursor: pointer; transition: 0.2s; border: 1px solid rgba(239, 68, 68, 0.1); }
        .btn-cancel:hover { background: rgba(239, 68, 68, 0.25); }
        
        .driver-overlay-indicator { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(15,15,25,0.85); backdrop-filter: blur(15px); color: white; padding: 10px 20px; border-radius: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); font-size: 13px; font-weight: 700; z-index: 1000; border: 1px solid rgba(255,255,255,0.1); }

        /* Feedback Modal */
        .feedback-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(15px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px; }
        .feedback-modal { background: #151520; width: 100%; max-width: 400px; padding: 30px; border-radius: 24px; text-align: center; border: 1px solid rgba(251,191,36,0.3); box-shadow: 0 20px 60px rgba(0,0,0,0.6); }
        .feedback-modal h2 { margin-bottom: 10px; font-weight: 800; color: #fbbf24; }
        .feedback-modal p { color: rgba(255,255,255,0.7); }
        .star-rating { font-size: 30px; margin: 20px 0; display: flex; justify-content: center; gap: 10px; }
        .star { cursor: pointer; filter: grayscale(1); }
        .star.active { filter: grayscale(0); }
        .feedback-modal textarea { width: 100%; height: 100px; padding: 15px; border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: white; border-radius: 12px; margin-bottom: 20px; font-family: inherit; }
        .btn-submit { width: 100%; padding: 15px; background: #fbbf24; color: #1e1e2f; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 20px rgba(251,191,36,0.3); }

        @media (max-width: 900px) { .track-page-container { flex-direction: column; height: auto; } .map-section { height: 300px; } }
      `}</style>
    </div>
  );
}

export default TrackRide;
