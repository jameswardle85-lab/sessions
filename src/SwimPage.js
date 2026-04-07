// SwimPage.jsx
import React, { useEffect, useState } from "react";
import { parseISO, addDays, format } from "date-fns";
import { FaPlus, FaMinus } from "react-icons/fa";

function SwimPage() {
  const [weekNumbers, setWeekNumbers] = useState([1]);
  const [sessionsByWeek, setSessionsByWeek] = useState({});
  const [week1Start, setWeek1Start] = useState("");
  const [visibleColumns, setVisibleColumns] = useState({
    addRemove: true,
    date: true,
    title: true,
    section: true,
    set: true,
    distance: true,
    notes: true,
    rounds: true,
    setGroup: true,
  });
  const [sectionOptions, setSectionOptions] = useState([
    "Warm Up",
    "Main",
    "Swim Down",
  ]);
  const [newSection, setNewSection] = useState("");
  const [showSectionManager, setShowSectionManager] = useState(false);

  // Load saved data from localStorage
  useEffect(() => {
    const savedWeekStart = localStorage.getItem("week1StartDate");
    if (savedWeekStart) setWeek1Start(savedWeekStart);

    const savedWeeks = JSON.parse(localStorage.getItem("swimWeekNumbers") || "[]");
    const savedSessions = JSON.parse(localStorage.getItem("swimSessionsByWeek") || "{}");

    // Ensure weeks are consistent with saved sessions
    const mergedWeeks = savedWeeks.length ? savedWeeks : Object.keys(savedSessions).map(Number);

    setWeekNumbers(mergedWeeks);
    setSessionsByWeek(savedSessions);
  }, []);

  // Save week1Start whenever it changes
  useEffect(() => {
    if (week1Start) localStorage.setItem("week1StartDate", week1Start);
  }, [week1Start]);

  const updateSessions = (week, newWeekData) => {
    setSessionsByWeek((prev) => {
      const updated = { ...prev, [week]: newWeekData };
      localStorage.setItem("swimSessionsByWeek", JSON.stringify(updated));
      return updated;
    });
  };

  const addSectionOption = () => {
    if (newSection.trim() && !sectionOptions.includes(newSection.trim())) {
      const updated = [...sectionOptions, newSection.trim()];
      setSectionOptions(updated);
      setNewSection("");
    }
  };

  const removeSectionOption = (option) => {
    setSectionOptions(sectionOptions.filter((opt) => opt !== option));
  };

  const addNewWeek = () => {
    const nextWeek = Math.max(...weekNumbers) + 1;
    const newWeeks = [...weekNumbers, nextWeek];
    setWeekNumbers(newWeeks);
    localStorage.setItem("swimWeekNumbers", JSON.stringify(newWeeks));
    updateSessions(nextWeek, []);
  };

  const removeNewWeek = () => {
    if (weekNumbers.length <= 1) return;
    const lastWeek = weekNumbers[weekNumbers.length - 1];
    const newWeeks = weekNumbers.slice(0, -1);
    setWeekNumbers(newWeeks);
    localStorage.setItem("swimWeekNumbers", JSON.stringify(newWeeks));

    const copy = { ...sessionsByWeek };
    delete copy[lastWeek];
    setSessionsByWeek(copy);
    localStorage.setItem("swimSessionsByWeek", JSON.stringify(copy));
  };

  const updateWeekNumber = (index, newWeek) => {
    setWeekNumbers((prev) => {
      const updated = [...prev];
      updated[index] = Number(newWeek);
      localStorage.setItem("swimWeekNumbers", JSON.stringify(updated));
      return updated;
    });
  };

  const addSession = (week) => {
  const newRow = {
    week,
    date: "",
    title: "",
    section: "",
    set: "",
    distance: "",
    notes: "",
    rounds: "",
    setGroup: "",
    isSessionRow: true,
  };

  const weekSessions = sessionsByWeek[week] || [];
  updateSessions(week, [...weekSessions, newRow]);
};

  const addRowBelow = (week, index) => {
  const weekSessions = sessionsByWeek[week] || [];

  const newRow = {
    week,
    section: "",
    set: "",
    distance: "",
    notes: "",
    rounds: "",
    setGroup: "",
    isSessionRow: false,
  };

  const updatedWeek = [
    ...weekSessions.slice(0, index + 1),
    newRow,
    ...weekSessions.slice(index + 1),
  ];

    updateSessions(week, updatedWeek);
  };

  const removeRow = (week, index) => {
    const weekSessions = sessionsByWeek[week] || [];
    const updatedWeek = weekSessions.filter((_, i) => i !== index);
    updateSessions(week, updatedWeek);
  };

  const handleChange = (week, index, field, value) => {
    const weekSessions = sessionsByWeek[week] || [];
    const updatedWeek = [...weekSessions];

    updatedWeek[index] = { ...updatedWeek[index], [field]: value };

    updateSessions(week, updatedWeek);
  };

  const toggleColumn = (col) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const publishToBackend = async () => {
    try {
      const allSessions = Object.values(sessionsByWeek).flat();
      await fetch("http://localhost:5000/swim-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swim: allSessions }),
      });
      alert("✅ Changes published to backend");
    } catch (err) {
      alert("⚠️ Error publishing changes.");
    }
  };

  const getRowColor = (section) => {
    switch (section) {
      case "Warm Up":
        return "bg-yellow-900/60";
      case "Main":
        return "bg-green-900/60";
      case "Swim Down":
        return "bg-red-900/60";
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
      <h1 className="text-2xl font-bold mb-6">Swim Sessions</h1>

      {/* Week 1 start date input */}
      <div className="mb-6">
        <label className="mr-2 font-semibold">Set Week 1 Start Date:</label>
        <input
          type="date"
          value={week1Start}
          onChange={(e) => {
            const value = e.target.value;
            setWeek1Start(value);
            localStorage.setItem("week1StartDate", value);
          }}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
        />
      </div>

      {/* Section Manager */}
      <div className="max-w-2xl mx-auto mb-6 border border-gray-700 bg-gray-800 rounded-lg shadow overflow-hidden">
        <div
          className="bg-gray-700 text-white px-4 py-2 font-bold flex justify-between items-center cursor-pointer"
          onClick={() => setShowSectionManager(!showSectionManager)}
        >
          Manage Section Options
          <span>{showSectionManager ? "▲" : "▼"}</span>
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
              visibleColumns[col] ? "bg-gray-700 text-white" : "bg-gray-900 text-white"
            }`}
          >
            {{
              addRemove: "Add/Remove",
              date: "Date",
              title: "Session",
              section: "Section",
              set: "Set",
              distance: "Distance",
              notes: "Notes",
              rounds: "Rounds",
              setGroup: "Group",
            }[col]}
          </button>
        ))}
      </div>

      {/* Weeks Display */}
      <div className="flex overflow-x-auto gap-6 snap-x snap-mandatory pb-4">
        {weekNumbers.map((week, i) => {
          const sessions = sessionsByWeek[week] || [];
          return (
            <div
              key={week}
              className="flex-shrink-0 min-w-[650px] bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-4 snap-start transition-transform"
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
                  <span className="ml-4 text-sm text-white-700">{getWeekRange(i)}</span>
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
                    <tr className="bg-gray-00 text-gray-200">
                      {visibleColumns.addRemove && <th className="border px-2 py-1">Add/Remove</th>}
                      {visibleColumns.date && <th className="border px-2 py-1">Date</th>}
                      {visibleColumns.title && <th className="border px-2 py-1">Session</th>}
                      {visibleColumns.section && <th className="border px-2 py-1">Section</th>}
                      {visibleColumns.set && <th className="border px-2 py-1">Set</th>}
                      {visibleColumns.distance && <th className="border px-2 py-1">Distance</th>}
                      {visibleColumns.notes && <th className="border px-2 py-1">Notes</th>}
                      {visibleColumns.rounds && <th className="border px-2 py-1">Rounds</th>}
                      {visibleColumns.setGroup && <th className="border px-2 py-1">Group</th>}
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
                              className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
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
                                session.isSessionRow &&
                                handleChange(week, rowIndex, "date", e.target.value)
                              }
                              disabled={!session.isSessionRow}
                              className="text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                            />
                          </td>
                        )}
                        {visibleColumns.title && (
                          <td className="border px-1 py-1">
                            <input
                              type="text"
                              value={session.title || ""}
                              onChange={(e) =>
                                session.isSessionRow &&
                                handleChange(week, rowIndex, "title", e.target.value)
                              }
                              disabled={!session.isSessionRow}
                              className="w-full text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                            />
                          </td>
                        )}
                        {visibleColumns.section && (
                          <td className="border px-1 py-1 text-center">
                            <select
                              value={session.section || ""}
                              onChange={(e) =>
                                handleChange(week, rowIndex, "section", e.target.value)
                              }
                              className="bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
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
                        {visibleColumns.set && (
                          <td className="border px-1 py-1 text-center">
                            <input
                              type="text"
                              value={session.set || ""}
                              onChange={(e) =>
                                handleChange(week, rowIndex, "set", e.target.value)
                              }
                              className="w-12 text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                            />
                          </td>
                        )}
                        {visibleColumns.distance && (
                          <td className="border px-1 py-1 text-center">
                            <input
                              type="text"
                              value={session.distance || ""}
                              onChange={(e) =>
                                handleChange(week, rowIndex, "distance", e.target.value)
                              }
                              className="w-20 text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                            />
                          </td>
                        )}
                        {visibleColumns.notes && (
                          <td className="border px-1 py-1">
                            <input
                              type="text"
                              value={session.notes || ""}
                              onChange={(e) =>
                                handleChange(week, rowIndex, "notes", e.target.value)
                              }
                              className="w-full bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                            />
                          </td>
                        )}
                        {visibleColumns.rounds && (
                          <td className="border px-1 py-1 text-center">
                            <input
                              type="text"
                              value={session.rounds || ""}
                              onChange={(e) =>
                                handleChange(week, rowIndex, "rounds", e.target.value)
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
                                handleChange(week, rowIndex, "setGroup", e.target.value)
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

      {/* Footer buttons */}
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
          Publish to App
        </button>
      </div>
    </div>
  );
}

export default SwimPage;