import { format } from "date-fns";
import { useEffect, useState } from "react";
// import { os, path } from "../lib/cep/node";
import { evalTS, subscribeBackgroundColor } from "../lib/utils/bolt";
import { useEventCallback } from "../lib/utils/hooks";

const DEFAULT_AUTO_SAVE_INTERVAL_SECS = 300; // Default 5分 = 300秒

type SaveStatus = { ok: boolean | null; message: string };
type DocumentSettings = {
  enabled: boolean;
  interval: number;
  lastSaveTime: Date | null;
  timeRemaining: number;
};

export const App = () => {
  const [bgColor, setBgColor] = useState("#282c34");
  const [currentDocName, setCurrentDocName] = useState<string>("");
  const [documentSettings, setDocumentSettings] = useState<
    Record<string, DocumentSettings>
  >({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);

  // Get current document settings or create default
  const getCurrentDocSettings = (): DocumentSettings => {
    if (!currentDocName) {
      return {
        enabled: true,
        interval: DEFAULT_AUTO_SAVE_INTERVAL_SECS,
        lastSaveTime: null,
        timeRemaining: DEFAULT_AUTO_SAVE_INTERVAL_SECS,
      };
    }
    return (
      documentSettings[currentDocName] || {
        enabled: true,
        interval: DEFAULT_AUTO_SAVE_INTERVAL_SECS,
        lastSaveTime: null,
        timeRemaining: DEFAULT_AUTO_SAVE_INTERVAL_SECS,
      }
    );
  };

  const currentSettings = getCurrentDocSettings();

  // Update document settings
  const updateDocumentSettings = useEventCallback(
    (updates: Partial<DocumentSettings>) => {
      if (!currentDocName) return;

      setDocumentSettings((prev) => ({
        ...prev,
        [currentDocName]: {
          ...getCurrentDocSettings(),
          ...updates,
        },
      }));
    },
  );

  // Check current document
  const checkCurrentDocument = useEventCallback(async () => {
    try {
      const docInfo = await evalTS("getDocumentInfo");
      if (docInfo.exists && docInfo.name !== currentDocName) {
        setCurrentDocName(docInfo.name);
      } else if (!docInfo.exists && currentDocName) {
        setCurrentDocName("");
      }
    } catch (error) {
      console.error("Error checking document:", error);
    }
  });

  // Auto-save execution
  const performAutoSave = useEventCallback(async () => {
    setSaveStatus({ ok: null, message: "Saving..." });

    const result = await evalTS("saveDocument");

    const now = new Date();

    if (result.ok) {
      setSaveStatus({ ok: true, message: "Save completed" });
      updateDocumentSettings({
        lastSaveTime: now,
        timeRemaining: currentSettings.interval,
      });
    } else {
      setSaveStatus({ ok: false, message: `Save error: ${result.error}` });
      updateDocumentSettings({ timeRemaining: currentSettings.interval });
    }

    setTimeout(() => setSaveStatus(null), 3000); // Clear status after 3 seconds
  });

  // Toggle auto-save ON/OFF
  const toggleAutoSave = useEventCallback(() => {
    const newEnabled = !currentSettings.enabled;
    updateDocumentSettings({
      enabled: newEnabled,
      timeRemaining: newEnabled
        ? currentSettings.interval
        : currentSettings.timeRemaining,
    });
  });

  // Handle interval change
  const handleIntervalChange = useEventCallback((newInterval: number) => {
    updateDocumentSettings({
      interval: newInterval,
      timeRemaining: newInterval,
    });
  });

  // Check document changes
  useEffect(() => {
    checkCurrentDocument();
    const docCheckInterval = setInterval(checkCurrentDocument, 1000);
    return () => clearInterval(docCheckInterval);
  }, [checkCurrentDocument]);

  // Timer management
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (currentSettings.enabled && currentDocName) {
      interval = setInterval(() => {
        updateDocumentSettings({
          timeRemaining: Math.max(0, currentSettings.timeRemaining - 1),
        });

        if (currentSettings.timeRemaining <= 1) {
          performAutoSave();
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    currentSettings.enabled,
    currentSettings.timeRemaining,
    currentDocName,
    updateDocumentSettings,
    performAutoSave,
  ]);

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
      // className="min-h-dvh"
      style={{
        padding: "4px 6px",
        backgroundColor: bgColor,
        color: "#fff",
        fontSize: "12px",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {/* Timer display */}
        {currentDocName && (
          <div
            className="font-bold"
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Next save in: {formatTime(currentSettings.timeRemaining)}
            <label
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              <input
                type="checkbox"
                checked={currentSettings.enabled}
                onChange={toggleAutoSave}
              />
              Enable
            </label>
          </div>
        )}

        {currentSettings.enabled && currentDocName && (
          <div>
            <progress
              max={currentSettings.interval}
              value={currentSettings.interval - currentSettings.timeRemaining}
              style={{ width: "100%", height: "20px" }}
            />

            {/* Interval setting */}
            <label style={{ fontSize: "12px" }}>
              Interval (sec):
              <select
                value={currentSettings.interval}
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
            {currentSettings.lastSaveTime && (
              <div style={{ fontSize: "10px", opacity: 0.8, marginTop: "4px" }}>
                Last saved:{" "}
                {format(currentSettings.lastSaveTime, "yyyy-MM-dd HH:mm:ss")}
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

        {/* Document list */}
        {Object.keys(documentSettings).length > 0 && (
          <details style={{ marginTop: "8px", fontSize: "10px" }}>
            <summary style={{ opacity: 0.7, marginBottom: "4px" }}>
              Document Settings:
            </summary>
            {Object.entries(documentSettings).map(([docName, settings]) => (
              <div
                key={docName}
                style={{
                  padding: "2px 4px",
                  marginBottom: "2px",
                  backgroundColor:
                    docName === currentDocName
                      ? "rgba(0, 122, 204, 0.3)"
                      : "rgba(255, 255, 255, 0.1)",
                  borderRadius: "2px",
                  fontSize: "9px",
                }}
              >
                {docName}: {settings.enabled ? "ON" : "OFF"} (
                {settings.interval}s)
              </div>
            ))}
          </details>
        )}
      </div>
    </div>
  );
};
