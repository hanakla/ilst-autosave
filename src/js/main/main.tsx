import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { os, path } from "../lib/cep/node";
import { subscribeBackgroundColor, evalTS } from "../lib/utils/bolt";

const DEFAULT_AUTO_SAVE_INTERVAL_SECS = 300; // Default 5分 = 300秒

type SaveStatus = { ok: boolean | null; message: string };

export const App = () => {
  const [bgColor, setBgColor] = useState("#282c34");
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(
    DEFAULT_AUTO_SAVE_INTERVAL_SECS,
  );
  const [timeRemaining, setTimeRemaining] = useState(
    DEFAULT_AUTO_SAVE_INTERVAL_SECS,
  );
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);

  // Auto-save execution
  const performAutoSave = useCallback(async () => {
    setSaveStatus({ ok: null, message: "Saving..." });

    const result = await evalTS("saveDocument");

    const now = new Date();
    setLastSaveTime(now);

    if (result.ok) {
      setSaveStatus({ ok: true, message: "Save completed" });
    } else {
      setSaveStatus({ ok: false, message: `Save error: ${result.error}` });
    }

    setTimeRemaining(autoSaveInterval); // Reset timer
    setTimeout(() => setSaveStatus(null), 3000); // Clear status after 3 seconds
  }, [autoSaveInterval]);

  // Toggle auto-save ON/OFF
  const toggleAutoSave = () => {
    setIsAutoSaveEnabled(!isAutoSaveEnabled);
    if (!isAutoSaveEnabled) {
      setTimeRemaining(autoSaveInterval); // Reset timer when enabling
    }
  };

  // Handle interval change
  const handleIntervalChange = (newInterval: number) => {
    setAutoSaveInterval(newInterval);
    setTimeRemaining(newInterval); // Reset timer with new interval
  };

  // Timer management
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isAutoSaveEnabled) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            performAutoSave();
            return autoSaveInterval; // Reset
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoSaveEnabled, autoSaveInterval, performAutoSave]);

  useEffect(() => {
    if (window.cep) {
      subscribeBackgroundColor(setBgColor);
    }
  }, []);

  // Time format (min:sec)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="min-h-dvh"
      style={{
        padding: "4px 6px",
        backgroundColor: bgColor,
        color: "#fff",
        fontSize: "12px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {/* Timer display */}

        <div
          className="font-bold"
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            marginBottom: "8px",
          }}
        >
          Next save in: {formatTime(timeRemaining)}
          <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <input
              type="checkbox"
              checked={isAutoSaveEnabled}
              onChange={toggleAutoSave}
            />
            Enable
          </label>
        </div>

        {isAutoSaveEnabled && (
          <div>
            <progress
              max={autoSaveInterval}
              value={autoSaveInterval - timeRemaining}
              style={{ width: "100%", height: "20px" }}
            />

            {/* Interval setting */}
            <label style={{ fontSize: "12px" }}>
              Interval (sec):
              <select
                value={autoSaveInterval}
                onChange={(e) => handleIntervalChange(Number(e.target.value))}
                style={{
                  padding: "2px 4px",
                  fontSize: "12px",
                  backgroundColor: bgColor,
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: "2px",
                }}
              >
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={120}>2m</option>
                <option value={300}>5m</option>
                <option value={600}>10m</option>
                <option value={900}>15m</option>
                <option value={5}>5s</option>
              </select>
            </label>

            {/* Last save time */}
            {lastSaveTime && (
              <div style={{ fontSize: "10px", opacity: 0.8, marginTop: "4px" }}>
                Last saved: {format(lastSaveTime, "yyyy-MM-dd HH:mm:ss")}
              </div>
            )}

            {/* Status display */}
            {saveStatus && (
              <div
                style={{
                  marginTop: "4px",
                  padding: "4px",
                  backgroundColor:
                    saveStatus.ok === false
                      ? "rgba(204, 0, 0, 0.5)"
                      : "#007ACC",
                  borderRadius: "4px",
                  fontSize: "12px",
                  lineHeight: "16px",
                }}
              >
                {saveStatus.message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
