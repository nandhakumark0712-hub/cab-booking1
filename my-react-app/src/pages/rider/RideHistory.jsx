import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "../../styles.css";

const CAB_ICONS = { mini: "🚗", prime: "🚐", suv: "🚜" };

function RideHistory() {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
            const userId = userData._id || "";
            const url = userId ? `/trip/history?userId=${userId}` : "/trip/history";
            const res = await API.get(url);
            const data = res.data;
            setTrips(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch trip history:", err);
            setError("Could not load trip history. Please refresh.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            year: "numeric", month: "short", day: "numeric"
        });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleTimeString("en-IN", {
            hour: "2-digit", minute: "2-digit"
        });
    };

    const downloadInvoice = (trip) => {
        const id = trip._id?.slice(-6).toUpperCase() || "XXXXXX";
        alert(`📄 Invoice for Trip #${id}\nPickup: ${trip.pickup}\nDrop: ${trip.drop}\nDistance: ${trip.distance} km\nCab: ${trip.cabType || "mini"}\nTotal: ₹${trip.fare || 0}`);
    };

    const rebookTrip = (trip) => {
        navigate("/book");
    };

    return (
        <div className="history-page-wrapper">
            <div className="history-container">
                <div className="history-header">
                    <h2 className="page-title">Your Trip History</h2>
                    <button className="btn-refresh" onClick={fetchHistory} title="Refresh">
                        🔄 Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="history-state-box">
                        <div className="spinner" />
                        <p>Loading your trips...</p>
                    </div>
                ) : error ? (
                    <div className="history-state-box error">
                        <span>⚠️</span>
                        <p>{error}</p>
                        <button className="btn-refresh" onClick={fetchHistory}>Try Again</button>
                    </div>
                ) : trips.length === 0 ? (
                    <div className="history-state-box empty">
                        <span style={{ fontSize: 48 }}>🚕</span>
                        <p>No rides yet! Book your first ride.</p>
                        <button className="btn-rebook" onClick={() => navigate("/book")}>Book a Ride</button>
                    </div>
                ) : (
                    <div className="trips-list">
                        {trips.map((trip) => {
                            const shortId = trip._id?.slice(-6).toUpperCase() || "—";
                            const cabType = (trip.cabType || "mini").toLowerCase();
                            const isCompleted = trip.status === "completed";
                            return (
                                <div key={trip._id} className="trip-card">
                                    <div className="trip-main">
                                        <div className="trip-date-id">
                                            <div className="date-block">
                                                <span className="date">{formatDate(trip.createdAt)}</span>
                                                <span className="time">{formatTime(trip.createdAt)}</span>
                                            </div>
                                            <div className="right-badges">
                                                <span className={`status-pill ${trip.status}`}>
                                                    {isCompleted ? "✓ Completed" : "✗ Cancelled"}
                                                </span>
                                                <span className="trip-id">#{shortId}</span>
                                            </div>
                                        </div>
                                        <div className="trip-route">
                                            <div className="route-point">
                                                <span className="dot green"></span>
                                                <span className="addr">{trip.pickup}</span>
                                            </div>
                                            <div className="route-path"></div>
                                            <div className="route-point">
                                                <span className="dot red"></span>
                                                <span className="addr">{trip.drop}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="trip-footer">
                                        <div className="trip-meta">
                                            <span className="cab-type">
                                                {CAB_ICONS[cabType] || "🚗"} {trip.cabType || "Mini"}
                                            </span>
                                            <span className="dist">📍 {trip.distance} km</span>
                                            <span className="fare">₹{trip.fare || 0}</span>
                                        </div>
                                        <div className="trip-actions">
                                            {isCompleted && (
                                                <button className="btn-invoice" onClick={() => downloadInvoice(trip)}>
                                                    📥 Invoice
                                                </button>
                                            )}
                                            <button className="btn-rebook" onClick={() => rebookTrip(trip)}>
                                                🔄 Rebook
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
        .history-page-wrapper { min-height: calc(100vh - 70px); background: transparent; padding: 40px 20px; display: flex; justify-content: center; }
        .history-container { width: 100%; max-width: 800px; }

        .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .page-title { font-weight: 800; color: #fbbf24; font-size: 28px; margin: 0; }
        .btn-refresh { background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.15); padding: 8px 18px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-refresh:hover { background: rgba(255,255,255,0.15); }

        .history-state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; min-height: 300px; color: rgba(255,255,255,0.5); font-size: 15px; }
        .history-state-box.error { color: #f87171; }
        .history-state-box.empty { color: rgba(255,255,255,0.4); }

        .spinner { width: 36px; height: 36px; border: 3px solid rgba(251,191,36,0.2); border-top-color: #fbbf24; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .trips-list { display: flex; flex-direction: column; gap: 20px; }
        .trip-card { background: rgba(0,0,0,0.5); backdrop-filter: blur(25px) saturate(180%); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); transition: transform 0.2s; color: white; }
        .trip-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.6); border-color: rgba(251,191,36,0.3); }

        .trip-date-id { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .date-block { display: flex; flex-direction: column; gap: 2px; }
        .date { font-size: 13px; color: rgba(255,255,255,0.5); font-weight: 600; }
        .time { font-size: 11px; color: rgba(255,255,255,0.3); }
        .right-badges { display: flex; align-items: center; gap: 8px; }
        .trip-id { color: #fbbf24; background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; }
        .status-pill { font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 20px; }
        .status-pill.completed { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
        .status-pill.cancelled { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }

        .trip-route { position: relative; padding-left: 20px; }
        .route-point { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .dot.green { background: #10b981; }
        .dot.red { background: #ef4444; }
        .addr { font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.9); }
        .route-path { position: absolute; left: 23.5px; top: 18px; height: 25px; border-left: 2px dashed rgba(255,255,255,0.15); }

        .trip-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); }
        .trip-meta { display: flex; gap: 20px; align-items: center; }
        .cab-type { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.4); }
        .dist { font-size: 13px; color: rgba(255,255,255,0.3); }
        .fare { font-size: 20px; font-weight: 900; color: #fbbf24; }

        .trip-actions { display: flex; gap: 10px; }
        .btn-invoice, .btn-rebook { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-invoice { background: rgba(255,255,255,0.08); color: white; border: none; }
        .btn-invoice:hover { background: rgba(255,255,255,0.15); }
        .btn-rebook { background: #fbbf24; color: #1e1e2f; border: none; }
        .btn-rebook:hover { box-shadow: 0 4px 15px rgba(251,191,36,0.4); }

        @media (max-width: 600px) {
          .trip-card { padding: 15px; }
          .trip-footer { flex-direction: column; gap: 15px; align-items: flex-start; }
          .trip-meta { flex-wrap: wrap; gap: 10px; }
          .trip-actions { width: 100%; }
          .btn-invoice, .btn-rebook { flex: 1; text-align: center; }
          .page-title { font-size: 22px; }
        }
      `}</style>
        </div>
    );
}

export default RideHistory;
