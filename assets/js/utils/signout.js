// ---------------- SIGN OUT ----------------
document.getElementById("signOutBtn").addEventListener("click", () => {
  localStorage.removeItem("loggedUser");
  window.location.href = "./";
});