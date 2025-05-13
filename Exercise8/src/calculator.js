export function setupCalculator() {
    let displayValue = '0';
    let firstOperand = null;
    let operator = null;
    let waitingForSecondOperand = false;
    
    const display = document.getElementById('display');
    
    function updateDisplay() {
      display.textContent = displayValue;
    }
    
    function clearDisplay() {
      displayValue = '0';
      firstOperand = null;
      operator = null;
      waitingForSecondOperand = false;
      updateDisplay();
    }
    
    function appendNumber(number) {
      if (waitingForSecondOperand) {
        displayValue = number;
        waitingForSecondOperand = false;
      } else {
        // Replace initial 0 with the number, unless it's a decimal point
        displayValue = displayValue === '0' ? number : displayValue + number;
      }
      updateDisplay();
    }
    
    function appendDecimal() {
      // If we're waiting for the second operand, start it with '0.'
      if (waitingForSecondOperand) {
        displayValue = '0.';
        waitingForSecondOperand = false;
        updateDisplay();
        return;
      }
      
      // If the display value doesn't contain a decimal point yet, add one
      if (!displayValue.includes('.')) {
        displayValue += '.';
        updateDisplay();
      }
    }
    
    function appendOperator(nextOperator) {
      const inputValue = parseFloat(displayValue);
      
      // If we already have a stored operator and value, calculate the result
      // of the previous operation before setting up the new one
      if (operator && waitingForSecondOperand) {
        operator = nextOperator;
        return;
      }
      
      if (firstOperand === null) {
        firstOperand = inputValue;
      } else if (operator) {
        const result = calculate();
        displayValue = String(result);
        firstOperand = result;
      }
      
      waitingForSecondOperand = true;
      operator = nextOperator;
      updateDisplay();
    }
    
    function calculate() {
      if (operator === null || waitingForSecondOperand) {
        return displayValue;
      }
      
      const secondOperand = parseFloat(displayValue);
      let result = 0;
      
      switch (operator) {
        case '+':
          result = firstOperand + secondOperand;
          break;
        case '-':
          result = firstOperand - secondOperand;
          break;
        case '*':
          result = firstOperand * secondOperand;
          break;
        case '/':
          if (secondOperand === 0) {
            clearDisplay();
            displayValue = 'Error';
            updateDisplay();
            return;
          }
          result = firstOperand / secondOperand;
          break;
        default:
          return;
      }
      
      // Round the result to avoid floating point issues
      result = Math.round(result * 1000000) / 1000000;
      
      // Reset the calculator state
      displayValue = String(result);
      operator = null;
      firstOperand = result;
      waitingForSecondOperand = false;
      updateDisplay();
      return result;
    }
  
    // Add event listeners for number buttons
    document.querySelectorAll('[data-number]').forEach(button => {
      button.addEventListener('click', () => {
        appendNumber(button.getAttribute('data-number'));
      });
    });
  
    // Add event listeners for operation buttons
    document.getElementById('add').addEventListener('click', () => appendOperator('+'));
    document.getElementById('subtract').addEventListener('click', () => appendOperator('-'));
    document.getElementById('multiply').addEventListener('click', () => appendOperator('*'));
    document.getElementById('divide').addEventListener('click', () => appendOperator('/'));
    document.getElementById('equals').addEventListener('click', calculate);
    document.getElementById('clear').addEventListener('click', clearDisplay);
    document.getElementById('decimal').addEventListener('click', appendDecimal);
    
    // Handle keyboard events
    document.addEventListener('keydown', (event) => {
      if (event.key >= '0' && event.key <= '9') {
        appendNumber(event.key);
      } else if (event.key === '.') {
        appendDecimal();
      } else if (event.key === '+' || event.key === '-' || event.key === '*' || event.key === '/') {
        appendOperator(event.key);
      } else if (event.key === 'Enter' || event.key === '=') {
        calculate();
      } else if (event.key === 'Escape' || event.key === 'c' || event.key === 'C') {
        clearDisplay();
      }
    });
  }