// Global data store: an object to hold product data arrays for each gender
let productDataByGender = {
    "Mens": [],
    "Womens": []
};
const entries = [];
const selectedSizes = new Set();

// DOM Elements Cache
const elements = {};

// Function to get all DOM elements and cache them
function getDOMElements() {
    elements.storeName = document.getElementById("storeName");
    elements.genderButtons = document.getElementById("genderButtons");
    elements.genderSelect = document.getElementById("gender"); // Hidden select

    if (elements.genderSelect) {
        elements.genderSelect.innerHTML = ''; 
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Select Gender";
        elements.genderSelect.appendChild(defaultOption);
        const mensOption = document.createElement('option');
        mensOption.value = "Mens";
        mensOption.textContent = "Mens";
        elements.genderSelect.appendChild(mensOption);
        const womensOption = document.createElement('option');
        womensOption.value = "Womens";
        womensOption.textContent = "Womens";
        elements.genderSelect.appendChild(womensOption);
        elements.genderSelect.value = "";
    } else {
        console.error("DEBUG: Hidden gender select element (id='gender') not found in getDOMElements!");
    }

    elements.productNameSelect = document.getElementById("productName");
    elements.productCodeSelect = document.getElementById("productCode");
    elements.productTypeInput = document.getElementById("productType");
    elements.sizeGrid = document.getElementById("sizeGrid");
    elements.addEntryBtn = document.getElementById("addEntryBtn");
    elements.entryList = document.getElementById("entryList");
    elements.exportBtn = document.getElementById("exportBtn");
    elements.toggleInfoBtn = document.getElementById("toggleInfo");
    elements.infoBox = document.getElementById("infoBox");
    elements.productForm = document.getElementById("productForm");
    elements.notes = document.getElementById("notes");
    elements.appContainer = document.querySelector('.app-container'); // Cache app container
}

// Load Excel product list
async function loadProductData() {
    const loadingMessageP = document.querySelector('.app-container > p:nth-of-type(1)'); // Subtitle
    const statusParagraph = document.querySelector('.app-container > p:nth-of-type(2)'); // Status message

    try {
        const response = await fetch('products.xlsx');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const gendersToLoad = ["Mens", "Womens"];
        let loadedCount = 0;
        let partialLoadSuccess = false;

        for (const gender of gendersToLoad) {
            const sheetName = gender;
            if (workbook.SheetNames.includes(sheetName)) {
                const sheet = workbook.Sheets[sheetName];
                const jsonSheetData = XLSX.utils.sheet_to_json(sheet);
                if (!Array.isArray(jsonSheetData)) {
                     console.warn(`Data in sheet '${sheetName}' is not an array. Skipping this sheet.`);
                    continue;
                }

                const processedSheetData = jsonSheetData.map(row => {
                    if (row["ProductName"] === undefined || row["ProductCode"] === undefined || row["ProductType"] === undefined) {
                        console.warn(`A row in sheet '${sheetName}' is missing ProductName, ProductCode, or ProductType. Row:`, row);
                    }
                    return {
                        productName: String(row["ProductName"] || "").trim(),
                        productCode: String(row["ProductCode"] || "").trim(),
                        productFinish: String(row["ProductFinish"] || "").trim(),
                        productType: String(row["ProductType"] || "").trim()
                    };
                }).filter(p => p.productName && p.productCode && p.productType);

                productDataByGender[gender] = processedSheetData;
                loadedCount += processedSheetData.length;
                if (processedSheetData.length > 0) {
                    partialLoadSuccess = true;
                } else {
                    console.warn(`No valid product data found in sheet: ${sheetName} after processing. Check headers (ProductName, ProductCode, ProductType) and content.`);
                }
            } else {
                console.warn(`Sheet named '${sheetName}' not found in products.xlsx.`);
            }
        }

        if (!partialLoadSuccess) {
            const errorMsg = "No valid product data found. Check 'Mens'/'Womens' sheets and headers (ProductName, ProductCode, ProductType).";
            if (statusParagraph) statusParagraph.innerHTML = `<strong style="color: red;">${errorMsg}</strong>`;
            throw new Error(errorMsg);
        }
        if (statusParagraph) {
            statusParagraph.textContent = `Product data loaded (${loadedCount} items).`;
        }

    } catch (error) {
        console.error("Error loading/processing product data:", error);
        if (statusParagraph) {
            statusParagraph.innerHTML = `<strong style="color: red;">Failed to load product data. Details: ${error.message}</strong>`;
        }
        throw error;
    }
}

// Initialize event listeners
function initEventListeners() {
    const { genderButtons, productNameSelect, productCodeSelect, addEntryBtn, exportBtn, toggleInfoBtn } = elements;

    document.querySelectorAll('.gender-icon').forEach(button => {
        button.addEventListener('click', () => {
            const selectedGender = button.getAttribute('data-gender');
            if (!elements.genderSelect) { console.error("elements.genderSelect not found!"); return; }
            elements.genderSelect.value = selectedGender;

            if (!productDataByGender[selectedGender] || productDataByGender[selectedGender].length === 0) {
                alert(`Product data for ${selectedGender} is not available or empty. Please check the '${selectedGender}' sheet in products.xlsx.`);
                resetProductSelections(); return;
            }
            document.querySelectorAll('.gender-icon').forEach(b => b.classList.remove('selected'));
            button.classList.add('selected');
            populateProductNames(selectedGender);
            elements.productCodeSelect.innerHTML = '<option value="">Select Product Name First</option>';
            elements.productCodeSelect.disabled = true;
            elements.productTypeInput.value = '';
            renderSizeButtons(selectedGender, '');
        });
    });

    productNameSelect.addEventListener("change", () => {
        if (!elements.genderSelect) { console.error("elements.genderSelect not found!"); return; }
        const gender = elements.genderSelect.value;
        const productName = productNameSelect.value;
        if (!gender) {
            console.warn("Gender not selected when product name changed.");
            elements.productCodeSelect.innerHTML = '<option value="">Select Gender First</option>';
            elements.productCodeSelect.disabled = true;
            elements.productTypeInput.value = ''; return;
        }
        populateProductCodes(gender, productName);
        elements.productTypeInput.value = '';
        renderSizeButtons(gender, '');
    });

    productCodeSelect.addEventListener("change", () => {
        const gender = elements.genderSelect.value;
        const productName = productNameSelect.value;
        const productCode = productCodeSelect.value;
        if (!gender || !productName) {
            console.warn("Gender or Product Name not selected when product code changed.");
            elements.productTypeInput.value = ''; return;
        }
        updateProductType(gender, productName, productCode);
        renderSizeButtons(gender, elements.productTypeInput.value);
    });

    addEntryBtn.addEventListener("click", addEntry);
    exportBtn.addEventListener("click", exportToExcel);
    toggleInfoBtn.addEventListener("click", toggleInfoBox);
}

// Populate product names
function populateProductNames(gender) {
    const { productNameSelect } = elements;
    productNameSelect.innerHTML = '<option value="">Select Product Name</option>';
    const products = productDataByGender[gender];
    if (!products || products.length === 0) { productNameSelect.disabled = true; return; }
    const uniqueNames = [...new Set(products.map(p => p.productName))];
    uniqueNames.sort().forEach(name => {
        if (name) {
            const opt = document.createElement("option");
            opt.value = name; opt.textContent = name;
            productNameSelect.appendChild(opt);
        }
    });
    productNameSelect.disabled = false;
}

// Populate product codes
function populateProductCodes(gender, selectedProductName) {
    const { productCodeSelect } = elements;
    productCodeSelect.innerHTML = '<option value="">Select Product Code</option>';
    const products = productDataByGender[gender];
    if (!products || products.length === 0 || !selectedProductName) {
        productCodeSelect.disabled = true; 
        return;
    }
    const filteredProducts = products.filter(p => p.productName === selectedProductName);
    if (filteredProducts.length === 0) {
        productCodeSelect.disabled = true; 
        return; 
    }
    const codes = filteredProducts.map(p => p.productCode);
    const uniqueCodes = [...new Set(codes)].filter(code => code); 
    uniqueCodes.sort();
    uniqueCodes.forEach(code => {
            const opt = document.createElement("option");
            opt.value = code; 
            opt.textContent = code;
            productCodeSelect.appendChild(opt);
    });
    productCodeSelect.disabled = uniqueCodes.length === 0;
}

// Update product type
function updateProductType(gender, selectedProductName, selectedProductCode) {
    const { productTypeInput } = elements;
    productTypeInput.value = '';
    const products = productDataByGender[gender];
    if (!products || !selectedProductName || !selectedProductCode) return;
    const match = products.find(p => p.productName === selectedProductName && p.productCode === selectedProductCode);
    if (match) {
        productTypeInput.value = match.productType;
    }
}

// Size button rendering
function renderSizeButtons(gender, productType) {
  const { sizeGrid } = elements;
  sizeGrid.innerHTML = '';
  selectedSizes.clear(); 
  let sizes = [];
    const type = String(productType || "").trim().toLowerCase();
    const currentGender = String(gender || "").trim().toLowerCase();

    if (type === "jackets" || type === "wovens" || type === "knits" || type === "dresses" || type === "other" || type === "tops") {
        sizes = ["XS", "S", "M", "L", "XL", "XXL"];
    } else if (type === "shorts") {
        sizes = currentGender === "mens"
            ? ['W28', 'W29', 'W30', 'W31', 'W32', 'W33', 'W34', 'W36', 'W38', 'W40', 'W42']
            : ['W24', 'W25', 'W26', 'W27', 'W28', 'W29', 'W30', 'W31', 'W32', 'W33', 'W34'];
    } else if (type === "longbottoms" || type === "long bottoms" || type === "pants") {
        sizes = currentGender === "mens"
            ? ["28x30", "28x32", "29x30", "29x32", "30x30", "30x32", "30x34",
                "31x30", "31x32", "32x29", "32x30", "32x32", "32x34",
                "33x30", "33x32", "34x29", "34x30", "34x32", "34x34",
                "36x29", "36x30", "36x32", "36x34", "38x30", "38x32",
                "40x30", "40x32", "42x30", "42x32"]
            : ["24x28", "24x30", "24x32", "25x28", "25x30", "25x32", "26x28", "26x30", "26x32",
                "27x28", "27x30", "27x32", "28x28", "28x30", "28x32", "29x28", "29x30", "29x32",
                "30x28", "30x30", "30x32", "31x28", "31x30", "31x32", "32x28", "32x30", "32x32",
                "33x28", "33x30", "33x32", "34x28", "34x30", "34x32"];
    } else if (type === "altbottoms") { 
        sizes = ['W24', 'W25', 'W26', 'W27', 'W28', 'W29', 'W30', 'W31', 'W32', 'W33', 'W34'];
    }

  sizes.forEach(size => {
    const button = document.createElement('button');
    button.textContent = size;
    button.className = selectedSizes.has(size) ? 'selected' : '';
    button.type = 'button'; 
    button.addEventListener('click', () => {
      if (selectedSizes.has(size)) {
          selectedSizes.delete(size);
          button.classList.remove('selected');
      } else {
          selectedSizes.add(size);
          button.classList.add('selected');
      }
    });
    sizeGrid.appendChild(button);
  });
}

// Helper function to sort sizes
function sortSizes(sizesArray, productType) {
    const letterSizeOrder = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "XXXXL", "0X", "1X", "2X", "3X", "4X", "5X"];
    const type = String(productType || "").trim().toLowerCase();
    const usesLetterSizes = ["jackets", "wovens", "knits", "dresses", "other", "tops"].includes(type);

    if (usesLetterSizes) {
        return sizesArray.sort((a, b) => {
            const indexA = letterSizeOrder.indexOf(String(a).toUpperCase());
            const indexB = letterSizeOrder.indexOf(String(b).toUpperCase());
            if (indexA === -1 && indexB === -1) return String(a).localeCompare(String(b));
            if (indexA === -1) return 1; 
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    }
    return sizesArray.sort((a, b) => {
        const numA = parseInt(String(a).replace(/[^0-9x]/gi, ''), 10);
        const numB = parseInt(String(b).replace(/[^0-9x]/gi, ''), 10);
        if (!isNaN(numA) && !isNaN(numB) && String(a).includes('x') && String(b).includes('x')) {
            const partsA = String(a).split('x').map(Number);
            const partsB = String(b).split('x').map(Number);
            if (partsA[0] !== partsB[0]) return partsA[0] - partsB[0];
            return partsA[1] - partsB[1];
        } else if (!isNaN(numA) && !isNaN(numB)) {
             return numA - numB;
        }
        return String(a).localeCompare(String(b)); 
    }); 
}

function addEntry() {
    const { storeName, genderSelect, productNameSelect, productCodeSelect, productTypeInput, notes } = elements;
    const store = storeName.value.trim();
    const gender = genderSelect.value;
    const productType = productTypeInput.value.trim();
    const productName = productNameSelect.value.trim();
    const productCode = productCodeSelect.value.trim();
    const notesValue = notes.value.trim();

    if (!store || !gender || !productType || !productName || !productCode) {
      alert('Please fill out all required fields: Store Name, Gender, Product Name, Product Code, and Product Type.');
      return;
    }
    if (selectedSizes.size === 0) {
      alert('Please select at least one size.');
      return;
    }

    let productFinish = "";
    const genderData = productDataByGender[gender];
    if (genderData) {
        const originalProduct = genderData.find(p => p.productName === productName && p.productCode === productCode);
        if (originalProduct) productFinish = originalProduct.productFinish;
    }

    const formattedCode = productCode.length === 9 && !productCode.includes('-') && /^\d+$/.test(productCode)
      ? `${productCode.slice(0, 5)}-${productCode.slice(5)}`
      : productCode;

    const sortedSelectedSizes = sortSizes(Array.from(selectedSizes), productType);

    const entry = {
      store, gender, productType, productName,
      productCode: formattedCode, productFinish,
      sizes: sortedSelectedSizes,
      notes: notesValue, 
      originalIndex: entries.length 
    };

    entries.push(entry);
    renderEntries();
    clearProductEntryForm(); 
}

// Render entries in the list
function renderEntries() {
  const { entryList } = elements;
  entryList.innerHTML = ''; 

  const displayEntries = entries.map((e, i) => ({ ...e, originalIndexForDeletion: i }));
  
  // **MODIFICATION START: Updated sorting order**
  displayEntries.sort((a, b) => {
    if (a.gender < b.gender) return -1; 
    if (a.gender > b.gender) return 1;
    // Secondary sort: ProductName
    if (a.productName < b.productName) return -1; 
    if (a.productName > b.productName) return 1;
    // Tertiary sort: ProductCode (to order items under the same ProductName)
    if (a.productCode < b.productCode) return -1;
    if (a.productCode > b.productCode) return 1;
    return 0;
  });
  // **MODIFICATION END**

  let currentGender = null;
  let currentProductName = null; // **MODIFICATION: For tracking current product name group**

  displayEntries.forEach(entry => {
    // Group by Gender
    if (entry.gender !== currentGender) {
      currentGender = entry.gender;
      const genderHeader = document.createElement('h3');
      genderHeader.className = 'entry-group-header gender-header';
      genderHeader.textContent = currentGender;
      entryList.appendChild(genderHeader);
      currentProductName = null; // Reset product name for new gender group
    }

    // **MODIFICATION START: Group by ProductName**
    if (entry.productName !== currentProductName) {
      currentProductName = entry.productName;
      const productNameHeader = document.createElement('h4');
      // productNameHeader.className = 'entry-group-header product-type-header'; // Old class
      productNameHeader.className = 'entry-group-header product-name-header'; // New class for ProductName
      productNameHeader.textContent = currentProductName;
      entryList.appendChild(productNameHeader);
    }
    // **MODIFICATION END**

    const item = document.createElement('div');
    item.className = 'entry-item clickable-entry'; 

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-entry';
    deleteBtn.setAttribute('data-original-array-index', entry.originalIndexForDeletion); 
    deleteBtn.setAttribute('title', 'Remove Entry');
    deleteBtn.textContent = '−';
    deleteBtn.addEventListener('click', (event) => {
      event.stopPropagation(); 
      const indexInOriginalArray = parseInt(event.target.getAttribute('data-original-array-index'), 10);
      entries.splice(indexInOriginalArray, 1);
      renderEntries(); 
    });
    item.appendChild(deleteBtn);

    const defaultDetails = document.createElement('div');
    defaultDetails.className = 'entry-default-details';
    const titleLine = document.createElement('div');
    titleLine.className = 'entry-title-line';
    // Display ProductType within the entry item now, as it's not a primary group header
    // Also, ProductCode is already in titleLine, so we ensure all necessary info is present.
    titleLine.innerHTML = `
      <div class="product-name-display"><strong>Product Name:</strong> ${entry.productName}</div>
      <div class="product-code-display"><strong>Product Code:</strong> ${entry.productCode}</div>
    `;
    defaultDetails.appendChild(titleLine);

    item.appendChild(defaultDetails);

    const hiddenDetails = document.createElement('div');
    hiddenDetails.className = 'entry-hidden-details';
    hiddenDetails.style.display = 'none'; 
    const finishHTML = entry.productFinish ? `<div><strong>Finish:</strong> ${entry.productFinish}</div>` : '';
    hiddenDetails.innerHTML = `
      ${finishHTML}
      <div><strong>Sizes:</strong> ${entry.sizes.join(', ')}</div>
      ${entry.notes ? `<div><strong>Notes:</strong> ${entry.notes}</div>` : ''}
    `;
    item.appendChild(hiddenDetails);
    
    item.addEventListener('click', () => {
        const isHidden = hiddenDetails.style.display === 'none';
        hiddenDetails.style.display = isHidden ? 'block' : 'none';
        item.classList.toggle('expanded', isHidden); 
    });
    
    entryList.appendChild(item);
  });
}

// Clear product entry form fields
function clearProductEntryForm() {
    const selectedGender = elements.genderSelect.value;
    const currentProductName = elements.productNameSelect.value; 
    
    elements.productCodeSelect.innerHTML = '<option value="">Select Product Code</option>';
    elements.productTypeInput.value = ''; 
    elements.notes.value = '';
    
    if (selectedGender && currentProductName && productDataByGender[selectedGender]) {
        populateProductCodes(selectedGender, currentProductName);
    } else {
        elements.productCodeSelect.disabled = true;
    }
    
    elements.sizeGrid.innerHTML = '';
    selectedSizes.clear();
}

// Reset all product selections
function resetProductSelections() {
    document.querySelectorAll('.gender-icon.selected').forEach(b => b.classList.remove('selected'));
    elements.genderSelect.value = ""; 

    elements.productNameSelect.innerHTML = '<option value="">Select Gender First</option>';
    elements.productNameSelect.disabled = true;
    elements.productCodeSelect.innerHTML = '<option value="">Select Product Name First</option>';
    elements.productCodeSelect.disabled = true;
    elements.productTypeInput.value = '';
    elements.notes.value = '';
    elements.sizeGrid.innerHTML = '';
    selectedSizes.clear();
}

// Export entries to Excel
function exportToExcel() {
  if (entries.length === 0) {
    alert("No entries to export."); return;
  }
  const { storeName } = elements;
  const store = storeName.value.trim() || "Export";
  const date = new Date().toISOString().split("T")[0];
  const filename = `${store.replace(/[^a-z0-9]/gi, '_')}_MissingSizes_${date}.xlsx`;
  const headers = ["Store", "Gender", "Product Name", "Product Code", "Product Finish", "Sizes Missing", "Notes"];
  
  const entriesForExport = JSON.parse(JSON.stringify(entries)); 

  const dataToExport = [headers, ...entriesForExport.map(e => [
    e.store, e.gender, e.productName, e.productCode,
    e.productFinish || "", e.sizes.join(", "), e.notes || "" 
  ])];

  const ws = XLSX.utils.aoa_to_sheet(dataToExport);
  ws['!cols'] = [
    {wch:Math.max(store.length, 15)}, {wch:10}, {wch:30}, {wch:15}, {wch:20}, {wch:70}, {wch:30}
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Missing Sizes");
  XLSX.writeFile(wb, filename);
}

// Toggle information box visibility
function toggleInfoBox() {
  const { infoBox, toggleInfoBtn } = elements;
  const isHidden = infoBox.style.display === "none";
  infoBox.style.display = isHidden ? "block" : "none";
  toggleInfoBtn.textContent = isHidden ? "Minimize Info" : "+ App Instructions";
}

// Load and Initialize
document.addEventListener("DOMContentLoaded", () => {
  getDOMElements(); 
  
  loadProductData().then(() => {
      initEventListeners();
      document.querySelectorAll('.gender-icon').forEach(button => button.disabled = false);
      resetProductSelections(); 
  }).catch(error => {
      console.error("Initialization failed due to product data load error:", error);
      document.querySelectorAll('.gender-icon').forEach(button => button.disabled = true);
  });
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
