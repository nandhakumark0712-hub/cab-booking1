import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";
import MapComponent from "../../components/MapComponent";
import LocationInput from "../../components/LocationInput";
import "../../styles.css";

const CAB_TYPES = [
  { id: "mini", name: "Mini", pricePerKm: 10, icon: "🚗", description: "Standard comfort for 4" },
  { id: "prime", name: "Prime", pricePerKm: 15, icon: "🚐", description: "Premium rides with top drivers" },
  { id: "suv", name: "SUV", pricePerKm: 25, icon: "🚜", description: "Spacious rides for groups" },
];

function BookRide() {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState("");
  const [cabType, setCabType] = useState("mini");
  const [estimate, setEstimate] = useState(0);

  const [bookingType, setBookingType] = useState("instant");
  const [scheduledTime, setScheduledTime] = useState("");

  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [routeData, setRouteData] = useState([]);

  const navigate = useNavigate();

  const handleSOS = () => {
    alert("⚠️ EMERGENCY SOS SENT! Authorities notified.");
  };

  const handleSelectPickup = (item) => {
    setPickup(item.display_name);
    setPickupCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon), address: item.display_name });
  };

  const handleSelectDrop = (item) => {
    setDrop(item.display_name);
    setDropCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon), address: item.display_name });
  };

  useEffect(() => {
    const updateTripData = async () => {
      if (pickupCoords && dropCoords) {
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${dropCoords.lng},${dropCoords.lat}?overview=full&geometries=geojson`
          );
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
            setRouteData(coords);
            const roadDist = Math.round((route.distance / 1000) * 10) / 10;
            setDistance(roadDist);
            const mins = Math.round(route.duration / 60);
            setDuration(mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} mins`);
            const cab = CAB_TYPES.find((c) => c.id === cabType);
            setEstimate(Math.round(roadDist * cab.pricePerKm));
          }
        } catch (err) { console.error(err); }
      } else {
        setRouteData([]); setDistance(0); setDuration(""); setEstimate(0);
      }
    };
    updateTripData();
  }, [pickupCoords, dropCoords, cabType]);

  const bookRequest = async (e) => {
    e.preventDefault();
    if (!pickupCoords || !dropCoords || distance === 0) {
      alert("Please select valid locations first"); return;
    }
    try {
      console.log("Rider: Sending booking request...", { pickup: pickupCoords.address, drop: dropCoords.address });
      const response = await API.post("/trip/book", {
        pickup: pickupCoords.address,
        drop: dropCoords.address,
        distance,
        cabType,
        fare: estimate,
        scheduledTime: bookingType === "scheduled" ? scheduledTime : null,
        pickupCoords,
        dropCoords
      });
      const tripData = response.data;
      console.log("Rider: Booking Success!", tripData);
      alert("Ride Booked Successfully!");
      navigate("/track", { state: { trip: tripData, pickupCoords, dropCoords } });
    } catch (error) {
      alert(error.response?.data?.message || "Booking failed");
    }
  };

  return (
    <div className="formal-booking-page">
      {/* Floating SOS */}
      <button className="sos-action-btn" onClick={handleSOS}>SOS</button>

      <div className="layout-grid">
        {/* Main Content Area (Left) */}
        <div className="main-content-area">
          <div className="dashboard-map-wrapper">
            <MapComponent pickup={pickupCoords} drop={dropCoords} route={routeData} />
            <div className="map-overlay-stats">
              {distance > 0 && <span>{distance} KM • {duration}</span>}
            </div>
          </div>

          <div className="travel-mode-panel">
            <h3 className="panel-label">Select Travel Mode</h3>
            <div className="vehicle-selection-grid">
              {CAB_TYPES.map((cab) => (
                <div
                  key={cab.id}
                  className={`vehicle-selection-card ${cabType === cab.id ? "active" : ""}`}
                  onClick={() => setCabType(cab.id)}
                >
                  <div className="vehicle-icon">{cab.icon}</div>
                  <div className="vehicle-info">
                    <span className="name">{cab.name}</span>
                    <span className="desc">{cab.description}</span>
                  </div>
                  <div className="vehicle-price">₹{cab.pricePerKm}/km</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Sidebar Area (Right) */}
        <div className="sidebar-action-area">
          <div className="executive-card">
            <h2 className="brand-h2">Book Executive Ride</h2>

            <div className="booking-type-selector">
              <button className={bookingType === "instant" ? "selected" : ""} onClick={() => setBookingType("instant")}>Instant</button>
              <button className={bookingType === "scheduled" ? "selected" : ""} onClick={() => setBookingType("scheduled")}>Schedule</button>
            </div>

            <form onSubmit={bookRequest} className="formal-form">
              {bookingType === "scheduled" && (
                <div className="form-field">
                  <label>Pickup Time</label>
                  <input type="datetime-local" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} required />
                </div>
              )}

              <LocationInput
                label="Pickup Point"
                placeholder="Enter pickup location"
                initialValue={pickup}
                onSelect={handleSelectPickup}
                dotColor="green"
              />

              <LocationInput
                label="Destination Point"
                placeholder="Enter drop-off location"
                initialValue={drop}
                onSelect={handleSelectDrop}
                dotColor="red"
              />

              {distance > 0 && (
                <div className="summary-executive-box">
                  <div className="summary-row"><span>Distance</span><strong>{distance} KM</strong></div>
                  <div className="summary-row"><span>Estimated Time</span><strong>{duration}</strong></div>
                  <div className="summary-row fare-row"><span>Total Fare</span><strong>₹{estimate}</strong></div>
                </div>
              )}

              <button type="submit" className="confirm-booking-full-btn">
                {bookingType === "scheduled" ? "Schedule Executive Ride" : "Confirm Booking Now"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .formal-booking-page { min-height: calc(100vh - 70px); background: transparent; padding: 25px; display: flex; justify-content: center; }
        .layout-grid { display: flex; width: 100%; max-width: 1400px; gap: 25px; min-height: 700px; }
        
        .main-content-area { flex: 7; display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .dashboard-map-wrapper { min-height: 400px; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative; border: 1px solid rgba(255,255,255,0.1); }
        .map-overlay-stats { position: absolute; bottom: 20px; left: 20px; background: rgba(30,30,47,0.8); backdrop-filter: blur(5px); color: white; padding: 8px 16px; border-radius: 30px; font-size: 13px; font-weight: 700; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }

        .travel-mode-panel { background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(30px) saturate(160%); padding: 30px; border-radius: 20px; box-shadow: 0 15px 40px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); }
        .panel-label { margin-bottom: 25px; font-size: 20px; font-weight: 900; color: #fbbf24; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 2px 10px rgba(0,0,0,0.8); display: inline-block; position: relative; }
        .panel-label::after { content: ""; position: absolute; bottom: -8px; left: 0; width: 50px; height: 4px; background: #fbbf24; border-radius: 2px; }
        .vehicle-selection-grid { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 10px; -webkit-overflow-scrolling: touch; }
        .vehicle-selection-card { flex: 0 0 180px; height: 160px; padding: 20px; background: rgba(255,255,255,0.02); border: 1.5px solid rgba(255,255,255,0.05); border-radius: 18px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; align-items: center; text-align: center; color: white; }
        .vehicle-selection-card:hover { border-color: #fbbf24; transform: translateY(-5px); background: rgba(251, 191, 36, 0.05); }
        .vehicle-selection-card.active { border-color: #fbbf24; background: #fbbf24; color: #1e1e2f; transform: scale(1.02); box-shadow: 0 12px 25px rgba(251,191,36,0.3); }
        .vehicle-icon { font-size: 32px; margin-bottom: 12px; }
        .vehicle-info .name { display: block; font-weight: 800; font-size: 16px; margin-bottom: 4px; color: white; }
        .vehicle-info .desc { display: block; font-size: 12px; opacity: 0.9; line-height: 1.4; color: #ffffff; }
        .vehicle-price { margin-top: auto; font-size: 15px; font-weight: 900; color: #fbbf24; }
        .active .vehicle-price { color: #1e1e2f; }
        .active .vehicle-info .desc { opacity: 1; color: #1e1e2f; font-weight: 600; }

        .sidebar-action-area { flex: 3; min-width: 320px; }
        .executive-card { background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(30px) saturate(180%); padding: 35px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; color: white; }
        .brand-h2 { font-size: 24px; font-weight: 900; color: #fbbf24; margin-bottom: 25px; }

        .booking-type-selector { display: flex; background: rgba(255,255,255,0.03); padding: 5px; border-radius: 12px; margin-bottom: 30px; }
        .booking-type-selector button { flex: 1; padding: 12px; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; background: transparent; transition: 0.2s; color: rgba(255,255,255,0.9); }
        .booking-type-selector button.selected { background: #fbbf24; color: #1e1e2f; box-shadow: 0 4px 10px rgba(251,191,36,0.2); }

        .form-field { margin-bottom: 22px; }
        .form-field label { display: block; font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.8); text-transform: uppercase; margin-bottom: 8px; }
        .form-field input { width: 100%; padding: 14px 16px; background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,255,255,0.05); border-radius: 12px; font-size: 15px; transition: all 0.2s; color: white; }
        .form-field input:focus { outline: none; border-color: #fbbf24; background: rgba(255,255,255,0.08); }

        .summary-executive-box { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 18px; padding: 20px; margin: 25px 0 30px; }
        .summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px; }
        .summary-row span { color: rgba(255,255,255,0.9); font-weight: 600; }
        .summary-row strong { color: white; font-weight: 800; }
        .fare-row { border-top: 1px solid rgba(255,255,255,0.1); margin-top: 12px; padding-top: 15px; }
        .fare-row strong { font-size: 26px; color: #fbbf24; }

        .confirm-booking-full-btn { width: 100%; padding: 18px; border: none; border-radius: 15px; background: #fbbf24; color: #1e1e2f; font-size: 16px; font-weight: 900; cursor: pointer; transition: 0.2s; box-shadow: 0 10px 25px rgba(251,191,36,0.3); }

        .sos-action-btn { position: fixed; bottom: 30px; right: 30px; z-index: 3000; width: 60px; height: 60px; background: #ef4444; color: white; border: none; border-radius: 50%; font-weight: 900; cursor: pointer; box-shadow: 0 8px 25px rgba(239,68,68,0.4); transition: 0.3s; }
        .sos-action-btn:hover { transform: scale(1.1) rotate(5deg); }

        @media (max-width: 1110px) {
          .layout-grid { flex-direction: column; height: auto; }
          .sidebar-action-area { min-width: 100%; order: 2; }
          .main-content-area { height: auto; min-height: 400px; order: 1; }
          .dashboard-map-wrapper { min-height: 350px; }
          .travel-mode-panel { padding: 20px; }
          .vehicle-selection-grid { justify-content: flex-start; }
          .executive-card { padding: 25px; }
          .formal-booking-page { padding: 15px; }
        }
      `}</style>
    </div>
  );
}

export default BookRide;
