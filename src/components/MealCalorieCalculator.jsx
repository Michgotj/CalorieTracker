import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import Select from "react-select";
import axios from "axios";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../fireBase";
import DailySummary from "./DailySummary";
import WeeklySummary from "./WeeklySummary";
import "bootstrap/dist/css/bootstrap.min.css";

const DailyWeeklyContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  width: 100%;
  margin: 0;
`;
const MealCalorieTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 4px;

  th,
  td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: center;
    height: 50px;
  }

  th {
    background-color: #f2f2f2;
    font-weight: bold;
    height: 50px;
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

const Dropdown = styled(Select)`
  width: 160px;
  height: 34px;
  font-size: 14px;
  margin-right: 5px;
  .select__control {
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
  }
  .select__single-value {
    color: #333;
  }
  .select__menu {
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
  }

  .select__option {
    color: gray;
  }
  .select__option--is-focused {
    background-color: #f2f2f2;
  }
  .select__indicator-separator {
    display: none;
  }
`;
const dayOptions = [
  { value: "Monday", label: "Monday" },
  { value: "Tuesday", label: "Tuesday" },
  { value: "Wednesday", label: "Wednesday" },
  { value: "Thursday", label: "Thursday" },
  { value: "Friday", label: "Friday" },
  { value: "Saturday", label: "Saturday" },
  { value: "Sunday", label: "Sunday" },
];
const initialState = [
  { meal: "Breakfast", calories: 0, target: 200, remaining: 200 },
  { meal: "Lunch", calories: 0, target: 200, remaining: 200 },
  { meal: "Dinner", calories: 0, target: 200, remaining: 200 },
  { meal: "Dessert", calories: 0, target: 200, remaining: 200 },
  { meal: "Beverage", calories: 0, target: 200, remaining: 200 },
  { meal: "Activity", calories: 0, target: -500, remaining: -500 },
  { meal: "BMI", calories: 0, target: -2000, remaining: -2000 },
];

const MealCalorieCalculator = () => {
  const [selectedDay, setSelectedDay] = useState("");
  const [summaryData, setSummaryData] = useState(initialState);
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
  const mealDropdownRef = useRef(null);
const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  const getCalories = async (foodName, grams) => {
    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: `How many calories are in ${grams} grams of ${foodName} on average? return only the calculate number with no explenation`,
      },
    ];
    const model = "gpt-4";
    const maxTokens = 10;
    const temperature = 0.7;

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: model,
          messages: messages,
          max_tokens: maxTokens,
          temperature: temperature,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const caloriesInfo = response.data.choices[0].message.content.trim();

      return { fullMessage: caloriesInfo };
    } catch (error) {
      throw error;
    }
  };

  const handleDaySelect = (option) => {
    setSelectedDay(option.value);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDay) return;

      try {
        const mealRefs = {
          Breakfast: doc(db, selectedDay, "Breakfast"),
          Lunch: doc(db, selectedDay, "Lunch"),
          Dinner: doc(db, selectedDay, "Dinner"),
          Dessert: doc(db, selectedDay, "Dessert"),
          Beverage: doc(db, selectedDay, "Beverage"),
          Activity: doc(db, selectedDay, "Activity"),
          BMI: doc(db, selectedDay, "BMI"),
        };

        const mealData = await Promise.all(
          Object.values(mealRefs).map(async (mealRef) => {
            const docSnapshot = await getDoc(mealRef);
            if (docSnapshot.exists()) {
              return docSnapshot.data();
            } else {
              return null;
            }
          })
        );

        const formattedData = initialState.map((item, index) => ({
          meal: item.meal,
          calories: mealData[index]?.Calories || item.calories,
          target: mealData[index]?.Target || item.target,
          remaining: mealData[index]?.Remaining || item.remaining,
        }));

        setSummaryData(formattedData);
      } catch (error) {}
    };

    fetchData();
  }, [selectedDay]);

  const handleMealSelect = (selectedOption, index) => {
    if (selectedOption && selectedOption.value) {
      const updatedRows = [...rows];
      if (updatedRows[index]) {
        updatedRows[index].meal = selectedOption.value;
        setRows(updatedRows);
      }
    }
  };

  const handleFoodSelect = (e, index) => {
    const selectedFood = e.target.value;
    const updatedRows = [...rows];
    updatedRows[index].food = selectedFood;
    setRows(updatedRows);
  };

  const handleGramsSelect = (e, index) => {
    const { value } = e.target;
    const updatedRows = [...rows];
    const grams = value.trim() !== "" ? parseInt(value) : 0;

    updatedRows[index].grams = isNaN(grams) ? 0 : grams;
    setRows(updatedRows);
  };

  const handleCalculateCalories = async (index) => {
    const updatedRows = [...rows];
    const selectedFood = updatedRows[index].food;

    if (selectedFood && !selectedFood.includes(",")) {
      try {
        const response = await getCalories(
          selectedFood,
          updatedRows[index].grams
        );

        if (response && response.fullMessage) {
          const caloriesInfo = response.fullMessage;
          const extractedNumber = parseFloat(caloriesInfo.match(/\d+/)[0]);

          if (!isNaN(extractedNumber)) {
            updatedRows[index].totalCalories = extractedNumber;
            updatedRows[index].inputDisabled = true;
            setRows(updatedRows);
          } else {
          }
        } else {
        }
      } catch (error) {}
    } else {
    }
  };

  const addCaloriesToTable = (calculateRow) => {
    handleClearRow(calculateRow);

    const updatedSummaryData = summaryData.map((summary) => {
      if (summary.meal === calculateRow.meal) {
        const newCalories = summary.calories + calculateRow.totalCalories;
        return {
          ...summary,
          calories: newCalories,
          remaining: summary.target - newCalories,
        };
      }
      return summary;
    });

    setSummaryData(updatedSummaryData);
  };

  const handleAddCaloriesToTable = (row) => {
    if (row && row.meal && row.totalCalories > 0) {
      addCaloriesToTable(row);
    } else {
    }
  };

  const handleClearRow = (row) => {
    if (mealDropdownRef.current && mealDropdownRef.current.setValue) {
      mealDropdownRef.current.setValue(null);
    }
    const dropdownRef = mealDropdownRef.current;

    if (dropdownRef) {
      if (dropdownRef.setValue) {
        dropdownRef.setValue(null);
      } else if (dropdownRef.clearValue) {
        dropdownRef.clearValue();
      } else {
      }
    } else {
    }

    const updatedRows = rows.map((rowItem) =>
      rowItem.id === row.id
        ? {
            ...rowItem,
            food: "",
            meal: "",
            grams: "",
            totalCalories: 0,
            inputDisabled: false,
            activity: "",
            bmi: "",
          }
        : rowItem
    );

    setRows(updatedRows);
  };

  return (
    <div className="meal-calorie-table-container">
      <MealCalorieTable>
        <thead>
          <tr>
            <th>What day is it?</th>
            <th>Choose a Meal</th>
            <th>What did you eat?</th>
            <th>How many grams?</th>
            <th>Calories Calculation</th>
            <th>Choose an Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td>
                <Dropdown
                  options={dayOptions}
                  value={dayOptions.find(
                    (option) => option.value === selectedDay
                  )}
                  onChange={handleDaySelect}
                  placeholder="Select Day"
                />
              </td>
              <td>
                <Dropdown
                  ref={mealDropdownRef}
                  value={
                    row.meal ? { value: row.meal, label: row.meal } : undefined
                  }
                  onChange={(selectedOption) =>
                    handleMealSelect(selectedOption, index)
                  }
                  options={[
                    { value: "Breakfast", label: "Breakfast" },
                    { value: "Lunch", label: "Lunch" },
                    { value: "Dinner", label: "Dinner" },
                    { value: "Dessert", label: "Dessert" },
                    { value: "Beverage", label: "Beverage" },
                  ]}
                  placeholder="Select Meal"
                />
              </td>
              <td>
                <CustomInput
                  value={row.food}
                  onChange={(e) => handleFoodSelect(e, index)}
                  placeholder="Enter Food Item"
                  disabled={row.inputDisabled}
                />
              </td>
              <td>
                <CustomInput
                  value={row.grams}
                  onChange={(e) => handleGramsSelect(e, index)}
                  placeholder="Enter Grams"
                  disabled={row.inputDisabled}
                />
              </td>
              <td>{row.totalCalories}</td>
              <td>
                <Dropdown
                  value={""}
                  onChange={(e) => {
                    const selectedAction = e.value;
                    if (selectedAction === "Calculate") {
                      handleCalculateCalories(index);
                    } else if (selectedAction === "addCaloriesToTable") {
                      handleAddCaloriesToTable(row);
                    } else if (selectedAction === "clear") {
                      handleClearRow(row);
                    }
                  }}
                  options={[
                    { value: "Calculate", label: "Calculate Calories" },
                    { value: "addCaloriesToTable", label: "Add to Table" },
                    { value: "clear", label: "Clear" },
                  ]}
                  placeholder="Select Action"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </MealCalorieTable>
      <DailyWeeklyContainer>
        <DailySummary
          selectedDay={selectedDay}
          summaryData={summaryData}
          setSummaryData={setSummaryData}
        />
        <WeeklySummary selectedDay={selectedDay} summaryData={summaryData} />
      </DailyWeeklyContainer>
    </div>
  );
};

export default MealCalorieCalculator;
