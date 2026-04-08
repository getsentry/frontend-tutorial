import React, { useState } from 'react';
import './styles.css';

const App = () => {
  const [values, setValues] = useState({ first: '', second: '' });
  const [sum, setSum] = useState(null);
  const numericPattern = /^-?\d*(\.\d*)?$/;

  const updateValue = (field) => (event) => {
    const nextValue = event.target.value;
    if (nextValue === '' || numericPattern.test(nextValue)) {
      setValues((prev) => ({ ...prev, [field]: nextValue }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (values.first === '' || values.second === '') {
      setSum(null);
      return;
    }
    setSum(Number(values.first) + Number(values.second));
  };

  return (
    <main className="app-shell">
      <h1>Simple Adder</h1>
      <p className="subtitle">
        Type two numbers, hit add, and we will do the math for you.
      </p>
      <form className="sum-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>First number</span>
          <input
            type="number"
            inputMode="decimal"
            pattern="-?\\d*(\\.\\d*)?"
            className="number-input"
            value={values.first}
            onChange={updateValue('first')}
            placeholder="Enter a number"
            required
          />
        </label>
        <label className="field">
          <span>Second number</span>
          <input
            type="number"
            inputMode="decimal"
            pattern="-?\\d*(\\.\\d*)?"
            className="number-input"
            value={values.second}
            onChange={updateValue('second')}
            placeholder="Enter a number"
            required
          />
        </label>
        <button type="submit" className="primary">
          Add Numbers
        </button>
      </form>
      {sum !== null && (
        <div className="result-card">
          <span>Total</span>
          <span className="result-value">{sum}</span>
        </div>
      )}
    </main>
  );
};

export default App;
