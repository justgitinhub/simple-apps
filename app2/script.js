// Global variables
let allMensProducts = [];
let allWomensProducts = [];
let currentTab = 'mens';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const productNameSelect = document.getElementById('productNameSelect');
const productListDisplayWindow = document.getElementById('productListDisplayWindow'); 
const selectedProductDetailContainer = document.getElementById('selectedProductDetailContainer'); 
const mensTabButton = document.getElementById('mensTabButton');
const womensTabButton = document.getElementById('womensTabButton');
const resetButton = document.getElementById('resetButton');

/**
 * Fetches and loads product data from an XLSX file.
 */
async function loadProducts() {
    try {
        if (productListDisplayWindow) productListDisplayWindow.innerHTML = '<p class="message">Loading products...</p>';
        if (selectedProductDetailContainer) selectedProductDetailContainer.innerHTML = '';

        const excelFileName = 'products.xlsx'; 
        const mensSheetName = 'Mens';         
        const womensSheetName = 'Womens';       

        const response = await fetch(excelFileName);
        if (!response.ok) throw new Error(`Failed to fetch Excel file ('${excelFileName}'): ${response.status} ${response.statusText}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const mensSheet = workbook.Sheets[mensSheetName];
        allMensProducts = mensSheet ? XLSX.utils.sheet_to_json(mensSheet) : [];
        if (allMensProducts.length > 0) console.log("Men's products loaded:", allMensProducts.length);

        const womensSheet = workbook.Sheets[womensSheetName];
        allWomensProducts = womensSheet ? XLSX.utils.sheet_to_json(womensSheet) : [];
        if (allWomensProducts.length > 0) console.log("Women's products loaded:", allWomensProducts.length);
        
        populateProductNameDropdown(); 
        const initialProducts = currentTab === 'mens' ? allMensProducts : allWomensProducts;
        displayProductList(initialProducts);

    } catch (error) {
        console.error("Error loading product data:", error);
        if (productListDisplayWindow) productListDisplayWindow.innerHTML = `<p class="message" style="color: red;">Error loading products. Check console.</p>`;
    }
}

/**
 * Populates the product name select dropdown.
 */
function populateProductNameDropdown() {
    if (!productNameSelect) return;
    const sourceProducts = currentTab === 'mens' ? allMensProducts : allWomensProducts;
    if (!Array.isArray(sourceProducts) || sourceProducts.length === 0) {
        productNameSelect.innerHTML = '<option value="">-- No Product Names Available --</option>';
        return;
    }
    const productNames = sourceProducts.map(p => p.ProductName); 
    const uniqueProductNames = [...new Set(productNames.filter(name => name && typeof name === 'string' && name.trim() !== ''))].sort(); 
    productNameSelect.innerHTML = '<option value="">-- Select a Product Name --</option>'; 
    uniqueProductNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        productNameSelect.appendChild(option);
    });
}

/**
 * Displays a list of product codes (with Finish and Doors) in productListDisplayWindow.
 * @param {string} selectedProductName - The product name to find codes for.
 */
function displayProductCodesForName(selectedProductName) {
    if (!productListDisplayWindow || !selectedProductName) return;
    
    if (selectedProductDetailContainer) selectedProductDetailContainer.innerHTML = ''; 

    const sourceProducts = currentTab === 'mens' ? allMensProducts : allWomensProducts;
    const matchingProductsByName = Array.isArray(sourceProducts) ? sourceProducts.filter(p => p.ProductName === selectedProductName) : [];
    
    const uniqueProductCodes = [...new Set(matchingProductsByName.map(p => p.ProductCode).filter(code => code && (typeof code === 'string' || typeof code === 'number') && String(code).trim() !== ''))].sort();

    productListDisplayWindow.innerHTML = ''; 
    if (uniqueProductCodes.length === 0) {
        productListDisplayWindow.innerHTML = `<p class="message">No product codes found for "${selectedProductName}".</p>`;
        return;
    }

    const listContainer = document.createElement('div');
    listContainer.classList.add('product-code-list-container');
    const title = document.createElement('h4'); 
    title.classList.add('product-code-list-title');
    title.textContent = `Available Variants for: ${selectedProductName}`;
    listContainer.appendChild(title);

    uniqueProductCodes.forEach(code => {
        const productDetailsForThisCode = matchingProductsByName.find(p => p.ProductCode == code);

        if (productDetailsForThisCode) {
            const codeItem = document.createElement('div');
            codeItem.classList.add('product-code-item', 'clickable-code'); 
            codeItem.setAttribute('data-product-code', code); 
            
            let itemHTML = `<span class="code-detail"><strong>Code:</strong> ${String(code)}</span>`;
            itemHTML += `<span class="finish-detail"><strong>Finish:</strong> ${productDetailsForThisCode.ProductFinish || 'N/A'}</span>`;
            itemHTML += `<span class="doors-detail"><strong>Doors:</strong> ${productDetailsForThisCode.Doors || 'N/A'}</span>`;
            codeItem.innerHTML = itemHTML;
            
            codeItem.addEventListener('click', () => {
                displaySingleSelectedProductDetail(productDetailsForThisCode); 
            });
            listContainer.appendChild(codeItem);
        }
    });
    productListDisplayWindow.appendChild(listContainer);
}

/**
 * Displays a single, fully detailed product card in selectedProductDetailContainer.
 * @param {Object} product - The product object to display.
 */
function displaySingleSelectedProductDetail(product) { 
    if (!selectedProductDetailContainer || !product) return;
    selectedProductDetailContainer.innerHTML = ''; 

    const productItemWrapper = document.createElement('div'); 
    const productItem = document.createElement('div');
    productItem.classList.add('product-item'); 

    const detailedView = document.createElement('div');
    detailedView.classList.add('detailed-view');

    const createDetailParagraph = (label, value) => {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${label}:</strong> ${value !== undefined && value !== null ? String(value) : 'N/A'}`;
        return p;
    };
    
    detailedView.appendChild(createDetailParagraph('Product Name', product.ProductName));
    detailedView.appendChild(createDetailParagraph('Product Code', product.ProductCode));
    detailedView.appendChild(createDetailParagraph('Finish', product.ProductFinish));
    detailedView.appendChild(createDetailParagraph('Material', product.Material));
    detailedView.appendChild(createDetailParagraph('Fabric Weight', product.FabricWeight));
    detailedView.appendChild(createDetailParagraph('Carryover', product.Carryover));
    detailedView.appendChild(createDetailParagraph('Arrival', product.Arrival));
    detailedView.appendChild(createDetailParagraph('Replen', product.Replen));
    detailedView.appendChild(createDetailParagraph('Doors', product.Doors));
    detailedView.appendChild(createDetailParagraph('Standard', product.Standard));
    detailedView.appendChild(createDetailParagraph('Online Order', product.OnlineOrder));
    
    productItem.appendChild(detailedView);
    productItemWrapper.appendChild(productItem);
    
    selectedProductDetailContainer.appendChild(productItemWrapper);
}


/**
 * Displays a list of products (summary view) in productListDisplayWindow.
 */
function displayProductList(productsToDisplay) {
    if (!productListDisplayWindow) return;
    productListDisplayWindow.innerHTML = ''; 
    
    if (!productsToDisplay || productsToDisplay.length === 0) {
        productListDisplayWindow.innerHTML = '<p class="message">No products found.</p>';
        return;
    }

    productsToDisplay.forEach(product => {
        const productItem = document.createElement('div');
        productItem.classList.add('product-item'); 

        const summaryView = document.createElement('div');
        summaryView.classList.add('summary-view');
        summaryView.innerHTML = `
            <span class="summary-name">${product.ProductName || 'N/A'}</span>
            <span class="summary-code"><strong>Code:</strong> ${product.ProductCode || 'N/A'}</span>
            <span class="summary-finish"><strong>Finish:</strong> ${product.ProductFinish || 'N/A'}</span>
        `;
        productItem.appendChild(summaryView);
        
        productItem.addEventListener('click', () => {
            displaySingleSelectedProductDetail(product); 
        });
        
        productListDisplayWindow.appendChild(productItem);
    });
}

/**
 * Resets the view to the initial state for the current tab.
 */
function resetView() {
    if (searchInput) searchInput.value = '';
    if (productNameSelect) productNameSelect.value = '';
    if (selectedProductDetailContainer) selectedProductDetailContainer.innerHTML = '';
    
    const sourceProducts = currentTab === 'mens' ? allMensProducts : allWomensProducts;
    displayProductList(sourceProducts);
}

/**
 * Filters products based on the search input, including specific "doors" query.
 */
function filterProductsBySearch() {
    if (selectedProductDetailContainer) selectedProductDetailContainer.innerHTML = '';
    if (!searchInput) return;

    const fullSearchTerm = searchInput.value.toLowerCase().trim();
    let sourceProducts = currentTab === 'mens' ? allMensProducts : allWomensProducts;

    if (!Array.isArray(sourceProducts)) {
        displayProductList([]); 
        return;
    }
    
    let filteredList = sourceProducts;

    // --- Parse for "doors" query ---
    const doorsRegex = /doors\s*[:,-]?\s*(\d+)/; // Matches "doors : 100", "doors,100", "doors-100", "doors100" (if no space after doors)
    const doorsMatch = fullSearchTerm.match(doorsRegex);
    let doorsQueryValue = null;
    let remainingKeywordsString = fullSearchTerm;

    if (doorsMatch && doorsMatch[1]) {
        doorsQueryValue = parseInt(doorsMatch[1], 10);
        if (!isNaN(doorsQueryValue)) {
            console.log(`Doors query found: >= ${doorsQueryValue}`);
            // Remove the doors query part from the string for general keyword search
            remainingKeywordsString = fullSearchTerm.replace(doorsRegex, '').trim();
        } else {
            doorsQueryValue = null; // Invalid number, treat as no doors query
            console.warn("Invalid number in doors query:", doorsMatch[1]);
        }
    }
    
    // --- Split remaining string into keywords ---
    const keywords = remainingKeywordsString.split(/[\s,]+/).filter(k => k.length > 0);
    console.log("Keywords for search:", keywords);

    // --- Apply filters ---
    if (doorsQueryValue !== null || keywords.length > 0) {
        filteredList = sourceProducts.filter(product => {
            let matchesDoors = true;
            if (doorsQueryValue !== null) {
                const productDoors = parseInt(product.Doors, 10);
                if (isNaN(productDoors) || productDoors < doorsQueryValue) {
                    matchesDoors = false;
                }
            }

            let matchesKeywords = true;
            if (keywords.length > 0) {
                // Define fields for keyword search (excluding Doors as it's handled)
                const keywordSearchableFields = [
                    product.ProductName, product.ProductCode, product.ProductFinish, product.ProductType,
                    product.Material, product.FabricWeight, product.Carryover, product.Arrival,
                    product.Replen, /* product.Doors, // Already handled */
                    product.Standard, product.OnlineOrder
                ];
                matchesKeywords = keywords.every(keyword => 
                    keywordSearchableFields.some(fieldValue => 
                        fieldValue && String(fieldValue).toLowerCase().includes(keyword)
                    )
                );
            } else if (remainingKeywordsString.length > 0 && keywords.length === 0) {
                // If there was a remaining string but it resulted in no valid keywords (e.g., just ", ,")
                // and there was no doors query, this implies an invalid keyword search.
                // However, if there *was* a doors query, and the rest was empty/invalid, we only care about doors.
                if (doorsQueryValue === null) matchesKeywords = false;
            }


            return matchesDoors && matchesKeywords;
        });
    } else if (fullSearchTerm.length > 0) { 
        // If fullSearchTerm is not empty, but no doors query and no valid keywords were parsed
        // (e.g., user typed only spaces or commas), show no results.
        // If fullSearchTerm is empty, the initial filteredList (all products) will be shown.
        filteredList = [];
    }
    
    displayProductList(filteredList); 
}

/**
 * Handles tab switching.
 */
function openTab(tabName) {
    currentTab = tabName;
    resetView(); 

    if (mensTabButton && womensTabButton) {
        mensTabButton.classList.toggle('active', tabName === 'mens');
        womensTabButton.classList.toggle('active', tabName === 'womens');
    }
    populateProductNameDropdown(); 
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadProducts(); 

    if (mensTabButton) mensTabButton.addEventListener('click', () => openTab('mens'));
    if (womensTabButton) womensTabButton.addEventListener('click', () => openTab('womens'));
    
    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            if (productNameSelect) productNameSelect.value = ''; 
            filterProductsBySearch();
        });
    }

    if (productNameSelect) {
        productNameSelect.addEventListener('change', (event) => {
            const selectedName = event.target.value;
            if(searchInput) searchInput.value = ''; 
            if (selectedName) {
                displayProductCodesForName(selectedName); 
            } else {
                 const sourceProducts = currentTab === 'mens' ? allMensProducts : allWomensProducts;
                 displayProductList(sourceProducts); 
            }
        });
    }

    if (resetButton) { 
        resetButton.addEventListener('click', resetView);
    }
});


// JavaScript for Hamburger Menu Toggle

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  
  // Get the hamburger icon and the dropdown menu elements
  const hamburgerIcon = document.getElementById('hamburgerIcon');
  const dropdownMenu = document.getElementById('dropdownMenu');

  // Check if both elements exist to prevent errors
  if (hamburgerIcon && dropdownMenu) {
    // Add a click event listener to the hamburger icon
    hamburgerIcon.addEventListener('click', function(event) {
      // Toggle the 'menu-open' class on the dropdown menu
      // This class will control its visibility (defined in CSS)
      dropdownMenu.classList.toggle('menu-open');
      
      // Prevent the click from propagating to the document
      // if we add a document click listener to close the menu later
      event.stopPropagation(); 
    });

    // Optional: Close the dropdown if the user clicks outside of it
    document.addEventListener('click', function(event) {
      // Check if the dropdown is open and the click was outside the menu and icon
      if (dropdownMenu.classList.contains('menu-open') && 
          !dropdownMenu.contains(event.target) && 
          !hamburgerIcon.contains(event.target)) {
        dropdownMenu.classList.remove('menu-open');
      }
    });
  } else {
    console.warn("Hamburger icon or dropdown menu element not found. Menu will not function.");
  }

});
