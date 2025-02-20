document.addEventListener("DOMContentLoaded", () => {
  const goalContainer = document.getElementById("currTask");
  let finalfocusPosition = null; // To store the final position and size of the flying focus

  // Fetch the current tracking state
  chrome.runtime.sendMessage({ type: "getTrackingState" }, (response) => {
    if (response.isTracking) {
      displayActiveGoal(response.goal);
    } else {
      displayGoalInput();
    }
  });

  // Display the goal input field
  function displayGoalInput() {
    goalContainer.innerHTML = `
      <h1 class="focus-title">Focus MAX</h1> <p class="focus-paragraph">Leave all the distractions behind:</p> <img src="./images/duck.gif" class="focus-gif" id="focusGif" /> <input  type="text"  id="goalInput" class="focus-input" placeholder="e.g., Complete Algebra ..." /> <button id="startBtn" class="focus-button">Start Tracking</button> <p id="statusMessage" class="focus-status"> </p> `;

    document.getElementById("startBtn").addEventListener("click", () => {
      const goalInput = document.getElementById("goalInput").value.trim();
      if (goalInput === "") {
        updateStatusMessage("Please enter a valid Task!", "red");
        return;
      }

      // Attempt to start tracking
      chrome.runtime.sendMessage({ type: "startTracking", goal: goalInput }, (response) => {
        if (response.success) {
          const originalfocus = document.getElementById("focusGif");
          const rect = originalfocus.getBoundingClientRect();

          // Switch to active goal screen first
          displayActiveGoal(response.goal);

          // Then animate the flying focus
          animateFlyingfocus(rect);

          // Send a message to content.js to animate the focus on the active webpage
          sendfocusToWebpage();
        } else {
          updateStatusMessage("Uh-oh! We couldn’t start tracking.", "red");
        }
      });
    });
  }	

  // Animate an focus to fly straight up out of the screen
  function animateFlyingfocus(rect) {
    const flyingfocus = document.createElement("img");
    flyingfocus.src = "./images/duck.gif";
    flyingfocus.className = "focus-fly";

    flyingfocus.style.width = rect.width + "px";
    flyingfocus.style.height = rect.height + "px";
    flyingfocus.style.left = rect.left + "px";
    flyingfocus.style.top = rect.top + "px";

    document.body.appendChild(flyingfocus);
    flyingfocus.getBoundingClientRect();

    flyingfocus.style.transform = `translateY(-${window.innerHeight}px)`;
    flyingfocus.style.opacity = "0";

    flyingfocus.addEventListener("transitionend", () => {
      const finalRect = flyingfocus.getBoundingClientRect();
      finalfocusPosition = {
        left: finalRect.left,
        top: finalRect.top,
        width: finalRect.width,
        height: finalRect.height,
      };
      document.body.removeChild(flyingfocus);
    });
  }

  // Display the active goal
  function displayActiveGoal(goal) {
    goalContainer.innerHTML = `
      <h1 class="focus-title">Current Goal:</h1>
      <p class="focus-paragraph">${goal}</p>
      <button id="stopBtn" class="focus-button">Goal Completed</button>
      <p id="statusMessage" class="focus-status"></p>
    `;

    document.getElementById("stopBtn").addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "stopTracking" }, (response) => {
        if (response.success) {
          // Broadcast message to animate focuss away on all webpages
          sendfocusAwayToAllWebpages();
          displayGoalInput();
        } else {
          updateStatusMessage("Hoot! Couldn't stop tracking.", "red");
        }
      });
    });
  }

  function updateStatusMessage(message, color) {
    const statusMessage = document.getElementById("statusMessage");
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.style.color = color;
  }

  function sendfocusToWebpage() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "flyfocus" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error communicating with content script:", chrome.runtime.lastError);
          } else {
            console.log(response.status);
          }
        }
      );
    });
  }

  // Broadcast "flyfocusAway" message to all open tabs
  function sendfocusAwayToAllWebpages() {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(
          tab.id,
          { action: "flyfocusAway" },
          (response) => {
            if (chrome.runtime.lastError) {
              // Some tabs may not have our content script; ignore errors
              console.error(`Error sending flyfocusAway to tab ${tab.id}:`, chrome.runtime.lastError.message);
            } else {
              console.log(response?.status || `focus fly-away message sent to tab ${tab.id}`);
            }
          }
        );
      });
    });
  }

  document.body.addEventListener("blur", () => {
    if (!finalfocusPosition) return;

    const persistentfocus = document.createElement("img");
    persistentfocus.src = "./images/duck.gif";
    persistentfocus.className = "focus-fly";

    persistentfocus.style.position = "absolute";
    persistentfocus.style.left = finalfocusPosition.left + "px";
    persistentfocus.style.top = finalfocusPosition.top + "px";
    persistentfocus.style.width = finalfocusPosition.width + "px";
    persistentfocus.style.height = finalfocusPosition.height + "px";

    document.body.appendChild(persistentfocus);
  });
});
