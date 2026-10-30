/*
  Jail Management System (JMS) - Chart Helper
  Provides high-resolution Canvas / Chart.js integration with fallback
*/
document.addEventListener("DOMContentLoaded", () => {
  // Real-time Philippine Standard Time Clock
  const clockElement = document.getElementById("jms-live-clock");
  if (clockElement) {
    const updateClock = () => {
      const now = new Date();
      const options = {
        timeZone: "Asia/Manila",
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      };
      clockElement.innerText = new Intl.DateTimeFormat("en-US", options).format(now) + " PST";
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  // Toast Auto-Dismiss
  const alerts = document.querySelectorAll(".jms-toast-alert");
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out";
      alert.style.opacity = "0";
      alert.style.transform = "translateY(-10px)";
      setTimeout(() => alert.remove(), 500);
    }, 6000);
  });
});

// Modal Dialog Helpers
window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
};

