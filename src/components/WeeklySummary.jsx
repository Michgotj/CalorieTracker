import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../fireBase";

const WeeklyTableContainer = styled.div`
  width: 100vw;
  margin: 0;
`;

const WeeklySummaryTable = styled.table`
  border-collapse: collapse;
  width: 100%;

  th,
  td {
    border: 1px solid #ccc;
    padding: 9px;
    height: 50.6px;
  }

  th {
    background: linear-gradient(to left, #ffab40, #ff0000, #ff6d00);
    color: white;
    font-weight: bold;
    text-align: center;
    border: 1px solid #ccc;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
  }

  td {
    background-color: white;
    text-align: center;
  }

  td.text-left {
    text-align: start;
  }
`;

const WeeklyTableHeader = styled.th`
  background-color: #ff6f61;
  color: white;
  font-weight: bold;
  text-align: center;
  border: 1px solid #ccc;
  height: 50px;
`;
const TableHeader = styled.th`
  background-color: ${(props) => (props.deficit ? "#ffcccc" : "#f2f2f2")};
`;

const TableRow = styled.tr`
  height: 50px;

  td {
    position: relative;
  }
`;

const Checkmark = styled.span`
  color: green;
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
`;

const Cross = styled.span`
  color: red;
`;

const Question = styled.span`
  color: #333;
`;

const daysOfWeek = [
  { day: "Monday", deficitCalories: 0, Didyoumadeit: "?" },
  { day: "Tuesday", deficitCalories: 0, Didyoumadeit: "?" },
  { day: "Wednesday", deficitCalories: 0, Didyoumadeit: "?" },
  { day: "Thursday", deficitCalories: 0, Didyoumadeit: "?" },
  { day: "Friday", deficitCalories: 0, Didyoumadeit: "?" },
  { day: "Saturday", deficitCalories: 0, Didyoumadeit: "?" },
  { day: "Sunday", deficitCalories: 0, Didyoumadeit: "?" },
];

const WeeklySummary = () => {
  const [table3Data, setTable3Data] = useState([]);
  const [totalCalories, setTotalCalories] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      daysOfWeek.forEach(async (day) => {
        const dayRef = doc(db, day.day, "TotalCalories");
        const docSnapshot = await getDoc(dayRef);
        if (docSnapshot.exists()) {
          day.deficitCalories = docSnapshot.data().total || 0;
        }
      });
      const table3CollectionRefs = {
        Monday: doc(db, "Monday", "Total Calories"),
        Tuesday: doc(db, "Tuesday", "Total Calories"),
        Wednesday: doc(db, "Wednesday", "Total Calories"),
        Thursday: doc(db, "Thursday", "Total Calories"),
        Friday: doc(db, "Friday", "Total Calories"),
        Saturday: doc(db, "Saturday", "Total Calories"),
        Sunday: doc(db, "Sunday", "Total Calories"),
      };

      const table3Data = {};

      const table3Promises = Object.entries(table3CollectionRefs).map(
        async ([day, docRef]) => {
          try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              table3Data[day] = docSnap.data().Calories;
            }
          } catch (error) {
            console.error(`Error fetching data for ${day}:`, error);
          }
        }
      );

      await Promise.all(table3Promises);

      setTable3Data(table3Data);
    };

    fetchData();
  }, []);

  const fetchTotalCalories = async () => {
    try {
      let totalCaloriesSum = 0;
      for (const day of daysOfWeek) {
        const dayRef = doc(db, day.day, "Total Calories");
        const docSnap = await getDoc(dayRef);

        if (docSnap.exists()) {
          const dayCalories = docSnap.data().Calories || 0;
          totalCaloriesSum += dayCalories;
        }
      }
      return totalCaloriesSum;
    } catch (error) {
      console.error("Error fetching data:", error);
      return 0;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const totalCaloriesSum = await fetchTotalCalories();
      setTotalCalories(totalCaloriesSum);
    };

    fetchData();
  }, []);

  return (
    <WeeklyTableContainer>
      <WeeklySummaryTable>
        <thead>
          <tr>
            <WeeklyTableHeader colSpan="4">Weekly Summary</WeeklyTableHeader>
          </tr>

          <tr>
            <TableHeader>Day</TableHeader>
            <TableHeader>Calorie Deficit</TableHeader>
            <TableHeader>Did you make it?</TableHeader>
          </tr>
        </thead>

        <tbody>
          {Object.keys(table3Data).length === 0
            ? daysOfWeek.map((day) => (
                <TableRow key={day.day}>
                  <td className="text-left">{day.day}</td>
                  <td>{day.deficitCalories}</td>
                  <td>
                    {day.deficitCalories === undefined ? (
                      <Question>?</Question>
                    ) : day.Didyoumadeit !== undefined ? (
                      day.Didyoumadeit
                    ) : (
                      <Question>?</Question>
                    )}
                  </td>
                </TableRow>
              ))
            : Object.entries(table3Data).map(([day, calories]) => (
                <TableRow key={day} calories={calories}>
                  <td className="text-left">{day}</td>
                  <td>{calories !== undefined ? calories : 0}</td>
                  <td>
                    {calories > 0 ? (
                      <Cross>❌</Cross>
                    ) : calories < 0 ? (
                      <Checkmark>✔</Checkmark>
                    ) : (
                      <Question>?</Question>
                    )}
                  </td>
                </TableRow>
              ))}
          <TableRow>
            <td
              style={{
                backgroundColor:
                  totalCalories < 0
                    ? "#7cbf7c"
                    : totalCalories > 0
                      ? "#ff6666"
                      : "#f2f2f2",
              }}
              className="text-left"
            >
              Total Calorie Deficit
            </td>
            <td
              style={{
                backgroundColor:
                  totalCalories < 0
                    ? "#7cbf7c"
                    : totalCalories > 0
                      ? "#ff6666"
                      : "#f2f2f2",
              }}
            >
              {totalCalories}
            </td>
            <td
              style={{
                backgroundColor:
                  totalCalories < 0
                    ? "#7cbf7c"
                    : totalCalories > 0
                      ? "#ff6666"
                      : "#f2f2f2",
              }}
            >
              {totalCalories > 0 ? (
                <Cross>❌</Cross>
              ) : totalCalories < 0 ? (
                <Checkmark>✔</Checkmark>
              ) : (
                <Question>?</Question>
              )}
            </td>
          </TableRow>
        </tbody>
      </WeeklySummaryTable>
    </WeeklyTableContainer>
  );
};

export default WeeklySummary;
