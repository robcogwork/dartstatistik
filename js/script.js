document.addEventListener("DOMContentLoaded", () => {
  const containers = document.querySelectorAll(".dartstatistik-container");
  console.log(`Found ${containers.length} dartstatistik-container(s).`);

  containers.forEach((container, index) => {
    const config = {
      type: container.getAttribute("data-type") || "senior",
      district: container.getAttribute("data-district") || "",
      limit: parseInt(container.getAttribute("data-limit"), 10) || 0,
      showCalendar: container.getAttribute("data-show-calendar") === "true",
      showDistrict: container.getAttribute("data-show-district") === "true",
    };

    console.log(`Container ${index + 1} Config:`, config);

    let selectedType = config.type;
    let selectedDistrict = config.district;

    if (config.showDistrict) {
      initializeDistrictTabs(container, config, (newDistrict) => {
        console.log(`District tab changed: District=${newDistrict}`);
        selectedDistrict = newDistrict;
        fetchAndRenderTournaments(
          container,
          selectedDistrict,
          selectedType,
          config
        );
      });
    }

    fetchAndRenderTournaments(
      container,
      selectedDistrict,
      selectedType,
      config
    );
  });
});

/**
 * Initialize District Tabs
 */
function initializeDistrictTabs(container, config, onTabChange) {
  const tabsContainer = container.querySelector(".tabs-container");
  if (!tabsContainer) {
    console.log("Tabs container not found.");
    return;
  }

  console.log("Initializing district tabs for container.");

  tabsContainer.addEventListener("click", (event) => {
    const target = event.target;

    if (target.classList.contains("district-tab")) {
      const newDistrict = target.getAttribute("data-district");
      console.log("District tab clicked:", newDistrict);
      updateActiveTab(tabsContainer, "district-tab", target);
      onTabChange(newDistrict); // Update district
    }
  });
}

/**
 * Update Active Tab Styling
 */
function updateActiveTab(container, tabClass, activeTab) {
  container
    .querySelectorAll(`.${tabClass}`)
    .forEach((tab) => tab.classList.remove("active"));
  activeTab.classList.add("active");
  console.log(`Active tab updated for class: ${tabClass}`);
}

/**
 * Fetch and Render Tournaments
 */
async function fetchAndRenderTournaments(container, district, type, config) {
  const gridContainer = container.querySelector(".tournament-grid");
  const calendarEl = container.querySelector(".event-calendar");

  gridContainer.innerHTML = "<p>Loading tournaments...</p>";
  if (config.showCalendar && calendarEl) {
    calendarEl.innerHTML = "";
  }

  // Prepare AJAX parameters
  const params = new URLSearchParams({
    action: "dartstatistik_fetch",
    type: type === "junior" ? "juniorU25" : type,
  });

  if (district) {
    params.append("district", district);
  }

  if (config.limit > 0) {
    params.append("limit", config.limit);
  }

  try {
    console.log(`Fetching tournaments with params: ${params.toString()}`);
    const response = await fetch(
      `${dartPluginData.ajaxUrl}?${params.toString()}`,
      {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) throw new Error("Network response was not ok");

    const result = await response.json();
    console.log("Fetch result:", result);
    if (!result.success) {
      gridContainer.innerHTML = "<p>No tournaments available.</p>";
      return;
    }

    const data = result.data;
    // Ensure 'DR' and the specified 'type' exist
    if (!data.DR || !data.DR[type]) {
      gridContainer.innerHTML = "<p>No tournaments available.</p>";
      return;
    }

    const tournaments = data.DR[type].tourn || [];

    // Apply limit if set (redundant if handled server-side, but safe)
    const filteredTournaments =
      config.limit > 0 ? tournaments.slice(0, config.limit) : tournaments;

    renderTournaments(gridContainer, filteredTournaments);

    if (config.showCalendar && calendarEl) {
      renderCalendar(calendarEl, filteredTournaments);
    }
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    gridContainer.innerHTML = "<p>Error loading tournaments.</p>";
  }
}

/**
 * Render Tournament Cards
 */
function renderTournaments(container, tournaments) {
  if (tournaments.length === 0) {
    container.innerHTML = "<p>No tournaments available.</p>";
    return;
  }

  container.innerHTML = "";
  tournaments.forEach((item) => {
    const tournamentCard = document.createElement("div");
    tournamentCard.classList.add("tournament-card");

    // Handle date format: "6-8 december 2024" or "14-15 december 2024"
    const dateParts = item.date.split(" ");
    const dayPart = dateParts[0];
    const month = dateParts.slice(1, -1).join(" ");
    const year = dateParts[dateParts.length - 1];
    const days = dayPart.split("-");

    const displayDay = days.length === 1 ? days[0] : `${days[0]}-${days[1]}`;

    tournamentCard.innerHTML = `
          <div class="calendar-box">
              <div class="calendar-month">${month}</div>
              <div class="calendar-day">${displayDay}</div>
          </div>
          <div class="tournament-info">
              <h3 class="tourn-name">${item.name}</h3>
              <p class="tourn-dates">${item.date}</p>
              <div class="buttons">
                  <button onclick="openModal('${item.invitation}')">View Invitation</button>
                  <button>
                      <a href="${item.page}" target="_blank" rel="noopener noreferrer">Register</a>
                  </button>
              </div>
          </div>
      `;
    container.appendChild(tournamentCard);
  });
  console.log("Tournaments rendered.");
}

/**
 * Render FullCalendar
 */
function renderCalendar(calendarEl, tournaments) {
  if (!tournaments || tournaments.length === 0) {
    console.log("No tournaments to display in calendar.");
    return;
  }

  const calendarEvents = tournaments.map((item) => ({
    title: item.name,
    start: item.startDate || item.date,
    extendedProps: { details: item },
  }));

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    events: calendarEvents,
    eventClick: function (info) {
      openCalendarModal(info.event.extendedProps.details);
    },
  });

  calendar.render();
  console.log("Calendar rendered.");
}

/**
 * Open Modal with Invitation
 */
function openModal(url) {
  const modal = document.querySelector(".image-modal");
  const iframe = modal.querySelector("iframe");
  iframe.src = url;
  modal.style.display = "flex";
  console.log("Opened modal with URL:", url);
}

/**
 * Close Invitation Modal
 */
function closeModal() {
  const modal = document.querySelector(".image-modal");
  const iframe = modal.querySelector("iframe");
  iframe.src = "";
  modal.style.display = "none";
  console.log("Closed modal.");
}

/**
 * Open Calendar Modal with Event Details
 */
function openCalendarModal(eventDetails) {
  const modal = document.querySelector(".calendar-modal");
  const content = modal.querySelector(".calendar-modal-event-content");

  content.innerHTML = `
      <h3>${eventDetails.name}</h3>
      <p><strong>Date:</strong> ${eventDetails.date}</p>
      <p><strong>District:</strong> ${eventDetails.district || "N/A"}</p>
      <div class="buttons">
          <button onclick="openInvitation('${
            eventDetails.invitation
          }')">View Invitation</button>
          <button>
              <a href="${
                eventDetails.page
              }" target="_blank" rel="noopener noreferrer" onclick="closeCalendarModal()">Go to Page</a>
          </button>
      </div>
  `;
  modal.style.display = "flex";
  console.log("Opened calendar modal for event:", eventDetails.name);
}

/**
 * Close Calendar Modal
 */
function closeCalendarModal() {
  const modal = document.querySelector(".calendar-modal");
  modal.style.display = "none";
  console.log("Closed calendar modal.");
}

/**
 * Open Invitation from Calendar Modal
 */
function openInvitation(url) {
  closeCalendarModal();
  openModal(url);
  console.log("Opened invitation with URL:", url);
}
