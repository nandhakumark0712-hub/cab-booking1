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
            const url = userId ? `trip/history?userId=${userId}` : "trip/history";
            const res = await API.get(url);
            const data = res.data;
            console.log("Trip History Fetched:", data);
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
                        <p>No trips recorded for your account yet!</p>
                        <small style={{ color: "rgba(255,255,255,0.3)" }}>Searching for UserID: {JSON.parse(sessionStorage.getItem("user") || "{}")._id || "None"}</small>
                        <button className="btn-rebook" style={{ marginTop: 20 }} onClick={() => navigate("/book")}>Book your first ride</button>
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
                                                    {trip.status === "completed" ? "✓ Completed" : 
                                                     trip.status === "cancelled" ? "✗ Cancelled" : 
                                                     trip.status.toUpperCase()}
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
        .trip-card { background: rgba(10, 10, 18, 0.95); backdrop-filter: blur(30px) saturate(200%); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 25px; box-shadow: 0 15px 45px rgba(0,0,0,0.6); transition: all 0.3s ease; color: white; }
        .trip-card:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(0,0,0,0.6); border-color: rgba(251,191,36,0.3); }

        .trip-date-id { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .date-block { display: flex; flex-direction: column; gap: 4px; }
        .date { font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 700; }
        .time { font-size: 12px; color: rgba(255,255,255,0.6); }
        .right-badges { display: flex; align-items: center; gap: 12px; }
        .trip-id { color: #fbbf24; background: rgba(251, 191, 36, 0.1); padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 800; border: 1px solid rgba(251, 191, 36, 0.2); }
        .status-pill { font-size: 11px; font-weight: 800; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
        .status-pill.completed { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
        .status-pill.cancelled { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }

        .trip-route { position: relative; padding-left: 25px; display: flex; flex-direction: column; gap: 15px; }
        .route-point { display: flex; align-items: flex-start; gap: 18px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; box-shadow: 0 0 10px currentColor; }
        .dot.green { background: #10b981; color: rgba(16,185,129,0.4); }
        .dot.red { background: #ef4444; color: rgba(239,68,68,0.4); }
        .addr { font-size: 15px; font-weight: 600; color: rgba(255,255,255,1); line-height: 1.5; word-break: break-word; }
        .route-path { position: absolute; left: 4px; top: 18px; bottom: 18px; width: 0; border-left: 2px dashed rgba(255,255,255,0.1); }

        .trip-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); }
        .trip-meta { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; flex: 1; }
        .cab-type { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.9); display: flex; align-items: center; gap: 8px; }
        .dist { font-size: 13px; color: rgba(255,255,255,0.6); font-weight: 500; }
        .fare { font-size: 26px; font-weight: 950; color: #fbbf24; text-shadow: 0 0 20px rgba(251,191,36,0.4); margin-left: 15px; }

        .trip-actions { display: flex; gap: 12px; }
        .btn-invoice, .btn-rebook { padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-invoice { background: rgba(0, 0, 0, 0.3); color: white; border: 1px solid rgba(255,255,255,0.1); }
        .btn-invoice:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
        .btn-rebook { background: #fbbf24; color: #1e1e2f; border: none; box-shadow: 0 4px 12px rgba(251,191,36,0.2); }
        .btn-rebook:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(251,191,36,0.4); }

        @media (max-width: 1024px) {
          .history-container { padding: 0 20px; }
        }

        @media (max-width: 768px) {
          .history-page-wrapper { padding: 30px 15px; }
          .page-title { font-size: 24px; }
          .trip-card { padding: 20px; }
          .trip-meta { gap: 15px; }
          .fare { font-size: 20px; }
        }

        @media (max-width: 480px) {
          .history-header { flex-direction: column; align-items: flex-start; gap: 15px; }
          .page-title { font-size: 22px; }
          .trip-card { padding: 18px; border-radius: 16px; }
          .trip-date-id { flex-direction: column; gap: 12px; padding-bottom: 12px; }
          .right-badges { width: 100%; justify-content: space-between; }
          .trip-route { padding-left: 22px; }
          .addr { font-size: 14px; }
          .trip-footer { flex-direction: column; gap: 20px; align-items: flex-start; }
          .trip-meta { gap: 10px; width: 100%; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px; }
          .fare { font-size: 24px; align-self: flex-end; margin-top: 0; margin-left: 0; }
          .trip-actions { width: 100%; display: flex; gap: 12px; }
          .btn-invoice, .btn-rebook { flex: 1; text-align: center; padding: 12px; border-radius: 12px; }
          .spinner { width: 30px; height: 30px; }
        }
      `}</style>
        </div>
    );
}

export default RideHistory;
