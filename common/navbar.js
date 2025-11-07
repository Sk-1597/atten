const openMenuBtn = document.getElementById("openMenuBtn");
const closeMenuBtn = document.getElementById("closeMenuBtn");
const closeMenu = document.getElementById("closeMenu");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");

if (openMenuBtn && closeMenuBtn && sideMenu && overlay) {
  openMenuBtn.addEventListener("click", () => {
    sideMenu.classList.add("open");
    overlay.classList.add("show");
  });

  closeMenuBtn.addEventListener("click", () => {
    sideMenu.classList.remove("open");
    overlay.classList.remove("show");
  });

   closeMenu.addEventListener("click", () => {
    sideMenu.classList.remove("open");
    overlay.classList.remove("show");
  });

  overlay.addEventListener("click", () => {
    sideMenu.classList.remove("open");
    overlay.classList.remove("show");
  });
} 