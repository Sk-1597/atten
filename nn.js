window.onload = function() {
  const signOutBtn = document.getElementById("signOutBtn");
  if (signOutBtn) {
    signOutBtn.onclick = () => {
      localStorage.removeItem("loggedUser");
      window.location.href = "index.html"; // ✅ redirect to login page
    };
  }
};