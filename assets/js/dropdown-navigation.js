// Dropdown Navigation JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Handle dropdown functionality
  const dropdowns = document.querySelectorAll(".nav-dropdown");

  dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector(".nav-dropdown-btn");
    const menu = dropdown.querySelector(".dropdown-menu");

    // Toggle dropdown on button click
    button.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      // Close all other dropdowns
      dropdowns.forEach((otherDropdown) => {
        if (otherDropdown !== dropdown) {
          otherDropdown.classList.remove("active");
          otherDropdown
            .querySelector(".nav-dropdown-btn")
            .setAttribute("aria-expanded", "false");
        }
      });

      // Toggle current dropdown
      const isActive = dropdown.classList.contains("active");
      dropdown.classList.toggle("active");
      button.setAttribute("aria-expanded", !isActive);
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
        button.setAttribute("aria-expanded", "false");
      }
    });

    // Handle keyboard navigation
    button.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        button.click();
      } else if (e.key === "Escape") {
        dropdown.classList.remove("active");
        button.setAttribute("aria-expanded", "false");
        button.focus();
      }
    });

    // Handle keyboard navigation within dropdown
    const links = menu.querySelectorAll(".dropdown-link");
    links.forEach((link, index) => {
      link.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const nextLink = links[index + 1] || links[0];
          nextLink.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const prevLink = links[index - 1] || links[links.length - 1];
          prevLink.focus();
        } else if (e.key === "Escape") {
          dropdown.classList.remove("active");
          button.setAttribute("aria-expanded", "false");
          button.focus();
        }
      });
    });
  });

  // Close dropdowns when window is resized (for mobile responsiveness)
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      dropdowns.forEach((dropdown) => {
        dropdown.classList.remove("active");
        dropdown
          .querySelector(".nav-dropdown-btn")
          .setAttribute("aria-expanded", "false");
      });
    }, 250);
  });

  // Handle touch events for mobile
  if ("ontouchstart" in window) {
    dropdowns.forEach((dropdown) => {
      const button = dropdown.querySelector(".nav-dropdown-btn");

      button.addEventListener("touchstart", function (e) {
        e.preventDefault();
        button.click();
      });
    });
  }
});
