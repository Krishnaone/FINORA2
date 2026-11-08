
// =========================================
// FINORA - HOMEPAGE JAVASCRIPT
// Version 1.1
// =========================================

document.addEventListener("DOMContentLoaded", function () {

    // Mobile navigation
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");
    const navigationLinks = document.querySelectorAll(".nav-link");

    // Check whether navigation exists on this page
    if (menuToggle && navLinks) {

        // Toggle mobile navigation
        menuToggle.addEventListener("click", function () {

            const isOpen = navLinks.classList.toggle("open");

            menuToggle.setAttribute("aria-expanded", isOpen);
            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation menu" : "Open navigation menu"
            );

        });

        // Close menu after clicking a navigation link
        navigationLinks.forEach(function (link) {

            link.addEventListener("click", function () {

                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");

            });

        });

        // Close menu when clicking outside
        document.addEventListener("click", function (event) {

            if (
                !navLinks.contains(event.target) &&
                !menuToggle.contains(event.target)
            ) {

                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");

            }

        });

    }

    // Automatic copyright year
    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

});
