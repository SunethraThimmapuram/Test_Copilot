document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section (pretty bulleted list with avatar initials)
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = "Participants";
        participantsDiv.appendChild(participantsTitle);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");

            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";
            avatar.textContent = getInitials(p);

            const text = document.createElement("span");
            text.textContent = p;

            // remove/unregister button
            const removeBtn = document.createElement("button");
            removeBtn.className = "participant-remove";
            removeBtn.title = "Unregister participant";
            removeBtn.innerHTML = "&times;"; // simple × icon

            // attach click handler to unregister with confirmation
            removeBtn.addEventListener("click", async (e) => {
              e.preventDefault();
              e.stopPropagation();

              // ask for confirmation
              const confirmed = window.confirm(
                `Unregister ${p} from ${name}? This cannot be undone.`
              );
              if (!confirmed) return;

              // optimistic UI: disable button while processing
              removeBtn.disabled = true;

              try {
                const activityEncoded = encodeURIComponent(name);
                const emailEncoded = encodeURIComponent(p);
                const res = await fetch(
                  `/activities/${activityEncoded}/unregister?email=${emailEncoded}`,
                  {
                    method: "POST",
                  }
                );

                if (res.ok) {
                  // refresh the activities UI so availability and lists update
                  fetchActivities();
                } else {
                  const body = await res.json().catch(() => ({}));
                  console.error("Failed to unregister:", body.detail || body);
                  removeBtn.disabled = false;
                  alert(body.detail || "Failed to unregister participant");
                }
              } catch (err) {
                console.error("Error unregistering participant:", err);
                removeBtn.disabled = false;
                alert("Failed to unregister participant. Please try again.");
              }
            });

            li.appendChild(avatar);
            li.appendChild(text);
            li.appendChild(removeBtn);
            participantsList.appendChild(li);
          });

          participantsDiv.appendChild(participantsList);
        } else {
          const no = document.createElement("div");
          no.className = "no-participants";
          no.textContent = "No participants yet.";
          participantsDiv.appendChild(no);
        }

        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Helper: derive initials from an email/identifier
  function getInitials(identifier) {
    const namePart = (identifier || "").split("@")[0];
    const parts = namePart.split(/[\._\-\s]+/).filter(Boolean);
    const first = parts[0] || "";
    const second = parts[1] || "";
    const initials = (first[0] || "") + (second[0] || "");
    return initials.toUpperCase();
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities so the new participant appears without a page reload
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
