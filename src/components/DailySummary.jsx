import React, { useState, useRef } from "react";
import styled from "styled-components";
import "bootstrap/dist/css/bootstrap.min.css";
import { doc, writeBatch } from "firebase/firestore";
import { db } from "../fireBase";

const DailyTableContainer = styled.div`
  width: 100vw;
  margin: 0;
`;

const DailyTableHeader = styled.th`
  background: linear-gradient(
    to left,
    #ffab40,
    #ff6d00,
    #ffab40
  ); /* Dual Sunset Gradient */
  color: white;
  font-weight: bold;
  text-align: center;
  border: 1px solid #ccc;
  height: 50px;
`;

const TableHeader = styled.th`
  background-color: ${(props) => (props.deficit ? "#ffcccc" : "#f2f2f2")};
`;

const DailyTable = styled.table`
  border-collapse: collapse;
  width: 100%;
  z-index: -1;

  th,
  td {
    border: 1px solid #ccc;
    padding: 9px;
    text-align: center;
  }

  th {
    background: linear-gradient(
      to left,
      #ffab40,
      #ff6d00,
      #ffab40
    ); /* Dual Sunset Gradient */
    font-weight: bold;
    text-align: center;
    color: white;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
    height: 50px;
  }

  td.text-left {
    text-align: left;
  }
`;

const CustomInput = styled.input`
  width: 130px;
  height: 34px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
`;

const ClearButton = styled.button`
  background: linear-gradient(to left, #ffab40, #ff6d00, #ffab40);
  color: white;
  border: none;
  padding: 9px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  width: 120px;
  font-weight: bold;
  text-align: center;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
`;

const SaveButton = styled.button`
  background: linear-gradient(to left, #ffab40, #ff0000, #ff6d00);
  border: none;
  padding: 9px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  text-align: center;
  width: 124px;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
  z-index: 999px;
`;

const TableRow = styled.tr`
  height: 50px;
  background-color: ${(props) => {
    const isTotalCalories = props.isTotalCalories;

    if (isTotalCalories) {
      return "#4f4f4f";
    } else {
      const calories = props.calories;
      if (calories < 0) {
        return "#7cbf7c";
      } else if (calories > 0) {
        return "#ff6666";
      } else {
        return calories === 0 ? "#f2f2f2" : "";
      }
    }
  }};

  td {
    position: relative;
  }
`;

const DailySummary = ({ selectedDay, summaryData, setSummaryData }) => {
  const bmiInputRef = useRef(null);
  const activityInputRef = useRef(null);
  const [, forceUpdate] = useState();
  const [rows, setRows] = useState([
    {
      id: 1,
      day: "",
      meal: "",
      food: "",
      grams: "",
      totalCalories: 0,
      inputDisabled: false,
      activity: "",
      bmi: "",
    },
  ]);

  const dailyTotalCalories = summaryData.reduce(
    (acc, row) => acc + (row.calories || 0),
    0
  );

  const dailyTotalTarget = summaryData.reduce(
    (acc, row) => acc + (row.target || 0),
    0
  );
  const dailyTotalRemaining = summaryData.reduce(
    (acc, row) => acc + (row.remaining || 0),
    0
  );

  const clearInput = () => {
    if (bmiInputRef.current) {
      bmiInputRef.current.value = "";
    }
  };

  const [clearOption, setClearOption] = useState({
    value: "all",
    label: "Clear All",
  });

  const handleSave = async () => {
    try {
      const batchedWrite = writeBatch(db);

      const mealRefs = {
        BMI: doc(db, selectedDay, "BMI"),
        Activity: doc(db, selectedDay, "Activity"),
        Beverage: doc(db, selectedDay, "Beverage"),
        Breakfast: doc(db, selectedDay, "Breakfast"),
        Dessert: doc(db, selectedDay, "Dessert"),
        Dinner: doc(db, selectedDay, "Dinner"),
        Lunch: doc(db, selectedDay, "Lunch"),
        TotalCalories: doc(db, selectedDay, "Total Calories"),
      };

      const updatedSummaryData = [...summaryData];

      updatedSummaryData.forEach((meal) => {
        if (mealRefs[meal.meal]) {
          batchedWrite.update(mealRefs[meal.meal], {
            Calories: meal.calories,
            Remaining: meal.remaining,
            Target: meal.target,
          });
        }
      });

      const totalCalories = updatedSummaryData.reduce((total, meal) => {
        return total + (meal.calories || 0);
      }, 0);

      batchedWrite.update(mealRefs.TotalCalories, {
        Calories: totalCalories,
      });

      await batchedWrite.commit();

      setSummaryData(updatedSummaryData);
    } catch (error) {
      console.error("Error updating documents: ", error);
      alert("Error saving table. Please try again later.");
    }
  };

  const handleClearTable = (selectedOption) => {
    let rowIdentifier = "all";

    if (selectedOption && selectedOption.value !== "all") {
      rowIdentifier = selectedOption.value;
    }

    forceUpdate(Date.now());
    console.log("Clearing Row Index:", rowIdentifier);

    if (rowIdentifier === "all") {
      const updatedRows = rows.map((row) => ({
        ...row,
        food: "",
        grams: "",
        meal: "",
        totalCalories: 0,
        inputDisabled: false,
        activity: "",
        bmi: "",
      }));
      setRows(updatedRows);
      clearInput();

      const updatedSummaryData = summaryData.map((item) => ({
        ...item,
        calories: 0,
        remaining: item.target,
      }));
      setSummaryData(updatedSummaryData);
    } else {
      const updatedRows = rows.map((row) =>
        row.meal === rowIdentifier
          ? {
              ...row,
              food: "",
              grams: "",
              meal: "",
              totalCalories: 0,
              inputDisabled: false,
              activity: "",
              bmi: "",
            }
          : row
      );
      setRows(updatedRows);

      const updatedSummaryData = summaryData.map((item) =>
        item.meal === rowIdentifier
          ? {
              ...item,
              calories: 0,
              remaining: item.target,
            }
          : item
      );
      setSummaryData(updatedSummaryData);
      setClearOption(null);
      clearInput();
    }
  };

  return (
    <DailyTableContainer>
      <DailyTable>
        <thead>
          <tr>
            <DailyTableHeader colSpan="4">Daily Summary</DailyTableHeader>
          </tr>
          <tr>
            <TableHeader>Meal</TableHeader>
            <TableHeader>Calories</TableHeader>
            <TableHeader>Target</TableHeader>
            <TableHeader>Remaining</TableHeader>
          </tr>
        </thead>

        <tbody>
          {summaryData.map((item, index) => (
            <TableRow key={index}>
              <td className="text-left">{item.meal}</td>
              <td>
                {item.meal === "BMI" ? (
                  <CustomInput
                    ref={bmiInputRef}
                    value={item.calories || ""}
                    onChange={(e) => {
                      const input = e.target.value;
                      const numericInput = input.replace(/\D/g, "");
                      let newCalories = parseFloat(numericInput) || 0;
                      if (newCalories > 0) {
                        newCalories = -newCalories;
                      }
                      const updatedSummaryData = summaryData.map((data, idx) =>
                        idx === index
                          ? {
                              ...data,
                              calories: newCalories,
                              remaining: data.target - newCalories,
                            }
                          : data
                      );
                      setSummaryData(updatedSummaryData);
                    }}
                    placeholder="Enter your BMI"
                  />
                ) : item.meal === "Activity" ? (
                  <CustomInput
                    ref={activityInputRef}
                    value={item.calories || ""}
                    onChange={(e) => {
                      const input = e.target.value;
                      const numericInput = input.replace(/\D/g, "");
                      let newCalories = parseFloat(numericInput) || 0;
                      newCalories = -Math.abs(newCalories);
                      const updatedSummaryData = summaryData.map((data, idx) =>
                        idx === index
                          ? {
                              ...data,
                              calories: newCalories,
                              remaining: data.target - newCalories,
                            }
                          : data
                      );
                      setSummaryData(updatedSummaryData);
                    }}
                    placeholder="Calories Burned"
                  />
                ) : (
                  <span>{item.calories}</span>
                )}
              </td>
              <td>{item.target}</td>
              <td>{item.remaining}</td>
            </TableRow>
          ))}
          <TableRow calories={dailyTotalCalories}>
            <td>Total Calories</td>
            <td>{dailyTotalCalories}</td>
            <td>{dailyTotalTarget}</td>
            <td>{dailyTotalRemaining}</td>
          </TableRow>
        </tbody>
      </DailyTable>
      <div className="buttons-container">
        <ClearButton
          style={{ marginLeft: "140px" }}
          onClick={() => handleClearTable(clearOption)}
        >
          Clear Table
        </ClearButton>
        <SaveButton onClick={handleSave}>Save Table</SaveButton>
      </div>
    </DailyTableContainer>
  );
};

export default DailySummary;
