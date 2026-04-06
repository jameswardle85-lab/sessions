// GymPage.jsx
import React, { useEffect, useState } from "react";
import { parseISO, addDays, format } from "date-fns";
import { FaPlus, FaMinus } from "react-icons/fa";

function GymPage() {
  const [weekNumbers, setWeekNumbers] = useState([1]);
  const [sessionsByWeek, setSessionsByWeek] = useState({});
  const [week1Start, setWeek1Start] = useState("");
  const [visibleColumns, setVisibleColumns] = useState({
    addRemove: true,
    date: true,
    title: true,
    section: true,
    name: true,
    sets: true,
    reps: true,
    weight: true,
    round: true,
    setGroup: true,
  });
  const [sectionOptions, setSectionOptions] = useState(["Warm Up", "Main"]);
  const [newSection, setNewSection] = useState("");
  const [showSectionManager, setShowSectionManager] = useState(false);

  // Load sessions from backend on mount
  useEffect(() => {
    fetchFromBackend();
  }, []);

  // CENTRALIZED FUNCTION TO UPDATE STATE + LOCALSTORAGE
  const updateSessions = (newSessions) => {
    setSessionsByWeek(newSessions);
    localStorage.setItem("gymSessionsByWeek", JSON.stringify(newSessions));
  };

  // Section manager
  const addSectionOption = () => {
    if (newSection.trim() && !sectionOptions.includes(newSection.trim())) {
      setSectionOptions([...sectionOptions, newSection.trim()]);
      setNewSection("");
    }
  };
  const removeSectionOption = (option) => {
    setSectionOptions(sectionOptions.filter((opt) => opt !== option));
  };

  // Week management
  const addNewWeek = () => {
    const nextWeek = Math.max(...weekNumbers) + 1;
    setWeekNumbers((prev) => [...prev, nextWeek]);
    updateSessions({ ...sessionsByWeek, [nextWeek]: [] });
  };
  const removeNewWeek = () => {
    if (weekNumbers.length <= 1) return;
    const lastWeek = weekNumbers[weekNumbers.length - 1];
    setWeekNumbers((prev) => prev.slice(0, -1));
    const copy = { ...sessionsByWeek };
    delete copy[lastWeek];
    updateSessions(copy);
  };
  const updateWeekNumber = (index, newWeek) => {
    setWeekNumbers((prev) => {
      const updated = [...prev];
      updated[index] = Number(newWeek);
      return updated;
    });
  };

  // API helpers
  const POST_ROWS = async (rows) => {
    if (!rows || rows.length === 0) return null;
    try {
      const res = await fetch("http://localhost:5000/gym-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gym: Array.isArray(rows) ? rows : [rows] }),
      });
      if (!res.ok) throw new Error("Failed to POST gym rows");
      const data = await res.json();
      return data.gym || null;
    } catch (err) {
      console.error("POST_ROWS error:", err);
      return null;
    }
  };
  const PUT_ROW = async (id, row) => {
    try {
      const res = await fetch(`http://localhost:5000/gym-sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      if (!res.ok) throw new Error("Failed to PUT gym row");
      const data = await res.json();
      return data.gym || data;
    } catch (err) {
      console.error("PUT_ROW error:", err);
      return null;
    }
  };
  const DELETE_ROW = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/gym-sessions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to DELETE gym row");
      return true;
    } catch (err) {
      console.error("DELETE_ROW error:", err);
      return false;
    }
  };

  // Session/Row management
  const addSession = async (week) => {
    const newRow = {
      week,
      date: "",
      title: "",
      section: "",
      name: "",
      sets: "",
      reps: "",
      weight: "",
      round: "",
      setGroup: "",
      isNew: true,
      isSessionRow: true,
    };
    const created = await POST_ROWS(newRow);
    const createdItem = created && created.length ? created[created.length - 1] : newRow;
    const weekSessions = sessionsByWeek[week] || [];
    updateSessions({ ...sessionsByWeek, [week]: [...weekSessions, createdItem] });
  };
  const addRowBelow = async (week, index) => {
    const newRow = {
      week,
      section: "",
      name: "",
      sets: "",
      reps: "",
      weight: "",
      round: "",
      setGroup: "",
      isNew: true,
      isSessionRow: false,
    };
    const created = await POST_ROWS(newRow);
    const createdItem = created && created.length ? created[created.length - 1] : newRow;
    const weekSessions = sessionsByWeek[week] || [];
    const updatedWeek = [
      ...weekSessions.slice(0, index + 1),
      createdItem,
      ...weekSessions.slice(index + 1),
    ];
    updateSessions({ ...sessionsByWeek, [week]: updatedWeek });
  };
  const removeRow = async (week, index) => {
    const weekSessions = sessionsByWeek[week] || [];
    const toRemove = weekSessions[index];
    if (toRemove && toRemove.id) {
      const ok = await DELETE_ROW(toRemove.id);
      if (!ok) {
        alert("⚠️ Failed to delete on server. Row not removed locally.");
        return;
      }
    }
    const updatedWeek = weekSessions.filter((_, i) => i !== index);
    updateSessions({ ...sessionsByWeek, [week]: updatedWeek });
  };
  const handleChange = async (week, index, field, value) => {
    const weekSessions = sessionsByWeek[week] || [];
    const updatedWeek = [...weekSessions];
    updatedWeek[index] = { ...updatedWeek[index], [field]: value };
    updateSessions({ ...sessionsByWeek, [week]: updatedWeek });

    const row = updatedWeek[index];
    if (row.id) {
      await PUT_ROW(row.id, row);
    } else {
      const created = await POST_ROWS(row);
      if (created && created.length) {
        updatedWeek[index] = created[created.length - 1];
        updateSessions({ ...sessionsByWeek, [week]: updatedWeek });
      }
    }
  };

  const toggleColumn = (col) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const publishToBackend = async () => {
    try {
      const allSessions = Object.values(sessionsByWeek).flat();
      const newSessions = allSessions.filter((s) => !s.id || s.isNew);
      const existingSessions = allSessions.filter((s) => s.id && !s.isNew);

      if (newSessions.length > 0) await POST_ROWS(newSessions);
      for (const s of existingSessions) await PUT_ROW(s.id, s);

      alert("✅ All changes synced with backend!");
    } catch (err) {
      console.error("Publish error:", err);
      alert("⚠️ Error syncing data with backend.");
    }
  };

  const fetchFromBackend = async () => {
    try {
      const res = await fetch("http://localhost:5000/gym-sessions");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const backendSessions = data.gym || [];
      const localSessions = Object.values(sessionsByWeek).flat();

      const mergedMap = new Map();
      [...localSessions, ...backendSessions].forEach((s) => {
        if (s && s.id) mergedMap.set(s.id, { ...mergedMap.get(s.id), ...s });
        else mergedMap.set(`temp-${Math.random()}`, { ...s });
      });

      const merged = Array.from(mergedMap.values());
      const regrouped = {};
      merged.forEach((s) => {
        const week = s.week || 1;
        if (!regrouped[week]) regrouped[week] = [];
        regrouped[week].push(s);
      });
      updateSessions(regrouped);
      setWeekNumbers(Object.keys(regrouped).map(Number).sort((a, b) => a - b));
      alert("✅ Synced with backend successfully!");
    } catch (err) {
      console.error("Fetch error:", err);
      alert("⚠️ Failed to fetch data from backend.");
    }
  };

  const getRowColor = (section) => {
    switch (section) {
      case "Warm Up":
        return "bg-yellow-900/60";
      case "Main":
        return "bg-green-900/60";
      default:
        return "bg-gray-800";
    }
  };

  const getWeekRange = (weekIndex) => {
    if (!week1Start) return null;
    const start = addDays(parseISO(week1Start), weekIndex * 7);
    const end = addDays(start, 6);
    return `${format(start, "dd/MM/yy")} – ${format(end, "dd/MM/yy")}`;
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Gym Sessions</h1>

      {/* Week 1 Start Date */}
      <div className="mb-6">
        <label className="mr-2 font-semibold">Set Week 1 Start Date:</label>
        <input
          type="date"
          value={week1Start}
          onChange={(e) => setWeek1Start(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
        />
      </div>

      {/* Section Manager */}
      <div className="max-w-2xl mx-auto mb-6 border border-gray-700 bg-gray-800 rounded-lg shadow overflow-hidden">
        <div
          className="bg-gray-700 text-white px-4 py-2 font-bold flex justify-between items-center cursor-pointer"
          onClick={() => setShowSectionManager(!showSectionManager)}
        >
          Manage Section Options <span>{showSectionManager ? "▲" : "▼"}</span>
        </div>
        {showSectionManager && (
          <div className="bg-gray-600 p-4">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                placeholder="Add new section"
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
              />
              <button
                onClick={addSectionOption}
                className="bg-green-500 text-white px-4 py-1 rounded"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sectionOptions.map((opt) => (
                <div
                  key={opt}
                  className="bg-gray-900 rounded-full px-3 py-1 flex items-center gap-2"
                >
                  <span>{opt}</span>
                  <button
                    onClick={() => removeSectionOption(opt)}
                    className="text-red-600 font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
            {/* Column toggles */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <strong className="mr-2">Toggle Columns:</strong>
        {Object.keys(visibleColumns).map((col) => (
          <button
            key={col}
            onClick={() => toggleColumn(col)}
            className={`px-3 py-1 rounded-full border ${
              visibleColumns[col]
                ? "bg-gray-700 text-white"
                : "bg-gray-900 text-white"
            }`}
          >
            {{
              addRemove: "Add/Remove",
              date: "Date",
              title: "Session",
              section: "Section",
              name: "Exercise",
              sets: "Sets",
              reps: "Reps",
              weight: "Weight",
              round: "Round",
              setGroup: "Group",
            }[col]}
          </button>
        ))}
      </div>

      {/* Weeks */}
      <div className="flex overflow-x-auto gap-6 snap-x snap-mandatory pb-4">
        {weekNumbers.map((week, i) => {
          const sessions = sessionsByWeek[week] || [];
          return (
            <div
              key={week}
              className="flex-shrink-0 min-w-[650px] bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-4 snap-start"
            >
              <div className="flex items-center gap-4 mb-3 bg-gray-700 rounded-xl px-3 py-2">
                <span className="font-semibold text-lg">Week</span>
                <input
                  type="number"
                  value={week}
                  onChange={(e) => updateWeekNumber(i, e.target.value)}
                  className="w-16 text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                />
                {week1Start && (
                  <span className="ml-4 text-sm text-gray-300">
                    {getWeekRange(i)}
                  </span>
                )}
                <button
                  onClick={() => addSession(week)}
                  className="ml-auto bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Add Session
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse border border-gray-700 text-white">
                  <thead>
                    <tr className="bg-gray-700 text-gray-200">
                      {visibleColumns.addRemove && (
                        <th className="border px-2 py-1">Add/Remove</th>
                      )}
                      {visibleColumns.date && (
                        <th className="border px-2 py-1">Date</th>
                      )}
                      {visibleColumns.title && (
                        <th className="border px-2 py-1">Session</th>
                      )}
                      {visibleColumns.section && (
                        <th className="border px-2 py-1">Section</th>
                      )}
                      {visibleColumns.name && (
                        <th className="border px-2 py-1">Exercise</th>
                      )}
                      {visibleColumns.sets && (
                        <th className="border px-2 py-1">Sets</th>
                      )}
                      {visibleColumns.reps && (
                        <th className="border px-2 py-1">Reps</th>
                      )}
                      {visibleColumns.weight && (
                        <th className="border px-2 py-1">Weight</th>
                      )}
                      {visibleColumns.round && (
                        <th className="border px-2 py-1">Round</th>
                      )}
                      {visibleColumns.setGroup && (
                        <th className="border px-2 py-1">Group</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session, rowIndex) => (
                      <tr
                        key={`${week}-${rowIndex}-${session.id || "new"}`}
                        className={getRowColor(session.section)}
                      >
                        {visibleColumns.addRemove && (
                          <td className="border px-1 py-1 text-center">
                            <button
                              onClick={() => addRowBelow(week, rowIndex)}
                              className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600 mr-1"
                            >
                              <FaPlus />
                            </button>
                            <button
                              onClick={() => removeRow(week, rowIndex)}
                              className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                            >
                              <FaMinus />
                            </button>
                          </td>
                        )}
                        {visibleColumns.date && (
                          <td className="border px-1 py-1 text-center">
                            <input
                              type="date"
                              value={session.date || ""}
                              onChange={(e) =>
                                handleChange(
                                  week,
                                  rowIndex,
                                  "date",
                                  e.target.value
                                )
                              }
                              disabled={!session.isSessionRow && session.isNew}
                              className="w-full text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                            />
                          </td>
                        )}
                        {visibleColumns.title && (
                          <td className="border px-1 py-1 text-center">
                            <input
                              type="text"
                              value={session.title || ""}
                              onChange={(e) =>
                                handleChange(
                                  week,
                                  rowIndex,
                                  "title",
                                  e.target.value
                                )
                              }
                              disabled={!session.isSessionRow && session.isNew}
                              className="w-full text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                            />
                          </td>
                        )}
                        {visibleColumns.section && (
                          <td className="border px-1 py-1 text-center">
                            <select
                              value={session.section || ""}
                              onChange={(e) =>
                                handleChange(
                                  week,
                                  rowIndex,
                                  "section",
                                  e.target.value
                                )
                              }
                              className="w-full bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                            >
                              <option value="">Select</option>
                              {sectionOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}
                        {visibleColumns.name && (
                          <td className="border px-1 py-1 text-center">
                            <input
                              type="text"
                              value={session.name || ""}
                              onChange={(e) =>
                                handleChange(
                                  week,
                                  rowIndex,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="w-full text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                            />
                          </td>
                        )}
                        {visibleColumns.sets && (
                          <td className="border px-1 py-1 text-center">
                            <input
                              type="text"
                              value={session.sets || ""}
                              onChange={(e) =>
                                handleChange(
                                  week,
                                  rowIndex,
                                  "sets",
                                  e.target.value
                                )
                              }
                              className="w-16 text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                            />
                          </td>
                        )}
                        {visibleColumns.reps && (
                          <td className="border px-1 py-1 text-center">
                            <input
                              type="text"
                              value={session.reps || ""}
                              onChange={(e) =>
                                handleChange(
                                  week,
                                  rowIndex,
                                  "reps",
                                  e.target.value
                                )
                              }
                              className="w-16 text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                            />
                          </td>
                        )}
                        {visibleColumns.weight && (
                          <td className="border px-1 py-1 text-center">
                            <input
                              type="text"
                              value={session.weight || ""}
                              onChange={(e) =>
                                handleChange(
                                  week,
                                  rowIndex,
                                  "weight",
                                  e.target.value
                                )
                              }
                              className="w-16 text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                            />
                          </td>
                        )}
                        {visibleColumns.round && (
                          <td className="border px-1 py-1 text-center">
                            <input
                              type="text"
                              value={session.round || ""}
                              onChange={(e) =>
                                handleChange(
                                  week,
                                  rowIndex,
                                  "round",
                                  e.target.value
                                )
                              }
                              className="w-16 text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                            />
                          </td>
                        )}
                        {visibleColumns.setGroup && (
                          <td className="border px-1 py-1 text-center">
                            <input
                              type="text"
                              value={session.setGroup || ""}
                              onChange={(e) =>
                                handleChange(
                                  week,
                                  rowIndex,
                                  "setGroup",
                                  e.target.value
                                )
                              }
                              className="w-16 text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={addNewWeek}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Week
        </button>
        <button
          onClick={removeNewWeek}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Remove Last Week
        </button>
        <button
          onClick={publishToBackend}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-auto"
        >
          Publish
        </button>
        <button
          onClick={fetchFromBackend}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 ml-auto"
        >
          Update
        </button>
      </div>
    </div>
  );
}

export default GymPage;