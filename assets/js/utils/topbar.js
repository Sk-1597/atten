import { loader, currentUser } from './loggeduser.js';

// 🔹 Load common navbar dynamically
fetch("./common/navbar.html")
  .then(response => response.text())
  .then(async (data) => {
    document.getElementById("navbar-container").innerHTML = data;

    // ✅ Load navbar.js
    const script = document.createElement("script");
    script.src = "./common/navbar.js";
    document.body.appendChild(script);

    // ✅ Wait for navbar elements to be available
    await new Promise(res => setTimeout(res, 100));

    // ✅ Load and display user info
    import("./loggeduser.js").then(({ currentUser }) => {

      const Username = document.getElementById("sideMenuName");
      const useremail = document.getElementById("sideMenuemail");

      if (Username && useremail && currentUser) {
        Username.textContent = currentUser.user || "-";
        useremail.textContent = currentUser.username || "-";
      }

      // ✅ Role check: Only show Settings for admin
      const settingsMenu = document.querySelector('a[href="../settings.html"]')?.closest('li');
      if (settingsMenu) {
        if (currentUser.role !== "admin") {
          settingsMenu.style.display = "none"; // Hide if not admin
        }
      }

      // ✅ Add SIGN OUT functionality
      const signOutBtn = document.getElementById("signOutBtn");
      if (signOutBtn) {
        signOutBtn.addEventListener("click", () => {
          localStorage.removeItem("loggedUser");
          window.location.href = "./";
        });
      } else {
        console.warn("⚠️ signOutBtn not found in navbar.");
      }
    });
  })
  .catch(error => console.error("Navbar load failed:", error));
