console.log("=== APP.JS LOADED ===");

document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM Content Loaded");
  
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  
  console.log("Elements found:", { activitiesList, activitySelect, signupForm, messageDiv });

  function fetchActivities() {
    console.log("Fetching activities...");
    fetch("/activities")
      .then(response => {
        console.log("Response received:", response.status);
        return response.json();
      })
      .then(activities => {
        console.log("Parsed activities:", activities);
        
        activitiesList.innerHTML = "";
        
        // Clear dropdown
        while (activitySelect.options.length > 1) {
          activitySelect.remove(1);
        }

        // Build cards
        Object.entries(activities).forEach(([name, details]) => {
          console.log(`Processing activity: ${name}`, details);
          
          const card = document.createElement("div");
          card.className = "activity-card";
          
          const participants = details.participants || [];
          const spotsAvailable = details.max_participants - participants.length;
          
          // Build participants list
          let participantsList = "";
          if (participants.length > 0) {
            participantsList = participants.map(p => `
              <li style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0;">
                <span>${p}</span>
                <button class="delete-participant" data-activity="${name}" data-email="${p}" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 16px; padding: 0 5px; line-height: 1;">🗑️</button>
              </li>
            `).join("");
          } else {
            participantsList = "<li><em>No participants yet</em></li>";
          }
          
          card.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsAvailable} spots left (${participants.length}/${details.max_participants})</p>
            <div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border: 2px solid #2196F3; border-radius: 4px;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #1565c0; font-size: 14px;">👥 Participants (${participants.length})</p>
              <ul style="margin: 0; padding-left: 20px; list-style: none;">
                ${participantsList}
              </ul>
            </div>
          `;
          
          activitiesList.appendChild(card);
          
          // Attach delete button listeners
          card.querySelectorAll(".delete-participant").forEach(btn => {
            btn.addEventListener("click", function(e) {
              e.preventDefault();
              const email = this.getAttribute("data-email");
              const activity = this.getAttribute("data-activity");
              deleteParticipant(activity, email);
            });
          });
          
          // Add to dropdown
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          activitySelect.appendChild(option);
        });
        
        console.log("Activities rendered successfully");
      })
      .catch(error => {
        console.error("Error fetching activities:", error);
        activitiesList.innerHTML = `<p style="color: red;">Error loading activities: ${error.message}</p>`;
      });
  }

  // Delete participant function
  function deleteParticipant(activity, email) {
    if (!confirm(`Remove ${email} from ${activity}?`)) {
      return;
    }

    console.log(`Deleting: ${email} from ${activity}`);

    fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
      method: "DELETE"
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          return response.json().then(data => {
            throw new Error(data.detail || "Failed to remove participant");
          });
        }
      })
      .then(data => {
        console.log("Delete successful:", data);
        // Refresh activities immediately
        fetchActivities();
      })
      .catch(error => {
        console.error("Delete error:", error);
        alert(`Error: ${error.message}`);
      });
  }

  // Handle signup
  signupForm.addEventListener("submit", function(e) {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    
    console.log(`Submitting signup: ${email} for ${activity}`);
    
    if (!activity) {
      messageDiv.textContent = "Please select an activity";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }
    
    fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
      method: "POST"
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          return response.json().then(data => {
            throw new Error(data.detail || "Signup failed");
          });
        }
      })
      .then(data => {
        console.log("Signup successful:", data);
        messageDiv.textContent = data.message || "Successfully signed up!";
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        signupForm.reset();
        
        // Refresh activities immediately
        console.log("Calling fetchActivities after signup");
        fetchActivities();
        
        setTimeout(() => messageDiv.classList.add("hidden"), 5000);
      })
      .catch(error => {
        console.error("Signup error:", error);
        messageDiv.textContent = error.message || "Error signing up";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      });
  });

  console.log("Event listeners attached, calling fetchActivities");
  fetchActivities();
});
