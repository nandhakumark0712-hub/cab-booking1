import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import MapComponent from "../../components/MapComponent";
import LocationInput from "../../components/LocationInput";
import API from "../../services/api";
import "../../styles.css";

const socket = io("http://localhost:5001");

function DriverDashboard() {
  // --- States ---
  const [isOnline, setIsOnline] = useState(false);
  const [kycStatus, setKycStatus] = useState("pending"); // pending, approved, verified
  const [showKycModal, setShowKycModal] = useState(false);

  const [activeRide, setActiveRide] = useState(null); // Current ongoing trip
  const [newRequest, setNewRequest] = useState(null); // Incoming ride request
  const [timer, setTimer] = useState(15);

  const [earnings, setEarnings] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [walletBalance, setWalletBalance] = useState(0);
  const [rating, setRating] = useState(4.8);
  const [totalTrips, setTotalTrips] = useState(0);

  const [location, setLocation] = useState({ lat: 13.0827, lng: 80.2707 }); // Chennai Default

  // ... (existing effects and actions)

  const handleSelectLocation = (item) => {
    const newLoc = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
    setLocation(newLoc);
    // Optionally alert or update server immediately
    socket.emit("updateLocation", {
      driverId: JSON.parse(sessionStorage.getItem("user") || "{}")._id || "DRV-001",
      tripId: activeRide?.id || null,
      ...newLoc
    });
  };

  // --- Effects ---

  // Monitor connection and handle room joining
  useEffect(() => {
    const onConnect = () => {
      console.log("Driver: Connected to socket server!", socket.id);
      if (isOnline) {
        console.log("Driver: Re-joining drivers room...");
        socket.emit("joinDrivers");
      }
    };

    const onConnectError = (err) => {
      console.error("Driver: Socket connection error!", err);
    };

    const handleNewRequest = (data) => {
      console.log("Socket: Received new_ride_request!", data);
      if (!activeRide && !newRequest) {
        setNewRequest(data);
        setTimer(15);
      }
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("new_ride_request", handleNewRequest);

    // Initial join if already online
    if (isOnline && socket.connected) {
      console.log("Driver: Joining drivers room (already online)");
      socket.emit("joinDrivers");
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("new_ride_request", handleNewRequest);
    };
  }, [isOnline, activeRide, newRequest]);

  // Fetch real driver profile/stats on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = JSON.parse(sessionStorage.getItem("user") || "{}")._id || "653b8f8d6f8d8d2a6c8e8e8e"; // Use real ID if possible
        const res = await API.get(`/driver/profile?id=${userId}`);
        setEarnings({ daily: res.data.totalEarnings || 0, weekly: res.data.totalEarnings * 0.9, monthly: res.data.totalEarnings * 3 }); // Mock weekly/monthly based on daily for now
        setRating(res.data.rating || 4.8);
        setTotalTrips(res.data.totalTrips || 0);
        setIsOnline(res.data.isAvailable);
      } catch (err) {
        console.error("Error fetching driver profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // Sync online status with backend
  useEffect(() => {
    const toggleAvailability = async () => {
      try {
        const userId = JSON.parse(sessionStorage.getItem("user") || "{}")._id || "653b8f8d6f8d8d2a6c8e8e8e";
        await API.put("/driver/availability", { id: userId, isAvailable: isOnline });

        // Also manage socket room membership based on online status
        if (isOnline) {
          console.log("Driver: Going Online. Joining drivers room...");
          socket.emit("joinDrivers");
        } else {
          console.log("Driver: Going Offline. Leaving drivers room...");
          socket.emit("leaveDrivers");
          setNewRequest(null); // Clear any pending requests when going offline
        }
      } catch (err) {
        console.error("Error updating availability:", err);
      }
    };
    toggleAvailability();
  }, [isOnline]);

  // Track location and emit to server
  useEffect(() => {
    let interval;
    if (isOnline) {
      interval = setInterval(() => {
        // Mock slight movement for demonstration
        setLocation(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.0001,
          lng: prev.lng + (Math.random() - 0.5) * 0.0001,
        }));

        const tripId = activeRide ? (activeRide._id || activeRide.id) : null;
        const data = {
          driverId: JSON.parse(sessionStorage.getItem("user") || "{}")._id || "DRV-001",
          tripId: tripId,
          lat: location.lat,
          lng: location.lng
        };
        socket.emit("updateLocation", data);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isOnline, location, activeRide]);

  // Handle Cancellation from Rider
  useEffect(() => {
    if (activeRide) {
      const tripId = activeRide._id || activeRide.id;
      const handleRiderCancel = () => {
        console.log("Driver: Received rider cancellation for trip:", tripId);
        alert("Ride was cancelled by the rider.");
        setActiveRide(null);
      };
      socket.on(`rideCancelled_${tripId}`, handleRiderCancel);
      return () => socket.off(`rideCancelled_${tripId}`, handleRiderCancel);
    }
  }, [activeRide]);

  // Countdown timer for new request
  useEffect(() => {
    let t;
    if (newRequest && timer > 0) {
      t = setInterval(() => setTimer(v => v - 1), 1000);
    } else if (timer === 0) {
      setNewRequest(null);
    }
    return () => clearInterval(t);
  }, [newRequest, timer]);

  // --- Actions ---

  const handleKycUpload = (e) => {
    e.preventDefault();
    setKycStatus("verifying");
    setTimeout(() => {
      setKycStatus("approved");
      setShowKycModal(false);
      alert("Documents uploaded successfully! Support will verify within 24 hours.");
    }, 2000);
  };

  const acceptRide = async () => {
    try {
      const tripId = newRequest._id || newRequest.id;
      await API.put(`/trip/${tripId}`, { status: "accepted", driverId: JSON.parse(sessionStorage.getItem("user") || "{}")._id || "DRV-001" });

      // Teleport near pickup for demo purposes
      if (newRequest.pickupCoords) {
        setLocation({
          lat: newRequest.pickupCoords.lat + 0.001,
          lng: newRequest.pickupCoords.lng + 0.001
        });
      }

      const rideData = { ...newRequest, status: "arriving", driverId: "DRV-001", driverName: "Rajesh Kumar" };
      setActiveRide(rideData);
      socket.emit("joinTrip", tripId);
      setNewRequest(null);
    } catch (err) {
      alert("Failed to accept ride. It might have been taken or cancelled.");
      setNewRequest(null);
    }
  };

  const cancelRide = async () => {
    if (!activeRide) return;
    const tripId = activeRide._id || activeRide.id;
    if (window.confirm("Are you sure you want to cancel this ride?")) {
      try {
        await API.put(`/trip/${tripId}`, { status: "cancelled" });
        setActiveRide(null);
      } catch (err) {
        alert("Error cancelling ride");
      }
    }
  };

  const startTrip = async () => {
    try {
      const tripId = activeRide._id || activeRide.id;
      await API.put(`/trip/${tripId}`, { status: "ongoing" });
      setActiveRide(prev => ({ ...prev, status: "on_trip" }));
    } catch (err) {
      alert("Error starting trip");
    }
  };

  const completeTrip = async () => {
    try {
      const tripId = activeRide._id || activeRide.id;
      const earned = (activeRide.fare || 0) * 0.8; // 20% Commission
      await API.put(`/trip/${tripId}`, { status: "completed" });

      setEarnings(prev => ({ ...prev, daily: prev.daily + earned }));
      setTotalTrips(prev => prev + 1);

      alert(`Trip Completed! You earned ₹${earned.toFixed(2)}`);
      setActiveRide(null);
    } catch (err) {
      alert("Error completing trip");
    }
  };

  const requestPayout = () => {
    if (walletBalance < 500) return alert("Minimum payout is ₹500");
    alert(`Payout request for ₹${walletBalance} sent to your bank account.`);
    setWalletBalance(0);
  };

  return (
    <div className="driver-dashboard-wrapper">
      {/* ... (rest of the component) */}
      {/* --- KYC Banner --- */}
      {kycStatus === "pending" && (
        <div className="kyc-banner">
          <span>⚠️ Finish Onboarding to stay online.</span>
          <button onClick={() => setShowKycModal(true)}>Upload KYC Documents</button>
        </div>
      )}

      <div className="driver-layout">
        {/* --- Main View (Left) --- */}
        <div className="driver-main">
          {/* Header Stats */}
          <div className="driver-stats-strip">
            <div className="stat-item">
              <span className="label">Today's Earnings</span>
              <span className="value">₹{earnings.daily}</span>
            </div>
            <div className="stat-item">
              <span className="label">Rating</span>
              <span className="value">⭐ {rating}</span>
            </div>
            <div className="stat-item">
              <span className="label">Trips</span>
              <span className="value">{totalTrips}</span>
            </div>
            <div className="status-toggle-container">
              <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
              <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
              <label className="switch">
                <input type="checkbox" checked={isOnline} onChange={() => setIsOnline(!isOnline)} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          {/* Map / Trip Area */}
          <div className="driver-content-card">
            <div className="map-view-container">
              <MapComponent
                pickup={activeRide ? activeRide.pickupCoords : location}
                drop={activeRide ? activeRide.dropCoords : null}
              />

              {!isOnline && (
                <div className="offline-overlay">
                  <h3>You are Offline</h3>
                  <p>Go online to start receiving ride requests</p>
                </div>
              )}
            </div>

            {activeRide && (
              <div className="active-trip-panel">
                <div className="trip-info">
                  <div className="customer-info">
                    <div className="avatar">👤</div>
                    <div>
                      <strong>{activeRide.customer}</strong>
                      <small>{activeRide.status === 'arriving' ? 'Pickup' : 'Drop'}: {activeRide.status === 'arriving' ? activeRide.pickup : activeRide.drop}</small>
                    </div>
                  </div>
                  <div className="trip-status-badge">{activeRide.status.replace('_', ' ')}</div>
                </div>
                <div className="trip-actions">
                  <button className="btn-call">📞 Call</button>
                  {activeRide.status === 'arriving' ? (
                    <button className="btn-primary" onClick={startTrip}>Start Trip</button>
                  ) : (
                    <button className="btn-success" onClick={completeTrip}>End Trip</button>
                  )}
                  <button className="btn-reject" style={{ flex: 1 }} onClick={cancelRide}>Cancel</button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* --- Sidebar (Right) --- */}
        <div className="driver-sidebar">
          <div className="wallet-card">
            <h3>My Wallet</h3>
            <div className="balance">₹{walletBalance}</div>
            <button className="payout-btn" onClick={requestPayout}>Request Payout</button>
          </div>

          <div className="earnings-history">
            <h3>Earnings Overview</h3>
            <div className="earning-tabs">
              <div className="e-item"><span>Weekly</span><strong>₹{earnings.weekly}</strong></div>
              <div className="e-item"><span>Monthly</span><strong>₹{earnings.monthly}</strong></div>
            </div>
          </div>

          <div className="ratings-card">
            <h3>Recent Feedback</h3>
            <div className="feedback-item">
              <div className="f-stars">⭐⭐⭐⭐⭐</div>
              <p>"Very polite driver, car was clean."</p>
              <small>Yesterday</small>
            </div>
          </div>

          <div className="manual-location-card">
            <h3>Set Your Location</h3>
            <p className="dim-text">Search and set your current position manually.</p>
            <LocationInput
              label=""
              placeholder="Search and set location..."
              initialValue=""
              onSelect={handleSelectLocation}
              dotColor="blue"
            />
          </div>
        </div>
      </div>

      {/* --- Incoming Request Notification --- */}
      {newRequest && (
        <div className="request-overlay">
          <div className="request-card">
            <div className="request-header">
              <h2>New Ride Request!</h2>
              <div className="countdown-ring">
                <svg><circle r="20" cx="22" cy="22"></circle></svg>
                <span>{timer}</span>
              </div>
            </div>
            <div className="request-details">
              <div className="req-loc">
                <span className="dot g"></span>
                <span>{newRequest.pickup}</span>
              </div>
              <div className="req-loc">
                <span className="dot r"></span>
                <span>{newRequest.drop}</span>
              </div>
              <div className="req-meta">
                <span>🛣️ {newRequest.distance} km</span>
                <span>💰 ₹{newRequest.fare}</span>
              </div>
            </div>
            <div className="request-actions">
              <button className="btn-reject" onClick={() => setNewRequest(null)}>Decline</button>
              <button className="btn-accept" onClick={acceptRide}>Accept Ride</button>
            </div>
          </div>
        </div>
      )}

      {/* --- KYC Modal --- */}
      {showKycModal && (
        <div className="modal-overlay">
          <div className="modal-content kyc-modal">
            <h2>Driver Onboarding</h2>
            <p>Upload your documents to get verified and start earning.</p>
            <form onSubmit={handleKycUpload}>
              <div className="upload-field">
                <label>Driving License</label>
                <input type="file" required />
              </div>
              <div className="upload-field">
                <label>Vehicle Insurance</label>
                <input type="file" required />
              </div>
              <div className="upload-field">
                <label>Aadhar / Identity Card</label>
                <input type="file" required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-text" onClick={() => setShowKycModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit for Verification</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .driver-dashboard-wrapper { min-height: calc(100vh - 70px); background: transparent; padding: 25px; }
        .kyc-banner { background: #fbbf24; padding: 12px 25px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; font-weight: 700; color: #1e1e2f; box-shadow: 0 4px 15px rgba(251,191,36,0.2); }
        .kyc-banner button { background: #1e1e2f; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
        
        .driver-layout { display: flex; gap: 25px; max-width: 1400px; margin: 0 auto; }
        .driver-main { flex: 3; display: flex; flex-direction: column; gap: 20px; }
        .driver-sidebar { flex: 1; display: flex; flex-direction: column; gap: 20px; min-width: 320px; }

        /* Stats Strip */
        .driver-stats-strip { background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(25px) saturate(180%); padding: 20px 30px; border-radius: 20px; display: flex; align-items: center; gap: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); }
        .stat-item { display: flex; flex-direction: column; }
        .stat-item .label { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 700; text-transform: uppercase; }
        .stat-item .value { font-size: 22px; font-weight: 900; color: #fbbf24; }
        .status-toggle-container { margin-left: auto; display: flex; align-items: center; gap: 12px; }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; }
        .status-dot.online { background: #10b981; box-shadow: 0 0 10px rgba(16,185,129,0.5); }
        .status-dot.offline { background: #ef4444; }
        .status-text { font-weight: 800; font-size: 13px; color: white; }

        /* Map Container */
        .map-view-container { height: 600px; background: #1a1a1a; border-radius: 25px; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
        .offline-overlay { position: absolute; inset: 0; background: rgba(30,30,47,0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; z-index: 1000; backdrop-filter: blur(4px); }
        
        /* Active Trip Panel */
        .active-trip-panel { position: relative; margin-top: 20px; background: rgba(15, 15, 25, 0.85); backdrop-filter: blur(20px) saturate(150%); padding: 25px; border-radius: 20px; z-index: 2000; box-shadow: 0 15px 40px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); color: white; }

        .trip-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .customer-info { display: flex; gap: 15px; align-items: center; }
        .customer-info .avatar { font-size: 24px; background: rgba(255,255,255,0.08); width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
        .customer-info strong { display: block; font-size: 16px; color: white; }
        .customer-info small { color: rgba(255,255,255,0.5); display: block; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .trip-status-badge { background: #1e1e2f; color: white; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
        .trip-actions { display: flex; gap: 12px; }
        .trip-actions button { flex: 1; padding: 14px; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; }
        .btn-call { background: rgba(255,255,255,0.1); color: white; }
        .btn-primary { background: #1e1e2f; color: white; }
        .btn-success { background: #10b981; color: white; }
        .btn-reject { background: #ef4444; color: white; }

        /* Sidebar Cards */
        .wallet-card, .earnings-history, .ratings-card, .manual-location-card { background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(25px) saturate(180%); padding: 25px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: white; }
        .wallet-card h3, .earnings-history h3, .ratings-card h3, .manual-location-card h3 { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 20px; letter-spacing: 1px; }
        .balance { font-size: 36px; font-weight: 900; color: #fbbf24; margin-bottom: 15px; }
        .payout-btn { width: 100%; padding: 12px; border: 2px solid #fbbf24; background: transparent; color: #fbbf24; font-weight: 800; border-radius: 10px; cursor: pointer; transition: 0.3s; }
        .payout-btn:hover { background: #fbbf24; color: #1e1e2f; }

        .earning-tabs { display: flex; flex-direction: column; gap: 12px; }
        .e-item { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; }
        .e-item strong { color: #fbbf24; font-weight: 800; }
        
        .feedback-item { margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 15px; }
        .feedback-item:last-child { border-bottom: none; }
        .f-stars { color: #fbbf24; margin-bottom: 5px; }
        .feedback-item p { font-size: 13px; color: rgba(255,255,255,0.8); margin-bottom: 5px; line-height: 1.4; }
        .feedback-item small { color: rgba(255,255,255,0.5); font-size: 11px; }
        .dim-text { color: rgba(255,255,255,0.4); font-size: 12px; margin-bottom: 15px; }

        /* Request Modal */
        .request-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(20px); z-index: 5000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .request-card { background: #151520; width: 100%; max-width: 450px; border-radius: 30px; padding: 40px; animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid rgba(251,191,36,0.3); box-shadow: 0 20px 60px rgba(0,0,0,0.6); color: white; }
        .request-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .request-header h2 { font-size: 24px; font-weight: 900; color: #fbbf24; }
        .countdown-ring { position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }
        .countdown-ring span { font-size: 18px; font-weight: 900; color: #ef4444; }
        
        .req-loc { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; font-weight: 600; font-size: 15px; }
        .req-loc .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.g { background: #10b981; }
        .dot.r { background: #ef4444; }
        .req-meta { display: flex; gap: 20px; margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); font-weight: 800; color: #fbbf24; }
        
        .request-actions { display: flex; gap: 15px; margin-top: 35px; }
        .btn-accept { flex: 2; padding: 18px; background: #fbbf24; color: #1e1e2f; border: none; border-radius: 15px; font-weight: 900; font-size: 16px; cursor: pointer; box-shadow: 0 10px 25px rgba(251,191,36,0.4); }
        .btn-reject { flex: 1; padding: 18px; background: #fee2e2; color: #991b1b; border: none; border-radius: 15px; font-weight: 800; cursor: pointer; }

        /* Transitions */
        @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* Switch Styling */
        .switch { position: relative; display: inline-block; width: 50px; height: 26px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 4px; bottom: 4px; background-color: white; transition: .4s; }
        input:checked + .slider { background-color: #10b981; }
        input:checked + .slider:before { transform: translateX(24px); }
        .slider.round { border-radius: 34px; }
        .slider.round:before { border-radius: 50%; }

        /* Modal styling */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 6000; }
        .modal-content { background: #1e1e2f; padding: 40px; border-radius: 25px; width: 100%; max-width: 500px; border: 1px solid rgba(255,255,255,0.1); color: white; }
        .upload-field { margin-bottom: 20px; }
        .upload-field label { display: block; font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.4); margin-bottom: 8px; text-transform: uppercase; }
        .upload-field input { width: 100%; padding: 12px; border: 2px dashed rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: white; border-radius: 12px; font-size: 14px; cursor: pointer; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 30px; }
        .btn-text { background: none; border: none; color: #888; font-weight: 700; cursor: pointer; }
      `}</style>
    </div>
  );
}

export default DriverDashboard;
