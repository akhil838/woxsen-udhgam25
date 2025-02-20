// Single GIF URL to be used throughout the bobbing phase
const focus_GIF_URL = "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2FqZG0ydW83cDdqbzVzMWQybzl6dmpuN2VlamUxanVjdXljZW9rYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/5QGLZmD9mPGy7F1IA0/giphy.gif";
// GIF URL for the focus during its initial flight and for flying away
const FLYING_focus_GIF_URL = "https://tenor.com/bOtYR.gif";

let currentfocus = null;          // Track the current focus element on screen
let thoughtBubble = null;       // Track the thought bubble element

// Append CSS for bobbing animation if not already present
(function addBobbingAnimationCSS() {
  if (document.getElementById('bobbingAnimationStyle')) return;
  const styleElem = document.createElement('style');
  styleElem.id = 'bobbingAnimationStyle';
  styleElem.innerHTML = `
    @keyframes bob {
      0% { transform: translateY(0); }
      50% { transform: translateY(10px); }
      100% { transform: translateY(0); }
    }
  `;
  document.head.appendChild(styleElem);
})();

// Function to create and display a thought bubble next to the focus
function addThoughtBubble() {
  console.log("addThoughtBubble called");
  if (!currentfocus) return;
  
  // Create thought bubble element with a unique id
  thoughtBubble = document.createElement("img");
  thoughtBubble.id = "thoughtBubble";
  thoughtBubble.src = "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjQ2ZHR0emV3bWkyNmV6NmVraWk5amhkb2k5bGVneWx6dzc3MnZvaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/D3lDc9D3uBxXLShs8K/giphy.gif";
  thoughtBubble.style.position = "fixed";
  thoughtBubble.style.width = "100px"; // Adjust size as needed
  thoughtBubble.style.zIndex = "10000"; // Ensure bubble is on top

  // Position the bubble next to the focus
  const focusRect = currentfocus.getBoundingClientRect();
  thoughtBubble.style.top = `${focusRect.top - 20}px`;
  thoughtBubble.style.left = `${focusRect.right - 200}px`;

  document.body.appendChild(thoughtBubble);
}

// Function to remove the thought bubble
function removeThoughtBubble() {
  console.log("removeThoughtBubble called");
  if (thoughtBubble) {
    thoughtBubble.remove();
    thoughtBubble = null;
  } else {
    const bubble = document.getElementById("thoughtBubble");
    if (bubble) {
      bubble.remove();
    }
  }
}

// Function to make the focus fly in from the top-right corner
function animatefocusIntoScreen() {
  // Remove any existing focus and thought bubble before creating a new one
  if (currentfocus) {
    currentfocus.remove();
    currentfocus = null;
  }
  removeThoughtBubble();

  currentfocus = document.createElement("img");
  currentfocus.src = FLYING_focus_GIF_URL;
  currentfocus.style.position = "fixed";
  currentfocus.style.top = "0px";
  currentfocus.style.right = "-200px"; 
  currentfocus.style.width = "150px";
  currentfocus.style.zIndex = "9999";
  currentfocus.style.transition = "top 1.5s ease-out, right 1.5s ease-out";

  document.body.appendChild(currentfocus);

  setTimeout(() => {
    currentfocus.style.top = "40px";
    currentfocus.style.right = "20px";

    currentfocus.addEventListener('transitionend', () => {
      setTimeout(() => {
        currentfocus.src = focus_GIF_URL;
        currentfocus.style.transition = "";
        currentfocus.style.animation = "bob 2s infinite ease-in-out";
        addThoughtBubble();  // Add thought bubble once focus settles
      }, 2000);
    }, { once: true });
  }, 1200);
}

// Function to animate the focus flying away to the right and disappearing with a flying GIF
function animatefocusAway() {
  if (!currentfocus) return;
  removeThoughtBubble(); // Remove thought bubble when flying away

  currentfocus.src = FLYING_focus_GIF_URL;
  currentfocus.style.animation = "";
  currentfocus.style.transition = "right 1.5s ease-in, opacity 1.5s ease-in";
  currentfocus.style.right = "-300px";
  currentfocus.style.opacity = "0";

  currentfocus.addEventListener('transitionend', () => {
    if (currentfocus && currentfocus.parentElement) {
      currentfocus.parentElement.removeChild(currentfocus);
      currentfocus = null;
    }
  }, { once: true });
}

// Listen for messages from popup.js or background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "flyfocus") {
    animatefocusIntoScreen();
    sendResponse({ status: "focus animation triggered on webpage" });
  } else if (message.action === "flyfocusAway") {
    animatefocusAway();
    sendResponse({ status: "focus fly-away animation triggered on webpage" });
  } else if (message.action === "removeThoughtBubble") {
    removeThoughtBubble();
    sendResponse({ status: "Thought bubble removed" });
  }
});
