import React, { useState, useEffect } from "react";
import API from "../../services/api";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [reportSubTab, setReportSubTab] = useState("riders"); // riders, drivers
  const [stats, setStats] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [riderReports, setRiderReports] = useState([]);
  const [driverReports, setDriverReports] = useState([]);
  const [settings, setSettings] = useState({
    baseFare: 50,
    perKm: 15,
    perMinute: 2,
    surgeMultiplier: 1.0,
    commissionRate: 20
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab, reportSubTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "overview") {
        const res = await API.get("/admin/stats");
        setStats(res.data);
      } else if (activeTab === "drivers") {
        const res = await API.get("/admin/drivers");
        setDrivers(res.data);
      } else if (activeTab === "trips") {
        const res = await API.get("/admin/trips");
        setTrips(res.data);
      } else if (activeTab === "settings") {
        const res = await API.get("/admin/settings");
        setSettings(res.data);
      } else if (activeTab === "reports") {
        if (reportSubTab === "riders") {
          const res = await API.get("/admin/reports/riders");
          setRiderReports(res.data);
        } else {
          const res = await API.get("/admin/reports/drivers");
          setDriverReports(res.data);
        }
      }
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDriver = async (id, payload) => {
    try {
      await API.put(`/admin/drivers/${id}`, payload);
      alert("Driver updated successfully");
      fetchData();
    } catch (err) {
      alert("Error updating driver");
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await API.put("/admin/settings", settings);
      alert("Settings saved successfully");
    } catch (err) {
      alert("Error saving settings");
    }
  };

  const renderOverview = () => (
    <div className="dash-view">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="sc-label">Total Rides</span>
          <span className="sc-value">{stats?.totalRides || 0}</span>
        </div>
        <div className="stat-card gold">
          <span className="sc-label">Total Revenue</span>
          <span className="sc-value">₹{stats?.totalRevenue || 0}</span>
        </div>
        <div className="stat-card">
          <span className="sc-label">Active Drivers</span>
          <span className="sc-value">{stats?.activeDrivers || 0}</span>
        </div>
        <div className="stat-card warn">
          <span className="sc-label">Pending Apps</span>
          <span className="sc-value">{stats?.pendingApprovals || 0}</span>
        </div>
      </div>

      <div className="performance-section">
        <h3>Top Performing Drivers</h3>
        <div className="perf-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Rating</th>
                <th>Total Rides</th>
              </tr>
            </thead>
            <tbody>
              {stats?.topDrivers?.map((d, i) => (
                <tr key={i}>
                  <td>{d.name}</td>
                  <td>⭐ {d.rating}</td>
                  <td>{d.totalTrips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDrivers = () => (
    <div className="dash-view">
      <h3>Driver Management</h3>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Vehicle</th>
              <th>Status</th>
              <th>Verification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d._id}>
                <td>{d.name} <br /> <small>{d.email}</small></td>
                <td>{d.vehicle?.make} {d.vehicle?.model} ({d.vehicle?.plateNumber})</td>
                <td>
                  <span className={`badge ${d.status}`}>
                    {d.status}
                  </span>
                </td>
                <td>{d.isVerified ? "✅ Verified" : "❌ Unverified"}</td>
                <td>
                  <div className="actions-cell">
                    {d.status !== "approved" && (
                      <button className="btn-sml approve" onClick={() => handleUpdateDriver(d._id, { status: "approved", isVerified: true })}>Approve</button>
                    )}
                    {d.status !== "suspended" && (
                      <button className="btn-sml suspend" onClick={() => handleUpdateDriver(d._id, { status: "suspended" })}>Suspend</button>
                    )}
                    {d.status === "suspended" && (
                      <button className="btn-sml activate" onClick={() => handleUpdateDriver(d._id, { status: "approved" })}>Activate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTrips = () => (
    <div className="dash-view">
      <h3>Live Trip Monitoring</h3>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Rider</th>
              <th>Driver</th>
              <th>Route</th>
              <th>Fare</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t._id}>
                <td><small>{t._id.slice(-6)}</small></td>
                <td>{t.user?.name}</td>
                <td>{t.driver?.name || "Searching..."}</td>
                <td><small>From: {t.pickup.slice(0, 20)}... <br /> To: {t.drop.slice(0, 20)}...</small></td>
                <td>₹{t.fare}</td>
                <td><span className={`badge ${t.status}`}>{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="dash-view">
      <div className="report-sub-tabs">
        <button className={reportSubTab === 'riders' ? 'sub-active' : ''} onClick={() => setReportSubTab('riders')}>Riders Report</button>
        <button className={reportSubTab === 'drivers' ? 'sub-active' : ''} onClick={() => setReportSubTab('drivers')}>Drivers Report</button>
      </div>

      <div className="table-wrapper mt-20">
        <table className="admin-table">
          {reportSubTab === "riders" ? (
            <>
              <thead>
                <tr>
                  <th>Rider Name</th>
                  <th>Email</th>
                  <th>Member Since</th>
                  <th>Total Rides</th>
                  <th>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {riderReports.map((r) => (
                  <tr key={r._id}>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{new Date(r.memberSince).toLocaleDateString()}</td>
                    <td>{r.totalRides}</td>
                    <td className="gold-text">₹{r.totalSpent}</td>
                  </tr>
                ))}
              </tbody>
            </>
          ) : (
            <>
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>Rating</th>
                  <th>Vehicle</th>
                  <th>Total Trips</th>
                  <th>Total Earnings</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {driverReports.map((d) => (
                  <tr key={d._id}>
                    <td>{d.name} <br /><small>{d.email}</small></td>
                    <td>⭐ {d.rating}</td>
                    <td>{d.vehicle}</td>
                    <td>{d.totalTrips}</td>
                    <td className="gold-text">₹{d.totalEarnings}</td>
                    <td>{new Date(d.joiningDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="dash-view">
      <h3>Global Configurations</h3>
      <form className="settings-form" onSubmit={handleSaveSettings}>
        <div className="form-grid">
          <div className="f-field">
            <label>Base Fare (₹)</label>
            <input type="number" value={settings.baseFare} onChange={(e) => setSettings({ ...settings, baseFare: e.target.value })} />
          </div>
          <div className="f-field">
            <label>Per KM Rate (₹)</label>
            <input type="number" value={settings.perKm} onChange={(e) => setSettings({ ...settings, perKm: e.target.value })} />
          </div>
          <div className="f-field">
            <label>Per Minute (₹)</label>
            <input type="number" value={settings.perMinute} onChange={(e) => setSettings({ ...settings, perMinute: e.target.value })} />
          </div>
          <div className="f-field">
            <label>Surge Multiplier</label>
            <input type="number" step="0.1" value={settings.surgeMultiplier} onChange={(e) => setSettings({ ...settings, surgeMultiplier: e.target.value })} />
          </div>
          <div className="f-field">
            <label>Commission Rate (%)</label>
            <input type="number" value={settings.commissionRate} onChange={(e) => setSettings({ ...settings, commissionRate: e.target.value })} />
          </div>
        </div>
        <button type="submit" className="save-btn">Apply Settings</button>
      </form>
    </div>
  );

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="logo-icon">🚖</span>
          <h2>Admin Center</h2>
        </div>
        <nav className="admin-nav">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>📊 Overview</button>
          <button className={activeTab === 'drivers' ? 'active' : ''} onClick={() => setActiveTab('drivers')}>👨‍✈️ Drivers</button>
          <button className={activeTab === 'trips' ? 'active' : ''} onClick={() => setActiveTab('trips')}>📟 Trips</button>
          <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>📑 Reports</button>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>⚙️ Settings</button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="h-left">
            <h2>{activeTab === 'reports' ? `${reportSubTab.toUpperCase()} REPORT` : activeTab.toUpperCase()}</h2>
            <p>Welcome back, Administrator</p>
          </div>
          <button className="refresh-btn" onClick={fetchData}>🔄 Refresh Data</button>
        </header>

        <section className="admin-content">
          {isLoading ? (
            <div className="loader-container">
              <div className="premium-spinner"></div>
              <p>Fetching data...</p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && renderOverview()}
              {activeTab === "drivers" && renderDrivers()}
              {activeTab === "trips" && renderTrips()}
              {activeTab === "reports" && renderReports()}
              {activeTab === "settings" && renderSettings()}
            </>
          )}
        </section>
      </main>

      <style>{`
        .admin-layout { display: flex; height: calc(100vh - 70px); background: #0f0f1a; color: white; }
        
        .admin-sidebar { width: 260px; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(20px); border-right: 1px solid rgba(255,255,255,0.05); padding: 30px 20px; display: flex; flex-direction: column; }
        .admin-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; padding-left: 10px; }
        .logo-icon { font-size: 24px; }
        .admin-brand h2 { font-size: 18px; font-weight: 800; color: #fbbf24; }
        
        .admin-nav { display: flex; flex-direction: column; gap: 8px; }
        .admin-nav button { background: transparent; border: none; padding: 14px 20px; text-align: left; color: rgba(255,255,255,0.6); font-weight: 600; font-size: 14px; cursor: pointer; border-radius: 12px; transition: 0.2s; }
        .admin-nav button:hover { background: rgba(255,255,255,0.05); color: white; }
        .admin-nav button.active { background: #fbbf24; color: #1e1e2f; box-shadow: 0 4px 15px rgba(251,191,36,0.2); }

        .admin-main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #0f0f1a; }
        .admin-header { padding: 30px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .h-left h2 { font-size: 24px; font-weight: 900; color: #fbbf24; }
        .h-left p { color: rgba(255,255,255,0.4); font-size: 13px; }
        .refresh-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; transition: 0.2s; }
        .refresh-btn:hover { background: rgba(255,255,255,0.1); }

        .admin-content { padding: 40px; flex: 1; }
        .dash-view { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 25px; margin-bottom: 40px; }
        .stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 25px; border-radius: 20px; display: flex; flex-direction: column; gap: 8px; }
        .stat-card.gold { border-color: rgba(251,191,36,0.3); background: rgba(251,191,36,0.03); }
        .stat-card.warn { border-color: rgba(239,68,68,0.3); }
        .sc-label { color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 700; text-transform: uppercase; }
        .sc-value { font-size: 32px; font-weight: 900; color: #fbbf24; }

        /* Classic Dark Table Override */
        .table-wrapper { background: #1a1a2e; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
        
        /* Specificity boost to override global table styles */
        .admin-layout table.admin-table { 
            width: 100%; 
            border-collapse: collapse; 
            text-align: left; 
            background: #1a1a2e !important; 
            border-radius: 0; 
            margin-top: 0;
        }
        
        .admin-table th { 
            background: rgba(255,255,255,0.03) !important; 
            padding: 18px 25px; 
            font-size: 12px; 
            font-weight: 800; 
            color: #fbbf24 !important; 
            text-transform: uppercase; 
            border-bottom: 1px solid rgba(255,255,255,0.08);
            letter-spacing: 1px;
        }
        
        .admin-table td { 
            padding: 20px 25px; 
            border-bottom: 1px solid rgba(255,255,255,0.04); 
            font-size: 14px; 
            color: rgba(255,255,255,0.85); 
            vertical-align: middle;
        }
        
        .admin-table tr:hover { background: rgba(255,255,255,0.02) !important; }
        
        .badge { padding: 5px 12px; border-radius: 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge.pending { background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.2); }
        .badge.approved { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
        .badge.suspended { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
        .badge.completed { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); }

        .btn-sml { padding: 8px 16px; border: none; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer; transition: 0.2s; text-transform: uppercase; }
        .approve { background: #10b981; color: white; margin-right: 8px; box-shadow: 0 4px 10px rgba(16,185,129,0.2); }
        .suspend { background: #ef4444; color: white; box-shadow: 0 4px 10px rgba(239,68,68,0.2); }
        .activate { background: #3b82f6; color: white; }
        .btn-sml:hover { transform: translateY(-1px); filter: brightness(1.1); }

        .settings-form { max-width: 600px; background: rgba(255,255,255,0.03); padding: 35px; border-radius: 25px; border: 1px solid rgba(255,255,255,0.05); }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 35px; }
        .f-field label { display: block; font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 10px; font-weight: 700; text-transform: uppercase; }
        .f-field input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; color: white; font-weight: 600; outline: none; transition: 0.2s; }
        .f-field input:focus { border-color: #fbbf24; background: rgba(255,255,255,0.08); }
        .save-btn { width: 100%; padding: 16px; background: #fbbf24; color: #1e1e2f; border: none; border-radius: 12px; font-weight: 900; cursor: pointer; font-size: 14px; text-transform: uppercase; transition: 0.3s; box-shadow: 0 4px 15px rgba(251,191,36,0.3); }
        .save-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(251,191,36,0.4); }

        .loader-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 350px; gap: 20px; }
        .premium-spinner { width: 45px; height: 45px; border: 3px solid rgba(251,191,36,0.1); border-top-color: #fbbf24; border-radius: 50%; animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .report-sub-tabs { display: flex; gap: 12px; margin-bottom: 25px; }
        .report-sub-tabs button { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 13px; transition: 0.2s; }
        .report-sub-tabs button:hover { background: rgba(255,255,255,0.08); color: white; }
        .report-sub-tabs button.sub-active { background: #fbbf24; border-color: #fbbf24; color: #1e1e2f; box-shadow: 0 4px 12px rgba(251,191,36,0.2); }
        .mt-20 { margin-top: 20px; }
        .gold-text { color: #fbbf24; font-weight: 800; }

        /* Scrollbar styling */
        .admin-main::-webkit-scrollbar { width: 8px; }
        .admin-main::-webkit-scrollbar-track { background: transparent; }
        .admin-main::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .admin-main::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
