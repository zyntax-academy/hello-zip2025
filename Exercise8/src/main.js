import './style.css'
import { setupCalculator } from './calculator.js'

document.querySelector('#app').innerHTML = `
  <div class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-gray-800 p-6 rounded-2xl shadow-xl w-80">
      <div class="mb-4">
        <div id="display" class="bg-gray-200 p-4 rounded-lg text-right text-3xl font-mono h-20 flex items-end justify-end overflow-hidden">0</div>
      </div>
      <div class="grid grid-cols-4 gap-2">
        <!-- First row -->
        <button id="clear" class="calculator-button bg-red-500 hover:bg-red-600 text-white py-4 rounded-lg text-2xl font-semibold">C</button>
        <button id="divide" class="calculator-button bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-lg text-2xl font-semibold">&divide;</button>
        <button id="multiply" class="calculator-button bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-lg text-2xl font-semibold">&times;</button>
        <button id="subtract" class="calculator-button bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-lg text-2xl font-semibold">&minus;</button>
        
        <!-- Second row -->
        <button class="calculator-button bg-gray-600 hover:bg-gray-500 text-white py-4 rounded-lg text-2xl" data-number="7">7</button>
        <button class="calculator-button bg-gray-600 hover:bg-gray-500 text-white py-4 rounded-lg text-2xl" data-number="8">8</button>
        <button class="calculator-button bg-gray-600 hover:bg-gray-500 text-white py-4 rounded-lg text-2xl" data-number="9">9</button>
        <button id="add" class="calculator-button bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-lg text-2xl font-semibold row-span-2">&plus;</button>
        
        <!-- Third row -->
        <button class="calculator-button bg-gray-600 hover:bg-gray-500 text-white py-4 rounded-lg text-2xl" data-number="4">4</button>
        <button class="calculator-button bg-gray-600 hover:bg-gray-500 text-white py-4 rounded-lg text-2xl" data-number="5">5</button>
        <button class="calculator-button bg-gray-600 hover:bg-gray-500 text-white py-4 rounded-lg text-2xl" data-number="6">6</button>
        
        <!-- Fourth row -->
        <button class="calculator-button bg-gray-600 hover:bg-gray-500 text-white py-4 rounded-lg text-2xl" data-number="1">1</button>
        <button class="calculator-button bg-gray-600 hover:bg-gray-500 text-white py-4 rounded-lg text-2xl" data-number="2">2</button>
        <button class="calculator-button bg-gray-600 hover:bg-gray-500 text-white py-4 rounded-lg text-2xl" data-number="3">3</button>
        <button id="equals" class="calculator-button bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-lg text-2xl font-semibold row-span-2">&equals;</button>
        
        <!-- Fifth row -->
        <button class="calculator-button bg-gray-600 hover:bg-gray-500 text-white py-4 rounded-lg text-2xl col-span-2" data-number="0">0</button>
        <button id="decimal" class="calculator-button bg-gray-600 hover:bg-gray-500 text-white py-4 rounded-lg text-2xl">.</button>
      </div>
    </div>
  </div>
`

setupCalculator()