//leave popup inpu hide---------------------
const levType = document.getElementById("levType");
  const levTimeBox = document.getElementById("levTimeBox");

  levType.addEventListener("change", () => {
    const value = levType.value;

    // Reset visibility
    levTimeBox.style.display = "none";
   

    if (value === "Half") {
      levTimeBox.style.display = "flex";
    } else if (value === "LongLeave") {
     
    }
  });

  // Cancel button to close popup (if needed)
  document.getElementById("CancelAplitn").addEventListener("click", () => {
    document.getElementById("leavePopup").style.display = "none";
  });


  //leave popup calling------
  const applyBtn = document.getElementById("alyLeav");
const cancelBtn = document.getElementById("cslLeav");
const leavePopup = document.getElementById("leavePopup");

applyBtn.addEventListener("click", () => {
  leavePopup.style.display = "flex";
});

cancelBtn.addEventListener("click", () => {
  leavePopup.style.display = "none";
});

document.getElementById("CancelAplitn").addEventListener("click", () => {
  leavePopup.style.display = "none";
});