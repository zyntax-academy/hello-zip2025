import './style.css';

// Global variables
const apiBaseUrl = 'https://dummyjson.com/quotes';
let currentPage = 1;
let limit = 10;
let quotes = [];
let totalQuotes = 0;

// DOM Elements
const quotesGrid = document.getElementById('quotesGrid');
const loadingIndicator = document.getElementById('loadingIndicator');
const limitSelect = document.getElementById('limitSelect');
const pageNumbers = document.getElementById('pageNumbers');
const randomButton = document.getElementById('randomButton');
const randomQuoteText = document.getElementById('randomQuoteText');
const randomQuoteAuthor = document.getElementById('randomQuoteAuthor');

// Function to fetch quotes for the grid
async function fetchQuotes() {
    loadingIndicator.style.display = 'block';
    quotesGrid.innerHTML = '';
    
    try {
        const url = `${apiBaseUrl}?limit=${limit}&skip=${(currentPage - 1) * limit}`;
        const response = await fetch(url);
        const data = await response.json();
        
        quotes = data.quotes;
        totalQuotes = data.total;
        
        displayQuotes(quotes);
        updatePagination();
    } catch (error) {
        console.error('Error fetching quotes:', error);
        quotesGrid.innerHTML = `<p>Error loading quotes. Please try again.</p>`;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Function to fetch a random quote for the top section
async function fetchRandomQuote() {
    randomQuoteText.textContent = 'Loading random quote...';
    randomQuoteAuthor.textContent = 'by ...';
    
    try {
        const response = await fetch(`${apiBaseUrl}/random`);
        const data = await response.json();
        
        randomQuoteText.textContent = `"${data.quote}"`;
        randomQuoteAuthor.textContent = `by ${data.author}`;
    } catch (error) {
        console.error('Error fetching random quote:', error);
        randomQuoteText.textContent = 'Failed to load quote.';
        randomQuoteAuthor.textContent = 'Please try again';
    }
}

// Function to display quotes in the grid
function displayQuotes(quotes) {
    if (quotes.length === 0) {
        quotesGrid.innerHTML = '<p>No quotes found.</p>';
        return;
    }
    
    quotesGrid.innerHTML = '';
    quotes.forEach(quote => {
        const quoteCard = document.createElement('div');
        quoteCard.classList.add('quote-card');
        
        quoteCard.innerHTML = `
            <p class="quote-text">"${quote.quote}"</p>
            <p class="quote-author">by ${quote.author}</p>
        `;
        
        quotesGrid.appendChild(quoteCard);
    });
}

// Function to update pagination numbers
function updatePagination() {
    const totalPages = Math.ceil(totalQuotes / limit);
    pageNumbers.innerHTML = '';
    
    // Create a simplified pagination system
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    addPageNumber(1);
    
    // Ellipsis if necessary
    if (startPage > 2) {
        addEllipsis();
    }
    
    // Pages in between
    for (let i = Math.max(2, startPage); i <= Math.min(totalPages - 1, endPage); i++) {
        addPageNumber(i);
    }
    
    // Ellipsis if necessary
    if (endPage < totalPages - 1) {
        addEllipsis();
    }
    
    // Last page if not already included
    if (totalPages > 1) {
        addPageNumber(totalPages);
    }
}

// Helper function to add page number
function addPageNumber(pageNum) {
    const pageElement = document.createElement('div');
    pageElement.classList.add('page-number');
    if (pageNum === currentPage) {
        pageElement.classList.add('active');
    }
    pageElement.textContent = pageNum;
    pageElement.addEventListener('click', () => {
        currentPage = pageNum;
        fetchQuotes();
    });
    pageNumbers.appendChild(pageElement);
}

// Helper function to add ellipsis
function addEllipsis() {
    const ellipsis = document.createElement('div');
    ellipsis.classList.add('page-number');
    ellipsis.textContent = '...';
    ellipsis.style.cursor = 'default';
    pageNumbers.appendChild(ellipsis);
}

// Event Listeners
limitSelect.addEventListener('change', () => {
    limit = parseInt(limitSelect.value);
    currentPage = 1; // Reset to first page when changing limit
    fetchQuotes();
});

randomButton.addEventListener('click', () => {
    fetchRandomQuote();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchRandomQuote();
    fetchQuotes();
});