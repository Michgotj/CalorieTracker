import React from 'react';
import MealCalorieCalculator from "./components/MealCalorieCalculator";
import './App.css';

function App() {
  return (
      <div className="container">
        <header className="app-header">
          <h1>Calorie Tracker</h1>
        </header>
        <MealCalorieCalculator/> 
      </div>
  );
}

export default App;
