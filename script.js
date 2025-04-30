const sizeOptions = {
    'Long Bottoms': ["28x30", "28x32", "29x30", "29x32", "30x30", "30x32", "30x34",
      "31x30", "31x32", "32x29", "32x30", "32x32", "32x34",
      "33x30", "33x32", "34x29", "34x30", "34x32", "34x34",
      "36x29", "36x30", "36x32", "36x34", "38x30", "38x32",
      "40x30", "40x32", "42x30", "42x32"],
    'Shorts': ['W28', 'W29', 'W30', 'W31', 'W32', 'W33', 'W34', 'W36', 'W38', 'W40', 'W42'],
    'Jackets': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    'Wovens': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    'Knits': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    'Tees': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    'Dresses': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    'Other': ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  };
  
  let selectedSizes = new Set();
  let entries = [];
  
  document.getElementById("productType").addEventListener("change", updateSizeGrid);
  
  function updateSizeGrid() {
    const grid = document.getElementById("sizeGrid");
    grid.innerHTML = "";
    selectedSizes.clear();
  
    const type = document.getElementById("productType").value;
    if (!type) return;
  
    const sizes = sizeOptions[type];
    sizes.forEach(size => {
      const btn = document.createElement("button");
      btn.textContent = size;
      btn.className = "size-btn";
      btn.setAttribute("type", "button");
      btn.addEventListener("click", () => {
        if (selectedSizes.has(size)) {
          selectedSizes.delete(size);
          btn.classList.remove("selected");
        } else {
          selectedSizes.add(size);
          btn.classList.add("selected");
        }
      });
      grid.appendChild(btn);
    });
  }
  
  document.getElementById("addEntryBtn").addEventListener("click", () => {
    const store = document.getElementById("storeName").value.trim();
    const gender = document.getElementById("gender").value;
    const productType = document.getElementById("productType").value;
    const productName = document.getElementById("productName").value.trim();
    const productCode = document.getElementById("productCode").value.trim();
    const notes = document.getElementById("notes").value.trim();
  
    if (!store || !gender || !productType || !productName || !productCode) {
      alert("Please fill out all required fields.");
      return;
    }
  
    const formattedCode = productCode.length === 9 && !productCode.includes("-")
      ? `${productCode.slice(0, 5)}-${productCode.slice(5)}`
      : productCode;
  
    const entry = {
      store,
      gender,
      productType,
      productName,
      productCode: formattedCode,
      sizes: Array.from(selectedSizes),
      notes,
      timestamp: new Date().toLocaleString()
    };
  
    entries.push(entry);
    renderEntries();
    clearForm();
  });
  
  function renderEntries() {
    const container = document.getElementById("entryList");
    container.innerHTML = "";
  
    const genders = ["Men's", "Women's"];
    genders.forEach(gender => {
      const genderEntries = entries.filter(e => e.gender === gender);
      if (genderEntries.length === 0) return;
  
      const header = document.createElement("h3");
      header.textContent = gender;
      container.appendChild(header);
  
      genderEntries.forEach(e => {
        const item = document.createElement("div");
        item.className = "entry-item";
        item.innerHTML = `
          <span>${e.productName}</span>
          <span>${e.productType}</span>
          <span>${e.productCode}</span>
          <span>${e.sizes.join(", ")}</span>
          <span>${e.notes}</span>
        `;
        container.appendChild(item);
      });
    });
  }
  
  document.getElementById("exportBtn").addEventListener("click", () => {
    if (entries.length === 0) return;
  
    const store = document.getElementById("storeName").value || "Export";
    const date = new Date().toISOString().split("T")[0];
    const filename = `${store}_${date}.xlsx`;
  
    const headers = ["Store", "Gender", "Product Type", "Product Name", "Product Code", "Sizes Missing", "Notes", "Timestamp"];
    const data = [headers, ...entries.map(e => [
      e.store, e.gender, e.productType, e.productName, e.productCode,
      e.sizes.join(", "), e.notes, e.timestamp
    ])];
  
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Missing Sizes");
  
    XLSX.writeFile(wb, filename);
  
    const toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  });
  