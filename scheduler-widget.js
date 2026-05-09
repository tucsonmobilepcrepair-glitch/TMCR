(function () {
  const currentScript = document.currentScript;
  const apiBase = window.TMCR_SCHEDULER_API_BASE || new URL(currentScript.src).origin;
  const mount = document.getElementById("tmcr-scheduler");
  const businessEmail = "tucsonmobilepcrepair@gmail.com";
  const slotTimes = ["8:00 AM", "9:30 AM", "11:00 AM", "1:00 PM", "2:30 PM", "4:00 PM"];
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();

  if (!mount) {
    return;
  }

  let bookingsCache = [];
  let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = null;
  let selectedTime = "";

  mount.innerHTML = `
    <style>
      #tmcr-scheduler {
        --tmcr-ink: #12151c;
        --tmcr-text: #26303d;
        --tmcr-muted: #657181;
        --tmcr-line: #dfe4ea;
        --tmcr-soft: #f3f6f8;
        --tmcr-accent: #008fa1;
        --tmcr-accent-dark: #006b78;
        --tmcr-danger: #b42318;
        --tmcr-success: #1f7a4d;
        color: var(--tmcr-text);
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1.55;
      }

      #tmcr-scheduler * {
        box-sizing: border-box;
      }

      #tmcr-scheduler button,
      #tmcr-scheduler input,
      #tmcr-scheduler select,
      #tmcr-scheduler textarea {
        font: inherit;
      }

      #tmcr-scheduler button {
        cursor: pointer;
      }

      .tmcr-wrap {
        display: grid;
        gap: 24px;
        padding: clamp(20px, 4vw, 34px);
        border: 1px solid var(--tmcr-line);
        border-radius: 8px;
        background: var(--tmcr-soft);
      }

      .tmcr-header {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(260px, 0.65fr);
        gap: 24px;
        align-items: end;
      }

      .tmcr-header h2 {
        margin: 0;
        color: var(--tmcr-ink);
        font-size: clamp(30px, 5vw, 52px);
        line-height: 1;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .tmcr-header p {
        margin: 0;
        color: var(--tmcr-muted);
        font-size: 17px;
      }

      .tmcr-grid {
        display: grid;
        grid-template-columns: minmax(300px, 0.95fr) minmax(300px, 0.8fr);
        gap: 24px;
        align-items: start;
      }

      .tmcr-panel {
        padding: clamp(20px, 4vw, 30px);
        border: 1px solid var(--tmcr-line);
        border-radius: 8px;
        background: white;
        box-shadow: 0 16px 35px rgba(17, 19, 24, 0.08);
      }

      .tmcr-panel-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 18px;
      }

      .tmcr-panel-heading h3 {
        margin: 0;
        color: var(--tmcr-ink);
        font-size: 24px;
        line-height: 1.1;
      }

      .tmcr-calendar-controls {
        display: flex;
        gap: 8px;
      }

      .tmcr-icon-button {
        display: grid;
        width: 40px;
        height: 40px;
        place-items: center;
        border: 1px solid var(--tmcr-line);
        border-radius: 6px;
        background: white;
        color: var(--tmcr-ink);
        font-weight: 900;
      }

      .tmcr-month-label {
        margin-bottom: 14px;
        color: var(--tmcr-muted);
        font-size: 14px;
        font-weight: 800;
        text-transform: uppercase;
      }

      .tmcr-calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 6px;
      }

      .tmcr-weekday {
        padding: 8px 0;
        color: var(--tmcr-muted);
        font-size: 12px;
        font-weight: 800;
        text-align: center;
        text-transform: uppercase;
      }

      .tmcr-day-button {
        min-height: 48px;
        border: 1px solid var(--tmcr-line);
        border-radius: 6px;
        background: white;
        color: var(--tmcr-ink);
        font-weight: 800;
      }

      .tmcr-day-button[disabled] {
        cursor: not-allowed;
        opacity: 0.35;
      }

      .tmcr-day-button.tmcr-available:hover,
      .tmcr-day-button.tmcr-selected,
      .tmcr-slot-button.tmcr-selected {
        border-color: var(--tmcr-accent-dark);
        background: var(--tmcr-accent-dark);
        color: white;
      }

      .tmcr-time-slots {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin-top: 22px;
      }

      .tmcr-slot-button {
        min-height: 42px;
        border: 1px solid var(--tmcr-line);
        border-radius: 6px;
        background: white;
        color: var(--tmcr-ink);
        font-size: 14px;
        font-weight: 800;
      }

      .tmcr-slot-button[disabled] {
        cursor: not-allowed;
        color: var(--tmcr-muted);
        background: #eef1f4;
        text-decoration: line-through;
      }

      .tmcr-field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .tmcr-field {
        display: grid;
        gap: 7px;
        margin-bottom: 14px;
      }

      .tmcr-field-full {
        grid-column: 1 / -1;
      }

      #tmcr-scheduler label {
        color: var(--tmcr-ink);
        font-size: 13px;
        font-weight: 900;
        text-transform: uppercase;
      }

      #tmcr-scheduler input,
      #tmcr-scheduler select,
      #tmcr-scheduler textarea {
        width: 100%;
        min-height: 44px;
        border: 1px solid #cbd3dc;
        border-radius: 6px;
        padding: 10px 12px;
        color: var(--tmcr-ink);
        background: white;
      }

      #tmcr-scheduler textarea {
        min-height: 105px;
        resize: vertical;
      }

      .tmcr-summary {
        display: grid;
        gap: 6px;
        margin: 6px 0 18px;
        padding: 14px;
        border-left: 4px solid var(--tmcr-accent);
        background: #eefbfc;
        color: var(--tmcr-ink);
        font-size: 14px;
      }

      .tmcr-summary strong {
        text-transform: uppercase;
      }

      .tmcr-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        margin-top: 10px;
      }

      .tmcr-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 20px;
        border: 1px solid var(--tmcr-accent-dark);
        border-radius: 6px;
        background: var(--tmcr-accent-dark);
        color: white;
        font-weight: 800;
        text-transform: uppercase;
        font-size: 13px;
      }

      .tmcr-button-secondary {
        border-color: var(--tmcr-ink);
        background: white;
        color: var(--tmcr-ink);
      }

      .tmcr-status {
        margin-top: 14px;
        min-height: 22px;
        color: var(--tmcr-muted);
        font-weight: 700;
      }

      .tmcr-status.tmcr-success {
        color: var(--tmcr-success);
      }

      .tmcr-status.tmcr-error {
        color: var(--tmcr-danger);
      }

      .tmcr-appointment-list {
        display: grid;
        gap: 10px;
        margin-top: 18px;
      }

      .tmcr-appointment-card {
        display: grid;
        gap: 4px;
        padding: 14px;
        border: 1px solid var(--tmcr-line);
        border-radius: 8px;
        background: white;
        font-size: 14px;
      }

      .tmcr-appointment-card strong {
        color: var(--tmcr-ink);
      }

      .tmcr-appointment-card button {
        justify-self: start;
        margin-top: 6px;
        border: 0;
        background: transparent;
        color: var(--tmcr-danger);
        font-weight: 800;
        padding: 0;
        text-transform: uppercase;
      }

      @media (max-width: 980px) {
        .tmcr-header,
        .tmcr-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 620px) {
        .tmcr-field-grid,
        .tmcr-time-slots {
          grid-template-columns: 1fr;
        }

        .tmcr-day-button {
          min-height: 42px;
          padding: 0;
        }
      }
    </style>

    <div class="tmcr-wrap">
      <div class="tmcr-header">
        <h2>Book an Appointment</h2>
        <p>Pick an available day and time, add the device details, then create a service request.</p>
      </div>

      <div class="tmcr-grid">
        <div class="tmcr-panel" aria-label="Appointment calendar">
          <div class="tmcr-panel-heading">
            <h3>Calendar</h3>
            <div class="tmcr-calendar-controls">
              <button class="tmcr-icon-button" type="button" data-prev aria-label="Previous month">&lsaquo;</button>
              <button class="tmcr-icon-button" type="button" data-next aria-label="Next month">&rsaquo;</button>
            </div>
          </div>
          <div class="tmcr-month-label" data-month></div>
          <div class="tmcr-calendar-grid" data-calendar aria-live="polite"></div>
          <div class="tmcr-time-slots" data-slots aria-label="Available times"></div>
        </div>

        <form class="tmcr-panel" data-form>
          <div class="tmcr-panel-heading">
            <h3>Request Details</h3>
          </div>
          <div class="tmcr-summary" data-summary>
            <strong>No time selected</strong>
            <span>Choose a day and time from the calendar.</span>
          </div>

          <div class="tmcr-field-grid">
            <div class="tmcr-field">
              <label for="tmcr-name">Name</label>
              <input id="tmcr-name" name="customerName" autocomplete="name" required>
            </div>
            <div class="tmcr-field">
              <label for="tmcr-phone">Phone</label>
              <input id="tmcr-phone" name="customerPhone" autocomplete="tel" required>
            </div>
            <div class="tmcr-field">
              <label for="tmcr-email">Email</label>
              <input id="tmcr-email" name="customerEmail" type="text" inputmode="email" autocomplete="email" pattern="[^@\\s]+@[^@\\s]+\\.[^@\\s]+" required>
            </div>
            <div class="tmcr-field">
              <label for="tmcr-service">Service</label>
              <select id="tmcr-service" name="serviceType" required>
                <option value="">Select service</option>
                <option>On-Site Diagnostic</option>
                <option>Device Pick-Up</option>
                <option>Console Repair</option>
                <option>Data Transfer or Backup</option>
                <option>Virus or Malware Cleanup</option>
              </select>
            </div>
            <div class="tmcr-field tmcr-field-full">
              <label for="tmcr-device">Device</label>
              <input id="tmcr-device" name="deviceInfo" placeholder="Example: Dell laptop, Windows 11, won't start" required>
            </div>
            <div class="tmcr-field tmcr-field-full">
              <label for="tmcr-issue">What is happening?</label>
              <textarea id="tmcr-issue" name="issueDescription" placeholder="Include error messages, recent changes, and anything already tried." required></textarea>
            </div>
          </div>

          <div class="tmcr-actions">
            <button class="tmcr-button" type="submit">Create Request</button>
            <button class="tmcr-button tmcr-button-secondary" type="button" data-clear>Clear Saved Bookings</button>
          </div>
          <div class="tmcr-status" data-status role="status"></div>
          <div class="tmcr-appointment-list" data-appointments aria-live="polite"></div>
        </form>
      </div>
    </div>
  `;

  const monthLabel = mount.querySelector("[data-month]");
  const calendarGrid = mount.querySelector("[data-calendar]");
  const timeSlots = mount.querySelector("[data-slots]");
  const bookingSummary = mount.querySelector("[data-summary]");
  const bookingStatus = mount.querySelector("[data-status]");
  const appointmentList = mount.querySelector("[data-appointments]");
  const bookingForm = mount.querySelector("[data-form]");

  async function apiRequest(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Something went wrong.");
    }

    return payload;
  }

  async function refreshBookings() {
    const payload = await apiRequest("/api/bookings");
    bookingsCache = payload.bookings || [];
  }

  function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDate(dateKey) {
    const date = new Date(`${dateKey}T12:00:00`);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  function isPastOrClosed(date) {
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const day = date.getDay();
    return checkDate < todayOnly || day === 0 || day === 6;
  }

  function getBookedTimes(dateKey) {
    return bookingsCache.filter((booking) => booking.date === dateKey).map((booking) => booking.time);
  }

  function renderCalendar() {
    calendarGrid.innerHTML = "";
    timeSlots.innerHTML = "";
    monthLabel.textContent = visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    weekdayNames.forEach((day) => {
      const weekday = document.createElement("div");
      weekday.className = "tmcr-weekday";
      weekday.textContent = day;
      calendarGrid.appendChild(weekday);
    });

    const firstDay = visibleMonth.getDay();
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();

    for (let index = 0; index < firstDay; index += 1) {
      calendarGrid.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
      const dateKey = toDateKey(date);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tmcr-day-button";
      button.textContent = day;
      button.disabled = isPastOrClosed(date);

      if (!button.disabled) {
        button.classList.add("tmcr-available");
      }

      if (selectedDate === dateKey) {
        button.classList.add("tmcr-selected");
      }

      button.addEventListener("click", () => {
        selectedDate = dateKey;
        selectedTime = "";
        renderCalendar();
        renderTimeSlots();
        updateSummary();
      });

      calendarGrid.appendChild(button);
    }

    renderTimeSlots();
  }

  function renderTimeSlots() {
    timeSlots.innerHTML = "";

    if (!selectedDate) {
      const message = document.createElement("p");
      message.textContent = "Select an available weekday to see appointment times.";
      timeSlots.appendChild(message);
      return;
    }

    const bookedTimes = getBookedTimes(selectedDate);

    slotTimes.forEach((time) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tmcr-slot-button";
      button.textContent = time;
      button.disabled = bookedTimes.includes(time);

      if (selectedTime === time) {
        button.classList.add("tmcr-selected");
      }

      button.addEventListener("click", () => {
        selectedTime = time;
        renderTimeSlots();
        updateSummary();
      });

      timeSlots.appendChild(button);
    });
  }

  function updateSummary() {
    if (!selectedDate || !selectedTime) {
      bookingSummary.innerHTML = "<strong>No time selected</strong><span>Choose a day and time from the calendar.</span>";
      return;
    }

    bookingSummary.innerHTML = `<strong>${formatDate(selectedDate)}</strong><span>${selectedTime} Arizona time</span>`;
  }

  function renderAppointments() {
    const bookings = [...bookingsCache].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    appointmentList.innerHTML = "";

    bookings.forEach((booking) => {
      const card = document.createElement("article");
      card.className = "tmcr-appointment-card";
      card.innerHTML = `
        <strong>${formatDate(booking.date)} at ${booking.time}</strong>
        <span>${booking.serviceType} for ${booking.customerName}</span>
        <span>${booking.deviceInfo}</span>
      `;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.addEventListener("click", async () => {
        try {
          await apiRequest(`/api/bookings/${encodeURIComponent(booking.id)}`, { method: "DELETE" });
          await refreshBookings();
          renderAppointments();
          renderCalendar();
          setStatus("Booking removed from the backend.");
        } catch (error) {
          setStatus(error.message, "error");
        }
      });

      card.appendChild(remove);
      appointmentList.appendChild(card);
    });
  }

  function setStatus(message, type) {
    bookingStatus.textContent = message;
    bookingStatus.className = `tmcr-status${type ? ` tmcr-${type}` : ""}`;
  }

  function buildEmail(booking) {
    const subject = encodeURIComponent(`Appointment request: ${booking.serviceType}`);
    const body = encodeURIComponent([
      "New appointment request",
      "",
      `Date: ${formatDate(booking.date)}`,
      `Time: ${booking.time} Arizona time`,
      `Name: ${booking.customerName}`,
      `Phone: ${booking.customerPhone}`,
      `Email: ${booking.customerEmail}`,
      `Service: ${booking.serviceType}`,
      `Device: ${booking.deviceInfo}`,
      "",
      "Issue:",
      booking.issueDescription
    ].join("\n"));

    return `mailto:${businessEmail}?subject=${subject}&body=${body}`;
  }

  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!selectedDate || !selectedTime) {
      setStatus("Please choose a calendar day and time first.", "error");
      return;
    }

    const formData = new FormData(bookingForm);
    const booking = {
      date: selectedDate,
      time: selectedTime,
      customerName: formData.get("customerName").trim(),
      customerPhone: formData.get("customerPhone").trim(),
      customerEmail: formData.get("customerEmail").trim(),
      serviceType: formData.get("serviceType"),
      deviceInfo: formData.get("deviceInfo").trim(),
      issueDescription: formData.get("issueDescription").trim()
    };

    try {
      setStatus("Saving appointment request...");
      const payload = await apiRequest("/api/bookings", {
        method: "POST",
        body: JSON.stringify(booking)
      });
      await refreshBookings();
      setStatus("Appointment request saved. Your email app should open with the request ready to send.", "success");
      window.location.href = buildEmail(payload.booking);
      selectedTime = "";
      bookingForm.reset();
      updateSummary();
      renderAppointments();
      renderCalendar();
    } catch (error) {
      setStatus(error.message, "error");
      await refreshBookings();
      renderTimeSlots();
    }
  });

  mount.querySelector("[data-prev]").addEventListener("click", () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  mount.querySelector("[data-next]").addEventListener("click", () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  mount.querySelector("[data-clear]").addEventListener("click", async () => {
    try {
      await apiRequest("/api/bookings", { method: "DELETE" });
      await refreshBookings();
      setStatus("All backend bookings were cleared.");
      renderAppointments();
      renderCalendar();
    } catch (error) {
      setStatus(error.message, "error");
    }
  });

  async function startScheduler() {
    try {
      await refreshBookings();
    } catch (error) {
      setStatus("The scheduling backend is not responding.", "error");
    }

    renderCalendar();
    updateSummary();
    renderAppointments();
  }

  startScheduler();
})();
