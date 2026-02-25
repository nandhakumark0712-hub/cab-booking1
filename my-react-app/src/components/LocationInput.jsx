import React, { useState, useEffect, useRef } from "react";
import API from "../services/api";

const LocationInput = ({ label, placeholder, initialValue, onSelect, dotColor }) => {
    const [query, setQuery] = useState(initialValue || "");
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showList, setShowList] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // Fetch via backend proxy (avoids CORS)
    useEffect(() => {
        if (query.trim().length < 3) {
            setSuggestions([]);
            setShowList(false);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                setIsLoading(true);
                // ALWAYS use the backend API to avoid CORS issues
                const res = await API.get(`/location/search?q=${encodeURIComponent(query)}&limit=6`);
                setSuggestions(Array.isArray(res.data) ? res.data : []);
                setShowList(true);
                setActiveIndex(-1);
            } catch (err) {
                console.error("Location search error:", err);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [query]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowList(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
        if (!showList || suggestions.length === 0) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(p => Math.min(p + 1, suggestions.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(p => Math.max(p - 1, 0)); }
        else if (e.key === "Enter" && activeIndex >= 0) { handleSelect(suggestions[activeIndex]); e.preventDefault(); }
        else if (e.key === "Escape") { setShowList(false); }
    };

    const handleSelect = (item) => {
        setQuery(item.display_name);
        setSuggestions([]);
        setShowList(false);
        onSelect(item);
    };

    const highlightText = (text, highlight) => {
        if (!highlight.trim()) return text;
        const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const parts = text.split(new RegExp(`(${escaped})`, "gi"));
        return parts.map((part, i) =>
            part.toLowerCase() === highlight.toLowerCase()
                ? <span key={i} style={{ color: "#fbbf24", fontWeight: "bold" }}>{part}</span>
                : part
        );
    };

    const dotBg = dotColor === "green" ? "#10b981" : dotColor === "red" ? "#ef4444" : "#3b82f6";
    const dotShadow = dotColor === "green" ? "0 0 10px rgba(16,185,129,0.8)" : dotColor === "red" ? "0 0 10px rgba(239,68,68,0.8)" : "0 0 10px rgba(59,130,246,0.8)";

    return (
        <div ref={dropdownRef} style={{ position: "relative", marginBottom: "20px" }}>
            {/* Label - Improved spacing and visibility */}
            {label && (
                <label style={{
                    display: "block", fontSize: "12px", fontWeight: 800,
                    color: "#fbbf24", textTransform: "uppercase",
                    letterSpacing: "1.2px", marginBottom: "10px",
                    textShadow: "0 2px 4px rgba(0,0,0,0.3)"
                }}>
                    {label}
                </label>
            )}

            {/* Input field */}
            <div style={{ position: "relative" }}>
                {/* Colored dot - Larger and more glow */}
                <span style={{
                    position: "absolute", left: "14px", top: "50%",
                    transform: "translateY(-50%)",
                    width: "12px", height: "12px", borderRadius: "50%",
                    background: dotBg, boxShadow: dotShadow,
                    pointerEvents: "none", zIndex: 1
                }} />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    autoComplete="off"
                    onChange={(e) => { setQuery(e.target.value); setShowList(true); }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (query.length >= 3) setShowList(true); }}
                    required
                    style={{
                        width: "100%",
                        padding: "15px 16px 15px 42px",
                        background: "rgba(0, 0, 0, 0.4)",
                        border: "2px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "14px",
                        fontSize: "15px",
                        fontWeight: "500",
                        color: "#ffffff",
                        caretColor: "#fbbf24",
                        outline: "none",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxSizing: "border-box",
                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)"
                    }}
                    onFocusCapture={e => {
                        e.target.style.borderColor = "#fbbf24";
                        e.target.style.background = "rgba(255, 255, 255, 0.05)";
                        e.target.style.boxShadow = "0 0 15px rgba(251, 191, 36, 0.2), inset 0 2px 4px rgba(0,0,0,0.3)";
                    }}
                    onBlurCapture={e => {
                        e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
                        e.target.style.background = "rgba(0, 0, 0, 0.4)";
                        e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.3)";
                    }}
                />
            </div>

            {/* Loading */}
            {isLoading && (
                <div style={{ position: "absolute", right: "15px", top: "45px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <div className="spinner" style={{ width: "16px", height: "16px", border: "2px solid rgba(251,191,36,0.2)", borderTopColor: "#fbbf24", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <span style={{ fontSize: "11px", color: "#fbbf24", fontWeight: 700 }}>Searching...</span>
                </div>
            )}

            {/* Dark Dropdown — Consolidated premium theme */}
            {showList && (
                <ul style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0, right: 0,
                    background: "rgba(10, 10, 20, 0.95)",
                    backdropFilter: "blur(40px) saturate(200%)",
                    WebkitBackdropFilter: "blur(40px) saturate(200%)",
                    border: "1px solid rgba(251, 191, 36, 0.3)",
                    borderRadius: "16px",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05) inset",
                    zIndex: 99999,
                    maxHeight: "300px",
                    overflowY: "auto",
                    padding: "10px 0",
                    margin: 0,
                    listStyle: "none",
                }}>
                    {suggestions.length > 0 ? suggestions.map((item, idx) => {
                        const parts = item.display_name.split(",");
                        const main = parts[0];
                        const sub = parts.slice(1, 4).join(",").trim();
                        const isActive = idx === activeIndex;
                        return (
                            <li
                                key={idx}
                                onClick={() => handleSelect(item)}
                                onMouseEnter={() => setActiveIndex(idx)}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "14px",
                                    padding: "14px 20px",
                                    cursor: "pointer",
                                    background: isActive ? "rgba(251, 191, 36, 0.15)" : "transparent",
                                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                                    transition: "all 0.2s",
                                    listStyle: "none",
                                }}
                            >
                                <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "2px" }}>📍</span>
                                <div style={{ overflow: "hidden", flex: 1 }}>
                                    <strong style={{
                                        display: "block",
                                        fontSize: "14px",
                                        fontWeight: 700,
                                        color: isActive ? "#fbbf24" : "rgba(255,255,255,0.95)",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}>
                                        {highlightText(main, query)}
                                    </strong>
                                    {sub && (
                                        <small style={{
                                            display: "block",
                                            fontSize: "11px",
                                            color: "rgba(255,255,255,0.45)",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            marginTop: "3px",
                                        }}>
                                            {sub}
                                        </small>
                                    )}
                                </div>
                            </li>
                        );
                    }) : !isLoading && query.length >= 3 ? (
                        <li style={{
                            padding: "25px",
                            textAlign: "center",
                            color: "rgba(255,255,255,0.4)",
                            fontSize: "13px",
                            fontStyle: "italic",
                            listStyle: "none",
                        }}>
                            No results for "{query}"
                        </li>
                    ) : null}
                </ul>
            )}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default LocationInput;
