// Configuration
const BASE_API_URL = 'https://pokeapi.co/api/v2';
const DEFAULT_ITEMS_PER_PAGE = 20;
const MAX_POKEMON_ID = 898; // Limit to avoid incomplete data

// DOM Elements
const pokemonGrid = document.getElementById('pokemon-grid');
const generationSelect = document.getElementById('generation-select');
const typeSelect = document.getElementById('type-select');
const pokemonSearch = document.getElementById('pokemon-search');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfo = document.getElementById('page-info');
const themeSelect = document.getElementById('theme-select');
const itemsPerPageSelect = document.getElementById('items-per-page');
const pokemonModal = document.getElementById('pokemon-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalContent = document.getElementById('modal-content');
const loadingSpinner = document.getElementById('loading-spinner');

// Type Colors
const TYPE_COLORS = {
    normal: '#A8A878', fire: '#F08030', water: '#6890F0', 
    electric: '#F8D030', grass: '#78C850', ice: '#98D8D8', 
    fighting: '#C03028', poison: '#A040A0', ground: '#E0C068', 
    flying: '#A890F0', psychic: '#F85888', bug: '#A8B820', 
    rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', 
    dark: '#705848', steel: '#B8B8D0', fairy: '#EE99AC'
};

// Generation Ranges
const GENERATION_RANGES = [
    { name: 'Generation I', range: [1, 151] },
    { name: 'Generation II', range: [152, 251] },
    { name: 'Generation III', range: [252, 386] },
    { name: 'Generation IV', range: [387, 493] },
    { name: 'Generation V', range: [494, 649] },
    { name: 'Generation VI', range: [650, 721] },
    { name: 'Generation VII', range: [722, 809] },
    { name: 'Generation VIII', range: [810, 898] }
];

// State
let allPokemon = [];
let filteredPokemon = [];
let currentPage = 1;
let totalPages = 1;
let currentFilter = {
    generation: '',
    type: '',
    search: ''
};

// Cache
const pokemonCache = {};
const speciesCache = {};
const evolutionCache = {};

// Show/Hide Loading Spinner
function toggleLoadingSpinner(show) {
    loadingSpinner.classList.toggle('hidden', !show);
}

// Fetch all Pokémon basic data
async function fetchAllPokemon() {
    try {
        toggleLoadingSpinner(true);
        
        // Load from localStorage if available
        const cachedPokemonList = localStorage.getItem('pokemonList');
        if (cachedPokemonList) {
            allPokemon = JSON.parse(cachedPokemonList);
            console.log('Loaded Pokémon from cache');
            setupFilters();
            applyFilters();
            toggleLoadingSpinner(false);
            return;
        }
        
        // Fetch all Pokémon (limit to a reasonable number)
        const response = await fetch(`${BASE_API_URL}/pokemon?limit=${MAX_POKEMON_ID}`);
        const data = await response.json();
        
        // Extract ID from URL and add to each Pokémon
        allPokemon = data.results.map(pokemon => {
            const id = parseInt(pokemon.url.split('/').filter(part => part).pop());
            return {
                ...pokemon,
                id,
                // Add placeholder for types to be filled later
                types: []
            };
        });
        
        // Sort by ID
        allPokemon.sort((a, b) => a.id - b.id);
        
        // Save to localStorage
        localStorage.setItem('pokemonList', JSON.stringify(allPokemon));
        
        setupFilters();
        applyFilters();
    } catch (error) {
        console.error('Error fetching Pokémon:', error);
        pokemonGrid.innerHTML = `
            <div class="col-span-full text-center p-4">
                <p class="text-red-500">Failed to load Pokémon data. Please try again later.</p>
            </div>
        `;
    } finally {
        toggleLoadingSpinner(false);
    }
}

// Fetch detailed data for visible Pokémon
async function fetchVisiblePokemonDetails(pokemonList) {
    toggleLoadingSpinner(true);
    
    try {
        const itemsPerPage = parseInt(itemsPerPageSelect.value);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, pokemonList.length);
        const visiblePokemon = pokemonList.slice(startIndex, endIndex);
        
        // Fetch details for all visible Pokémon in parallel
        await Promise.all(visiblePokemon.map(async (pokemon) => {
            // Skip if we already have types data
            if (pokemon.types && pokemon.types.length > 0) return;
            
            try {
                const details = await fetchPokemonDetails(pokemon.id);
                // Update the Pokemon in our array with types info
                const index = allPokemon.findIndex(p => p.id === pokemon.id);
                if (index !== -1) {
                    allPokemon[index].types = details.types;
                    // Add sprite data
                    allPokemon[index].sprites = details.sprites;
                }
            } catch (error) {
                console.error(`Error fetching details for ${pokemon.name}:`, error);
            }
        }));
        
        // Save updated data to localStorage
        localStorage.setItem('pokemonList', JSON.stringify(allPokemon));
        
        renderPokemonGrid(pokemonList);
    } catch (error) {
        console.error('Error fetching Pokémon details:', error);
    } finally {
        toggleLoadingSpinner(false);
    }
}

// Fetch details for a single Pokémon
async function fetchPokemonDetails(id) {
    // Check cache first
    if (pokemonCache[id]) {
        return pokemonCache[id];
    }
    
    try {
        const response = await fetch(`${BASE_API_URL}/pokemon/${id}`);
        const data = await response.json();
        
        // Cache the result
        pokemonCache[id] = data;
        return data;
    } catch (error) {
        console.error(`Error fetching Pokémon #${id}:`, error);
        throw error;
    }
}

// Fetch species data for a Pokémon
async function fetchSpeciesData(id) {
    // Check cache first
    if (speciesCache[id]) {
        return speciesCache[id];
    }
    
    try {
        const response = await fetch(`${BASE_API_URL}/pokemon-species/${id}`);
        const data = await response.json();
        
        // Cache the result
        speciesCache[id] = data;
        return data;
    } catch (error) {
        console.error(`Error fetching species data for #${id}:`, error);
        throw error;
    }
}

// Fetch evolution chain data
async function fetchEvolutionChain(url) {
    // Extract the ID from the URL
    const id = url.split('/').filter(part => part).pop();
    
    // Check cache first
    if (evolutionCache[id]) {
        return evolutionCache[id];
    }
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Cache the result
        evolutionCache[id] = data;
        return data;
    } catch (error) {
        console.error('Error fetching evolution chain:', error);
        throw error;
    }
}

// Process evolution chain into a usable format
function processEvolutionChain(chain) {
    const evolutions = [];
    
    // Process the first Pokémon in the chain
    let currentEvolution = chain;
    
    while (currentEvolution) {
        // Extract ID from URL
        const speciesUrl = currentEvolution.species.url;
        const id = parseInt(speciesUrl.split('/').filter(part => part).pop());
        
        evolutions.push({
            id,
            name: currentEvolution.species.name,
            min_level: currentEvolution.evolution_details[0]?.min_level || null,
            trigger: currentEvolution.evolution_details[0]?.trigger?.name || null,
            item: currentEvolution.evolution_details[0]?.item?.name || null
        });
        
        // Move to the next evolution
        if (currentEvolution.evolves_to.length > 0) {
            currentEvolution = currentEvolution.evolves_to[0];
        } else {
            currentEvolution = null;
        }
    }
    
    return evolutions;
}

// Render Pokémon Grid
function renderPokemonGrid(pokemonList) {
    if (!pokemonList || pokemonList.length === 0) {
        pokemonGrid.innerHTML = `
            <div class="col-span-full text-center p-4">
                <p class="text-gray-600 dark:text-gray-300">No Pokémon found matching your search criteria.</p>
            </div>
        `;
        return;
    }
    
    // Calculate pagination
    const itemsPerPage = parseInt(itemsPerPageSelect.value);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, pokemonList.length);
    const paginatedPokemon = pokemonList.slice(startIndex, endIndex);
    
    // Render grid
    pokemonGrid.innerHTML = paginatedPokemon.map(pokemon => {
        // Default image if sprite is not available yet
        const sprite = pokemon.sprites?.front_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
        
        // Background color based on primary type
        const bgColor = pokemon.types && pokemon.types.length > 0 
            ? TYPE_COLORS[pokemon.types[0].type.name] + '20' 
            : '#f0f0f0';
        
        return `
            <div 
                class="pokemon-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center cursor-pointer hover:scale-105 transition-transform"
                data-pokemon-id="${pokemon.id}"
                style="background-color: ${bgColor}"
            >
                <img 
                    src="${sprite}" 
                    alt="${pokemon.name}" 
                    class="mx-auto w-32 h-32 object-contain"
                    loading="lazy"
                >
                <p class="text-lg font-semibold capitalize">${pokemon.name}</p>
                <div class="types flex justify-center mt-2">
                    ${pokemon.types && pokemon.types.map(type => `
                        <span 
                            class="type-tag px-2 py-1 rounded-lg text-white text-xs mr-1 capitalize"
                            style="background-color: ${TYPE_COLORS[type.type.name]}"
                        >
                            ${type.type.name}
                        </span>
                    `).join('') || ''}
                </div>
                <span class="text-gray-500 dark:text-gray-400 text-sm">
                    #${pokemon.id.toString().padStart(3, '0')}
                </span>
            </div>
        `;
    }).join('');
    
    // Update total pages
    totalPages = Math.ceil(pokemonList.length / itemsPerPage);
    
    // Add click event to cards
    document.querySelectorAll('.pokemon-card').forEach(card => {
        card.addEventListener('click', () => openPokemonModal(card.dataset.pokemonId));
    });
    
    // Update pagination controls
    updatePaginationControls();
}

// Update Pagination Controls
function updatePaginationControls() {
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
}

// Apply Filters
function applyFilters() {
    // Start with all Pokémon
    let result = [...allPokemon];
    
    // Apply generation filter
    if (currentFilter.generation) {
        const genIndex = parseInt(currentFilter.generation) - 1;
        if (genIndex >= 0 && genIndex < GENERATION_RANGES.length) {
            const [min, max] = GENERATION_RANGES[genIndex].range;
            result = result.filter(pokemon => pokemon.id >= min && pokemon.id <= max);
        }
    }
    
    // Apply type filter
    if (currentFilter.type && currentFilter.type !== '') {
        // If types are already loaded for all Pokémon
        result = result.filter(pokemon => 
            pokemon.types && pokemon.types.some(type => type.type.name === currentFilter.type)
        );
    }
    
    // Apply search filter
    if (currentFilter.search) {
        const searchTerm = currentFilter.search.toLowerCase();
        result = result.filter(pokemon => 
            pokemon.name.toLowerCase().includes(searchTerm) || 
            pokemon.id.toString().includes(searchTerm)
        );
    }
    
    // Update filtered Pokemon and reset to page 1
    filteredPokemon = result;
    currentPage = 1;
    
    // Fetch details for visible Pokémon and render grid
    fetchVisiblePokemonDetails(filteredPokemon);
}

// Theme Management
function applyTheme(theme) {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'dark' || (theme === 'system' && systemPrefersDark)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    // Save theme preference to localStorage
    localStorage.setItem('theme', theme);
}

// Initialize theme
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'system';
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);
    
    // Theme change listener
    themeSelect.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        applyTheme(selectedTheme);
    });
    
    // System theme change listener
    window.matchMedia('(prefers-color-scheme: dark)').addListener(() => {
        if (themeSelect.value === 'system') {
            applyTheme('system');
        }
    });
}

// Setup Filter Dropdowns
async function setupFilters() {
    // Populate generations dropdown
    generationSelect.innerHTML = '<option value="">All Generations</option>';
    GENERATION_RANGES.forEach((gen, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = gen.name;
        generationSelect.appendChild(option);
    });
    
    // Fetch and populate types dropdown
    try {
        const typeSelect = document.createElement('select');
        typeSelect.id = 'type-select';
        typeSelect.className = 'px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600';
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'All Types';
        typeSelect.appendChild(defaultOption);
        
        const response = await fetch(`${BASE_API_URL}/type`);
        const data = await response.json();
        
        // Filter out types that are not for Pokémon (like 'unknown' and 'shadow')
        const validTypes = data.results.filter(type => !['unknown', 'shadow'].includes(type.name));
        
        validTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.name;
            option.textContent = type.name.charAt(0).toUpperCase() + type.name.slice(1);
            typeSelect.appendChild(option);
        });
        
        // Add type filter to the page
        const filterDiv = document.querySelector('.flex.space-x-4');
        filterDiv.insertBefore(typeSelect, themeSelect);
        
        // Add event listener for type filter
        typeSelect.addEventListener('change', (e) => {
            currentFilter.type = e.target.value;
            applyFilters();
        });
        
    } catch (error) {
        console.error('Error fetching types:', error);
    }
    
    // Generation filter change event
    generationSelect.addEventListener('change', (e) => {
        currentFilter.generation = e.target.value;
        applyFilters();
    });
}

// Function to format stat names nicely
function formatStatName(statName) {
    // Map API stat names to display names
    const statNameMap = {
        'hp': 'HP',
        'attack': 'Attack',
        'defense': 'Defense',
        'special-attack': 'Sp. Atk',
        'special-defense': 'Sp. Def',
        'speed': 'Speed'
    };
    
    return statNameMap[statName] || statName.replace('-', ' ');
}

// Set up tab navigation
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active state from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('tab-active'));
            tabPanes.forEach(pane => pane.classList.add('hidden'));
            
            // Add active state to clicked button
            button.classList.add('tab-active');
            
            // Display corresponding pane
            const tabId = button.dataset.tab;
            document.getElementById(`${tabId}-tab`).classList.remove('hidden');
        });
    });
}

// Open Pokémon Modal with Tabs
async function openPokemonModal(pokemonId) {
    toggleLoadingSpinner(true);
    
    try {
        // Find the selected Pokémon
        const id = parseInt(pokemonId);
        
        // Fetch detailed data
        const pokemon = await fetchPokemonDetails(id);
        const species = await fetchSpeciesData(id);
        
        // Get English flavor text
        const flavorText = species.flavor_text_entries.find(
            entry => entry.language.name === 'en'
        )?.flavor_text.replace(/[\n\f]/g, ' ') || 'No description available.';
        
        // Set up evolution chain (if available)
        let evolutionHtml = '<p class="text-center text-gray-600 dark:text-gray-300">Evolution data not available.</p>';
        
        if (species.evolution_chain?.url) {
            try {
                const evolutionData = await fetchEvolutionChain(species.evolution_chain.url);
                const evolutionChain = processEvolutionChain(evolutionData.chain);
                
                if (evolutionChain.length > 1) {
                    evolutionHtml = `
                        <div class="evolution-chain">
                            <h3 class="text-xl font-semibold mb-4 text-center">Evolution Chain</h3>
                            <div class="flex flex-wrap justify-around items-center">
                                ${evolutionChain.map((evo, index) => `
                                    <div class="evolution-item text-center">
                                        <img 
                                            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png"
                                            alt="${evo.name}"
                                            class="w-20 h-20 mx-auto"
                                        >
                                        <p class="capitalize font-semibold">${evo.name}</p>
                                        ${index < evolutionChain.length - 1 ? `
                                            <div class="evolution-level text-center my-2">
                                                <div class="h-6 flex items-center justify-center">
                                                    ${evo.min_level ? `Lvl ${evo.min_level}` : ''}
                                                </div>
                                                <div class="arrow text-2xl">→</div>
                                            </div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error fetching evolution data:', error);
            }
        }
        
        // Prepare the "About" tab content
        const aboutTabContent = `
            <div class="about-content p-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="info-row">
                        <span class="text-gray-600 dark:text-gray-400">Species</span>
                        <span class="capitalize font-medium">${pokemon.types.map(type => type.type.name).join(', ')}</span>
                    </div>
                    <div class="info-row">
                        <span class="text-gray-600 dark:text-gray-400">Height</span>
                        <span class="font-medium">${(pokemon.height / 10).toFixed(1)}m</span>
                    </div>
                    <div class="info-row">
                        <span class="text-gray-600 dark:text-gray-400">Weight</span>
                        <span class="font-medium">${(pokemon.weight / 10).toFixed(1)}kg</span>
                    </div>
                    <div class="info-row">
                        <span class="text-gray-600 dark:text-gray-400">Abilities</span>
                        <span class="capitalize font-medium">${pokemon.abilities.map(ability => 
                            ability.ability.name.replace('-', ' ')
                        ).join(', ')}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Prepare the "Base Stats" tab content
        const statsTabContent = `
            <div class="stats-content p-4">
                ${pokemon.stats.map(stat => {
                    // Calculate a color based on the stat value
                    let statColor = '#FF5959'; // Red for low values
                    if (stat.base_stat >= 50 && stat.base_stat < 80) {
                        statColor = '#FF9659'; // Orange for medium values
                    } else if (stat.base_stat >= 80) {
                        statColor = '#4BC07A'; // Green for high values
                    }
                    
                    return `
                    <div class="stat-row flex items-center mb-4">
                        <span class="stat-name w-24 font-medium">${formatStatName(stat.stat.name)}</span>
                        <span class="stat-value w-12 text-right font-bold">${stat.base_stat}</span>
                        <div class="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-2 ml-4">
                            <div 
                                class="h-full rounded-full" 
                                style="width: ${Math.min(stat.base_stat / 2, 100)}%; background-color: ${statColor}"
                            ></div>
                        </div>
                    </div>
                    `;
                }).join('')}
                <div class="stat-row flex items-center mb-2">
                    <span class="stat-name w-24 font-medium">Total</span>
                    <span class="stat-value w-12 text-right font-bold">
                        ${pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0)}
                    </span>
                </div>
            </div>
        `;
        
        // Prepare the modal header
        const modalHeader = `
            <div class="modal-header text-center mb-4">
                <div class="relative w-full" style="background-color: ${TYPE_COLORS[pokemon.types[0].type.name] + '80'}">
                    <img 
                        src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}" 
                        alt="${pokemon.name}" 
                        class="mx-auto w-48 h-48 object-contain"
                    >
                    <div class="absolute top-2 right-4 text-white text-2xl opacity-50">#${pokemon.id.toString().padStart(3, '0')}</div>
                </div>
                <h2 class="text-2xl font-bold capitalize mt-2">${pokemon.name}</h2>
                <div class="modal-types flex justify-center mt-2 mb-4">
                    ${pokemon.types.map(type => `
                        <span 
                            class="type-tag px-3 py-1 rounded-lg text-white text-sm mx-1 capitalize"
                            style="background-color: ${TYPE_COLORS[type.type.name]}"
                        >
                            ${type.type.name}
                        </span>
                    `).join('')}
                </div>
                <p class="px-4 text-gray-700 dark:text-gray-300 mb-4">${flavorText}</p>
            </div>
        `;
        
        // Render modal content with tabs
        modalContent.innerHTML = `
            ${modalHeader}
            
            <div class="modal-tabs">
                <div class="tab-navigation flex justify-around border-b">
                    <button 
                        class="tab-btn py-2 px-4 w-1/3 text-center font-medium tab-active" 
                        data-tab="about"
                    >About</button>
                    <button 
                        class="tab-btn py-2 px-4 w-1/3 text-center font-medium" 
                        data-tab="stats"
                    >Base Stats</button>
                    <button 
                        class="tab-btn py-2 px-4 w-1/3 text-center font-medium" 
                        data-tab="evolution"
                    >Evolution</button>
                </div>
                
                <div class="tab-content">
                    <div id="about-tab" class="tab-pane active">
                        ${aboutTabContent}
                    </div>
                    <div id="stats-tab" class="tab-pane hidden">
                        ${statsTabContent}
                    </div>
                    <div id="evolution-tab" class="tab-pane hidden">
                        ${evolutionHtml}
                    </div>
                </div>
            </div>
        `;
        
        // Set up tab functionality
        setupTabNavigation();
        
        // Display modal
        pokemonModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error opening Pokémon modal:', error);
        modalContent.innerHTML = `
            <div class="text-center text-red-500">
                <p>Failed to load Pokémon details. Please try again later.</p>
            </div>
        `;
        pokemonModal.classList.remove('hidden');
    } finally {
        toggleLoadingSpinner(false);
    }
}

// Search Functionality
function setupSearchFunctionality() {
    let timeoutId;
    pokemonSearch.addEventListener('input', (e) => {
        // Debounce search
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            currentFilter.search = e.target.value.toLowerCase();
            applyFilters();
        }, 300);
    });
}

// Pagination Event Listeners
function setupPaginationListeners() {
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchVisiblePokemonDetails(filteredPokemon);
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchVisiblePokemonDetails(filteredPokemon);
        }
    });
    
    // Items per page change listener
    itemsPerPageSelect.addEventListener('change', () => {
        currentPage = 1;
        fetchVisiblePokemonDetails(filteredPokemon);
    });
}

// Modal Event Listeners
function setupModalListeners() {
    // Close modal button
    closeModalBtn.addEventListener('click', () => {
        pokemonModal.classList.add('hidden');
    });
    
    // Close modal when clicking outside
    pokemonModal.addEventListener('click', (e) => {
        if (e.target === pokemonModal) {
            pokemonModal.classList.add('hidden');
        }
    });
    
    // Close modal with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !pokemonModal.classList.contains('hidden')) {
            pokemonModal.classList.add('hidden');
        }
    });
}

// Add tab styles to the stylesheet
function addTabStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .tab-active {
            color: #3B82F6;
            border-bottom: 2px solid #3B82F6;
        }
        
        .tab-pane {
            animation: fadeIn 0.3s ease;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .evolution-level {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
    `;
    document.head.appendChild(styleElement);
}

// Clear localStorage cache
function setupCacheClear() {
    // Add a small button to clear cache (for development)
    const header = document.querySelector('header');
    const clearCacheBtn = document.createElement('button');
    clearCacheBtn.className = 'px-2 py-1 text-xs bg-red-500 text-white rounded absolute top-4 right-4';
    clearCacheBtn.textContent = 'Clear Cache';
    clearCacheBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.reload();
    });
    header.style.position = 'relative';
    header.appendChild(clearCacheBtn);
}

// Initialize App
function initApp() {
    // Initialize theme
    initTheme();
    
    // Setup event listeners
    setupPaginationListeners();
    setupModalListeners();
    setupSearchFunctionality();

    fetchAllPokemon();
}

// Start the app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);