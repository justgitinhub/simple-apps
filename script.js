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
