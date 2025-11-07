// auth.js
export const loader = document.getElementById("loader");

// Get the currently logged-in user from localStorage
export const currentUser = JSON.parse(localStorage.getItem("loggedUser"));

// Redirect to login page if no user is found
if (!currentUser) {
  window.location.href = "./";
}
