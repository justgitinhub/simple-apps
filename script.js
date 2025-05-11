const entries = [];
const selectedSizes = new Set();

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
  };

  entries.push(entry);
  renderEntries();
  form.reset();
  selectedSizes.clear();
  renderSizeButtons();  // update after clearing
});



function renderEntries() {
  const container = document.getElementById("entryList");
  container.innerHTML = "";

  const genders = ["Mens", "Womens"];

  genders.forEach(gender => {
    const genderEntries = entries
      .map((e, i) => ({ ...e, index: i }))
      .filter(e => e.gender === gender);

    if (genderEntries.length === 0) return;

    const genderHeader = document.createElement("h3");
    genderHeader.textContent = gender;
    container.appendChild(genderHeader);

    // 1. Group entries by product type within the current gender
    const entriesByProductType = genderEntries.reduce((acc, entry) => {
      if (!acc[entry.productType]) {
        acc[entry.productType] = [];
      }
      acc[entry.productType].push(entry);
      return acc;
    }, {});

    // 2. Iterate through the product types and render entries for each
    const productTypes = Object.keys(entriesByProductType).sort(); // Get unique product types and sort them

    productTypes.forEach(productType => {
      const productTypeHeader = document.createElement("s2"); // Or any suitable heading tag
      productTypeHeader.textContent = productType;
      container.appendChild(productTypeHeader);

      const productTypeEntries = entriesByProductType[productType];
      productTypeEntries.forEach(entry => {
        const item = document.createElement("div");
        item.className = "entry-item";

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-entry";
        deleteBtn.setAttribute("data-index", entry.index);
        deleteBtn.setAttribute("title", "Remove Entry");
        deleteBtn.textContent = "−";
        item.appendChild(deleteBtn);

        const details = document.createElement("div");
        details.className = "entry-details";
        details.innerHTML = `
          <div><strong>Product Name:</strong> ${entry.productName}</div>
          <div><strong>Product Code:</strong> ${entry.productCode}</div>
          <div><strong>Sizes:</strong> ${entry.sizes.join(", ")}</div>
          <div><strong>Notes:</strong> ${entry.notes}</div>
        `;

        item.appendChild(details);
        container.appendChild(item);
      });
    });
  });

  document.querySelectorAll(".delete-entry").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.getAttribute("data-index"), 10);
      entries.splice(index, 1);
      renderEntries();
    });
  });
}

document.getElementById("addEntryBtn").addEventListener("click", () => {
  // ...
  console.log("renderSizeButtons:", renderSizeButtons);
  selectedSizes.clear();
  renderSizeButtons();
  // ...
});

function renderSizeButtons() {
  const grid = document.getElementById("sizeGrid");
  grid.innerHTML = "";

  const gender = document.getElementById("gender").value;
  const productType = document.getElementById("productType").value;

  let sizes = [];
  if (productType === "Jackets") {
    sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  } else if (productType === "Wovens") {
    sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  } else if (productType === "Knits") {
    sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  } else if (productType === "Dresses") {
    sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  } else if (productType === "Other") {
    sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  } else if (productType === "Shorts") {
    sizes = gender === "Mens"
      ? ['W28', 'W29', 'W30', 'W31', 'W32', 'W33', 'W34', 'W36', 'W38', 'W40', 'W42']
      : ['W24', 'W25', 'W26', 'W27', 'W28', 'W29', 'W30', 'W31', 'W32', 'W33', 'W34'];
  } else if (productType === "LongBottoms") {
    sizes = gender === "Mens"
      ? ["28x30", "28x32", "29x30", "29x32", "30x30", "30x32", "30x34",
      "31x30", "31x32", "32x29", "32x30", "32x32", "32x34",
      "33x30", "33x32", "34x29", "34x30", "34x32", "34x34",
      "36x29", "36x30", "36x32", "36x34", "38x30", "38x32",
      "40x30", "40x32", "42x30", "42x32"]
      : ["24x28", "24x30", "24x32", "25x28", "25x30", "25x32", "26x28", "26x30", "26x32",
      "27x28", "27x30", "27x32", "28x28", "28x30", "28x32", "29x28", "29x30", "29x32",
      "30x28", "30x30", "30x32", "31x28", "31x30", "31x32", "32x28", "32x30", "32x32",
      "33x28", "33x30", "33x32", "34x28", "34x30", "34x32"];
  }

  sizes.forEach(size => {
    const btn = document.createElement("button");
    btn.textContent = size;
    btn.className = selectedSizes.has(size) ? "selected" : "";
    btn.addEventListener("click", () => {
      if (selectedSizes.has(size)) {
        selectedSizes.delete(size);
      } else {
        selectedSizes.add(size);
      }
      renderSizeButtons();
    });
    grid.appendChild(btn);
  });
}

document.getElementById("gender").addEventListener("change", () => {
  selectedSizes.clear();
  renderSizeButtons();
});
document.getElementById("productType").addEventListener("change", () => {
  selectedSizes.clear();
  renderSizeButtons();
});



document.getElementById("exportBtn").addEventListener("click", () => {
  if (entries.length === 0) return;

  const store = document.getElementById("storeName").value || "Export";
  const date = new Date().toISOString().split("T")[0];
  const filename = `${store}_${date}.xlsx`;

  const headers = ["Store", "Gender", "Product Type", "Product Name", "Product Code", "Sizes Missing", "Notes"];
  const data = [headers, ...entries.map(e => [
    e.store, e.gender, e.productType, e.productName, e.productCode,
    e.sizes.join(", "), e.notes
  ])];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Missing Sizes");

  XLSX.writeFile(wb, filename);
});




document.querySelectorAll(".gender-icon").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".gender-icon").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    const selectedGender = btn.getAttribute("data-gender");
    document.getElementById("gender").value = selectedGender;  // Optional: sync hidden input
    renderSizeButtons(); // Adjust size buttons based on selected gender
  });
});


  const toggleButton = document.getElementById('toggleInfo');
  const infoBox = document.getElementById('infoBox');

  toggleButton.addEventListener('click', () => {
    if (infoBox.style.display === 'none') {
      infoBox.style.display = 'block';
      toggleButton.textContent = 'Minimize Info';
    } else {
      infoBox.style.display = 'none';
      toggleButton.textContent = 'Show More Information About Application';
    }
  });


  document.addEventListener('DOMContentLoaded', () => {
  const clearProductInfoBtn = document.getElementById("clearProductInfoBtn");

  clearProductInfoBtn.addEventListener("click", () => {
    document.getElementById("productName").value = "";
    document.getElementById("productCode").value = "";
    document.getElementById("notes").value = "";
  });
});