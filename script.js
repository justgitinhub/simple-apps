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
    // elements.clearProductInfoBtn = document.getElementById("clearProductInfoBtn"); // Removed
    elements.entryList = document.getElementById("entryList");
    elements.exportBtn = document.getElementById("exportBtn");
    elements.toggleInfoBtn = document.getElementById("toggleInfo");
    elements.infoBox = document.getElementById("infoBox");
    elements.productForm = document.getElementById("productForm");
    elements.notes = document.getElementById("notes");
}

// Load Excel product list
async function loadProductData() {
    const loadingMessageP = document.querySelector('.app-container > p:nth-of-type(2)');
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
            if (loadingMessageP) loadingMessageP.innerHTML = `<strong style="color: red;">${errorMsg}</strong>`;
            alert(errorMsg);
            throw new Error(errorMsg);
        }
        if (loadingMessageP) {
            loadingMessageP.textContent = `Product data loaded (${loadedCount} items).`;
        }

    } catch (error) {
        console.error("Error loading/processing product data:", error);
        if (loadingMessageP) loadingMessageP.innerHTML = `<strong style="color: red;">Failed to load. Details: ${error.message}</strong>`;
        alert(`Failed to load/process product data. Details: ${error.message}`);
        throw error;
    }
}

// Initialize event listeners
function initEventListeners() {
    // Destructure elements, excluding clearProductInfoBtn
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
    // clearProductInfoBtn.addEventListener("click", clearProductEntryForm); // Removed event listener
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

    if (uniqueCodes.length > 0) {
        productCodeSelect.disabled = false;
    } else {
        productCodeSelect.disabled = true;
    }
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
      selectedSizes.has(size) ? selectedSizes.delete(size) : selectedSizes.add(size);
      button.classList.toggle('selected');
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
    return sizesArray.sort(); 
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
      notes: notesValue, originalIndex: entries.length
    };

    entries.push(entry);
    renderEntries();
    clearProductEntryForm(); // This function still exists and is called here
}

// Render entries in the list
function renderEntries() {
  const { entryList } = elements;
  entryList.innerHTML = '';
  const displayEntries = entries.map((e, i) => ({ ...e, originalIndex: i }));
  displayEntries.sort((a, b) => {
    if (a.gender < b.gender) return -1; if (a.gender > b.gender) return 1;
    if (a.productType < b.productType) return -1; if (a.productType > b.productType) return 1;
    if (a.productName < b.productName) return -1; if (a.productName > b.productName) return 1;
    return 0;
  });
  let currentGender = null, currentProductType = null;
  displayEntries.forEach(entry => {
    if (entry.gender !== currentGender) {
      currentGender = entry.gender;
      const genderHeader = document.createElement('h3');
      genderHeader.textContent = currentGender;
      genderHeader.style.marginTop = "1rem";
      entryList.appendChild(genderHeader);
      currentProductType = null;
    }
    if (entry.productType !== currentProductType) {
      currentProductType = entry.productType;
      const productTypeHeader = document.createElement('h4');
      productTypeHeader.textContent = currentProductType;
      productTypeHeader.style.marginLeft = "10px";
      productTypeHeader.style.color = "#333";
      entryList.appendChild(productTypeHeader);
    }
    const item = document.createElement('div');
    item.className = 'entry-item';
    item.style.marginLeft = "20px";
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-entry';
    deleteBtn.setAttribute('data-original-index', entry.originalIndex);
    deleteBtn.setAttribute('title', 'Remove Entry');
    deleteBtn.textContent = '−';
    item.appendChild(deleteBtn);

    const details = document.createElement('div');
    details.className = 'entry-details';
    const finishHTML = entry.productFinish ? `<div><strong>Finish:</strong> ${entry.productFinish}</div>` : '';
    details.innerHTML = `
      <div><strong>Product Name:</strong> ${entry.productName}</div>
      <div><strong>Product Code:</strong> ${entry.productCode}</div>
      ${finishHTML}
      <div><strong>Sizes:</strong> ${entry.sizes.join(', ')}</div>
      ${entry.notes ? `<div><strong>Notes:</strong> ${entry.notes}</div>` : ''}
    `;
    item.appendChild(details);
    entryList.appendChild(item);
  });
  document.querySelectorAll('.delete-entry').forEach(button => {
    button.addEventListener('click', (event) => {
      const indexToDelete = parseInt(event.target.getAttribute('data-original-index'), 10);
      entries.splice(indexToDelete, 1);
      entries.forEach((e, i) => e.originalIndex = i);
      renderEntries();
    });
  });
}

// Clear product entry form fields (Product Name persists)
function clearProductEntryForm() {
    const selectedGender = elements.genderSelect.value;
    const currentProductName = elements.productNameSelect.value;
    elements.productCodeSelect.innerHTML = '<option value="">Select Product Code</option>';
    elements.productTypeInput.value = ''; // Product Type is auto-filled and hidden, but still reset
    if (selectedGender && currentProductName && productDataByGender[selectedGender]) {
        populateProductCodes(selectedGender, currentProductName);
    } else {
        elements.productCodeSelect.disabled = true;
    }
    elements.notes.value = '';
    elements.sizeGrid.innerHTML = '';
    selectedSizes.clear();
}

// Reset all product selections
function resetProductSelections() {
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
  const headers = ["Store", "Gender", "Product Type", "Product Name", "Product Code", "Product Finish", "Sizes Missing", "Notes"];
  const entriesForExport = JSON.parse(JSON.stringify(entries));
  const dataToExport = [headers, ...entriesForExport.map(e => [
    e.store, e.gender, e.productType, e.productName, e.productCode,
    e.productFinish || "", e.sizes.join(", "), e.notes
  ])];
  const ws = XLSX.utils.aoa_to_sheet(dataToExport);
  ws['!cols'] = [
    {wch:Math.max(store.length, 15)}, {wch:10}, {wch:20}, {wch:30}, {wch:15}, {wch:20}, {wch:30}, {wch:30}
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
  toggleInfoBtn.textContent = isHidden ? "Minimize Info" : "Show Information About Application";
}

// Load and Initialize
document.addEventListener("DOMContentLoaded", () => {
  getDOMElements();
  loadProductData().then(() => {
      initEventListeners();
      document.querySelectorAll('.gender-icon').forEach(button => button.disabled = false);
  }).catch(error => {
      console.error("Initialization failed due to product data load error:", error);
  });
});
