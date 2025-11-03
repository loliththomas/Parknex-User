// Global variables
let slotId = null;
let userLocation = null;
let slotData = null;

// Configuration - UPDATE THESE VALUES
const API_BASE_URL = "https://parknex-admin.runasp.net/api"; // Your .NET API URL
const RADIUS_THRESHOLD_METERS = 150;
const WHATSAPP_BOT_NUMBER = "+14155238886"; // Replace with your WhatsApp bot number

// Get slot ID from URL parameter
function getSlotIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const slotIdParam = urlParams.get("slotId");
  return slotIdParam ? parseInt(slotIdParam) : null;
}

// Initialize the app - AUTOMATIC START
async function init() {
  slotId = getSlotIdFromURL();

  if (!slotId) {
    showError(
      "Invalid QR Code",
      "No slot ID found in the link. Please scan a valid QR code.",
      "Make sure you scanned the QR code from a parking slot."
    );
    return;
  }

  // Show loading screen
  showScreen("loadingScreen");

  // Small delay to show the loading screen, then AUTOMATICALLY request location
  setTimeout(() => {
    requestLocationPermission();
  }, 1000);
}

// Request location permission - AUTOMATIC (no button click needed)
function requestLocationPermission() {
  if (!navigator.geolocation) {
    showError(
      "Location Not Supported",
      "Your browser doesn't support location services.",
      "Please use a modern browser that supports geolocation."
    );
    return;
  }

  // IMMEDIATELY ask browser for location
  navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  });
}

// Location success callback - AUTOMATIC verification
async function onLocationSuccess(position) {
  userLocation = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };

  console.log("User location:", userLocation);

  // AUTOMATICALLY verify slot and location
  await verifySlotAndLocation();
}

// Location error callback
function onLocationError(error) {
  let errorMessage = "Unable to get your location.";
  let errorDetails = "";

  switch (error.code) {
    case error.PERMISSION_DENIED:
      errorMessage = "Location permission denied.";
      errorDetails =
        "Please allow location access to book a parking slot. You can enable it in your browser settings and try again.";
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage = "Location information unavailable.";
      errorDetails =
        "Your device cannot determine your location. Please check your GPS settings and try again.";
      break;
    case error.TIMEOUT:
      errorMessage = "Location request timed out.";
      errorDetails =
        "The request to get your location took too long. Please try again.";
      break;
  }

  showError("Location Error", errorMessage, errorDetails);
}

// Verify slot and location - REAL API CALL
async function verifySlotAndLocation() {
  try {
    console.log("Calling API:", `${API_BASE_URL}/Slot/verify`);
    console.log("Request body:", {
      slotId: slotId,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    });

    const response = await fetch(`${API_BASE_URL}/Slot/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slotId: slotId,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      }),
    });

    const data = await response.json();
    console.log("API Response:", data);

    // Check if request was successful
    if (data.status !== 200) {
      // API returned error
      showError(
        "Verification Failed",
        data.message || "Unable to verify slot",
        ""
      );
      return;
    }

    // Success - redirect to WhatsApp
    redirectToWhatsApp(data.data);
  } catch (error) {
    console.error("Verification error:", error);
    showError(
      "Connection Error",
      "Unable to connect to the server.",
      "Please check your internet connection and try again. Error: " +
        error.message
    );
  }
}

// Redirect to WhatsApp - AUTOMATIC (no button click)
function redirectToWhatsApp(data) {
  slotData = data;

  // Update display briefly before redirecting
  document.getElementById("slotIdDisplay").textContent = data.slotId;
  document.getElementById("slotNameDisplay").textContent = data.slotName;
  document.getElementById("tokenDisplay").textContent = data.token;
  document.getElementById("buildingDisplay").textContent =
    "Thejaswini Building";

  // Show redirecting screen briefly
  hideAllScreens();
  showScreen("redirectingScreen");

  // Create WhatsApp link with prefilled message
  // Message format: "Book {slotId} {slotName} {token}"
  const message = encodeURIComponent(
    `Book ${data.slotName} \nOTP: ${data.token}`
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_BOT_NUMBER}?text=${message}`;

  console.log("WhatsApp URL:", whatsappUrl);
  console.log("Message:", `Book ${data.slotId} ${data.slotName} ${data.token}`);

  // AUTOMATIC redirect after 2 seconds (show slot info briefly)
  setTimeout(() => {
    window.location.href = whatsappUrl;
  }, 2000);
}

// Show error screen
function showError(title, message, details) {
  document.getElementById("errorTitle").textContent = title;
  document.getElementById("errorMessage").textContent = message;

  if (details) {
    document.getElementById("errorDetailsText").textContent = details;
    document.getElementById("errorDetails").classList.remove("hidden");
  } else {
    document.getElementById("errorDetails").classList.add("hidden");
  }

  hideAllScreens();
  showScreen("errorScreen");
}

// Screen management helpers
function hideAllScreens() {
  const screens = ["loadingScreen", "redirectingScreen", "errorScreen"];
  screens.forEach((screenId) => {
    document.getElementById(screenId).classList.add("hidden");
  });
}

function showScreen(screenId) {
  document.getElementById(screenId).classList.remove("hidden");
}

// Start the app when page loads - AUTOMATIC
window.addEventListener("DOMContentLoaded", init);
