import React, { useEffect, useState } from "react";
import { format } from "date-fns";

function SummaryPage() {
  const [swimSessions, setSwimSessions] = useState([]);
  const [gymSessions, setGymSessions] = useState([]);
  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch swim sessions
  useEffect(() => {
    fetch("http://localhost:5000/swim-sessions")
      .then((res) => res.json())
      .then((data) => setSwimSessions(data.swim || []))
      .catch((err) => console.error("Error fetching swim sessions:", err));
  }, []);

  // Fetch gym sessions
  useEffect(() => {
    fetch("http://localhost:5000/gym-sessions")
      .then((res) => res.json())
      .then((data) => setGymSessions(data.gym || []))
      .catch((err) => console.error("Error fetching gym sessions:", err));
  }, []);

  // Normalize rows so child rows inherit parent’s date/title
  const normalize = (sessions) => {
    let currentDate = "";
    let currentTitle = "";
    return sessions.map((row) => {
      if (row.isSessionRow) {
        if (row.date) currentDate = row.date;
        if (row.title) currentTitle = row.title;
      }
      return {
        ...row,
        date: row.date || currentDate,
        title: row.title || currentTitle,
      };
    });
  };

  // Filter to today’s date and group by title
  const normalizeAndGroup = (sessions) => {
    const normalized = normalize(sessions).filter((s) => s.date === today);
    return normalized.reduce((acc, curr) => {
      const key = curr.title || "Untitled Session";
      if (!acc[key]) acc[key] = [];
      acc[key].push(curr);
      return acc;
    }, {});
  };

  const groupedSwim = normalizeAndGroup(swimSessions);
  const groupedGym = normalizeAndGroup(gymSessions);

  // 🔹 Group by groupID or setGroup, add multiplier (shared between Swim & Gym)
  const groupByGroupID = (rows) => {
    const groups = {};
    rows.forEach((r) => {
      const key = r.groupID || r.setGroup || `row-${Math.random()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  };

  const groupWithRounds = (rows) => {
    const grouped = groupByGroupID(rows);
    return Object.entries(grouped).map(([groupID, groupRows]) => {
      const allRounds = groupRows.map((r) => r.rounds || r.round);
      const uniqueRounds = [...new Set(allRounds)];
      const sameRounds = uniqueRounds.length === 1 ? uniqueRounds[0] : null;

      return {
        groupID,
        multiplier:
          sameRounds && sameRounds !== "1" && sameRounds !== 1
            ? `${sameRounds}×`
            : null,
        rows: groupRows,
      };
    });
  };

  const getGroupStyle = () => "";

  // --- Shared Table Renderer for Swim & Gym ---
const renderTable = (title, rows, isSwim = false) => {
  // 🔹 Group rows by section (across all rounds)
  const groupBySection = (rows) => {
    const groupedSections = [];
    let currentGroup = [];
    rows.forEach((r, i) => {
      if (i === 0 || r.section === rows[i - 1].section) {
        currentGroup.push(r);
      } else {
        groupedSections.push(currentGroup);
        currentGroup = [r];
      }
    });
    if (currentGroup.length) groupedSections.push(currentGroup);
    return groupedSections;
  };

  // 🔹 Group rows by round (setGroup or groupID)
  const groupByGroupID = (rows) => {
    const groups = {};
    rows.forEach((r) => {
      const key = r.groupID || r.setGroup || `row-${Math.random()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  };

  const groupedByRounds = groupByGroupID(rows);

  // 🔹 Convert grouped structure to merged rows
  const allGroups = Object.entries(groupedByRounds).map(([groupID, groupRows]) => {
    const allRounds = groupRows.map((r) => r.rounds || r.round);
    const uniqueRounds = [...new Set(allRounds)];
    const sameRounds = uniqueRounds.length === 1 ? uniqueRounds[0] : null;

    return {
      groupID,
      multiplier:
        sameRounds && sameRounds !== "1" && sameRounds !== 1
          ? `${sameRounds}×`
          : null,
      rows: groupRows,
    };
  });

  // 🔹 Build the visual table
  return (
    <div className="bg-gray-800 p-4 mb-4 rounded-xl shadow border border-gray-700">
      <h3 className="font-semibold text-lg mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table
          className="text-sm text-left border-collapse border border-gray-700 w-auto min-w-max"
          style={{ tableLayout: "auto" }}
        >
          <thead className="bg-gray-700 whitespace-nowrap">
            <tr>
              <th className="border border-gray-600 px-3 py-2 text-center">Section</th>
              <th className="border border-gray-600 px-3 py-2 text-center">Rounds</th>
              {isSwim ? (
                <th className="border border-gray-600 px-3 py-2 text-center">Set</th>
              ) : (
                <>
                  <th className="border border-gray-600 px-3 py-2">Exercise</th>
                  <th className="border border-gray-600 px-3 py-2 text-center">Sets</th>
                  <th className="border border-gray-600 px-3 py-2 text-center">Reps</th>
                  <th className="border border-gray-600 px-3 py-2 text-center">Weight</th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="whitespace-nowrap">
            {/* 🔹 Group by section first */}
            {groupBySection(rows).map((sectionRows, si) => {
              // Within each section, group by rounds
              const sectionRoundGroups = groupByGroupID(sectionRows);
              const sectionGroups = Object.entries(sectionRoundGroups).map(
                ([groupID, groupRows]) => {
                  const allRounds = groupRows.map((r) => r.rounds || r.round);
                  const uniqueRounds = [...new Set(allRounds)];
                  const sameRounds = uniqueRounds.length === 1 ? uniqueRounds[0] : null;

                  return {
                    groupID,
                    multiplier:
                      sameRounds && sameRounds !== "1" && sameRounds !== 1
                        ? `${sameRounds}×`
                        : null,
                    rows: groupRows,
                  };
                }
              );

              return sectionGroups.map((group, gi) =>
                group.rows.map((r, j) => (
                  <tr
                    key={`${si}-${gi}-${j}`}
                    className="hover:bg-gray-700/40"
                  >
                    {/* ✅ Section merged for the entire section */}
                    {gi === 0 && j === 0 && (
                      <td
                        rowSpan={sectionRows.length}
                        className="border border-gray-700 px-3 py-1 align-middle font-medium"
                      >
                        {r.section || ""}
                      </td>
                    )}

                    {/* ✅ Rounds merged for that round group */}
                    {j === 0 && (
                      <td
                        rowSpan={group.rows.length}
                        className={`border border-gray-700 px-3 py-1 text-center font-semibold align-middle ${getGroupStyle(r.setGroup)}`}
                      >
                        {group.multiplier || ""}
                      </td>
                    )}

                    {/* ✅ Set column */}
                    {isSwim ? (
                      <td className="border border-gray-700 px-3 py-1">
                        {r.set || r.distance || r.notes
                          ? `${r.set || ""}${
                              r.set && r.distance ? " × " : ""
                            }${r.distance ? `${r.distance}m` : ""}${
                              r.notes ? ` ${r.notes}` : ""
                            }`
                          : ""}
                      </td>
                    ) : (
                      <>
                        <td className="border border-gray-700 px-3 py-1">{r.name || ""}</td>
                        <td className="border border-gray-700 px-3 py-1 text-center">
                          {r.sets || ""}
                        </td>
                        <td className="border border-gray-700 px-3 py-1 text-center">
                          {r.reps || ""}
                        </td>
                        <td className="border border-gray-700 px-3 py-1 text-center">
                          {r.weight ? `${r.weight}kg` : ""}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};



  // --- Render Swim + Gym Sections ---
  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">
        Summary for {format(new Date(), "dd/MM/yyyy")}
      </h1>

      {/* Swim Sessions */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-3 border-b border-gray-700 pb-1">
          🏊 Swim Sessions
        </h2>
        {Object.keys(groupedSwim).length === 0 ? (
          <p className="text-gray-500">No swim sessions today.</p>
        ) : (
          Object.entries(groupedSwim).map(([title, rows]) =>
            renderTable(title, rows, true)
          )
        )}
      </div>

      {/* Gym Sessions */}
      <div>
        <h2 className="text-xl font-semibold mb-3 border-b border-gray-700 pb-1">
          🏋️ Gym Sessions
        </h2>
        {Object.keys(groupedGym).length === 0 ? (
          <p className="text-gray-500">No gym sessions today.</p>
        ) : (
          Object.entries(groupedGym).map(([title, rows]) =>
            renderTable(title, rows, false)
          )
        )}
      </div>
    </div>
  );
}

export default SummaryPage;
