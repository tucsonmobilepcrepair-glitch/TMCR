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
        --tmcr-ink: #151922;
        --tmcr-text: #263142;
        --tmcr-muted: #465568;
        --tmcr-line: #d7e0e8;
        --tmcr-soft: #f7f9fb;
        --tmcr-paper: #ffffff;
        --tmcr-accent: #007f8f;
        --tmcr-accent-dark: #005f6c;
        --tmcr-warm: #b87525;
        --tmcr-danger: #b42318;
        --tmcr-success: #1f7a4d;
        display: block;
        color: var(--tmcr-text);
        background: var(--tmcr-paper);
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

      #tmcr-scheduler button:focus,
      #tmcr-scheduler input:focus,
      #tmcr-scheduler select:focus,
      #tmcr-scheduler textarea:focus {
        outline: 3px solid rgba(184, 117, 37, 0.35);
        outline-offset: 2px;
      }

      .tmcr-shell {
        display: grid;
        gap: 26px;
        padding: clamp(12px, 2vw, 20px) 0;
        background: var(--tmcr-paper);
      }

      .tmcr-hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(270px, 0.55fr);
        gap: 24px;
        align-items: end;
      }

      .tmcr-eyebrow {
        display: inline-flex;
        width: fit-content;
        margin-bottom: 12px;
        color: var(--tmcr-accent-dark);
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .tmcr-hero h2 {
        margin: 0 0 12px;
        color: var(--tmcr-ink);
        font-size: clamp(30px, 4vw, 48px);
        line-height: 1;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .tmcr-hero p {
        max-width: 680px;
        margin: 0;
        color: var(--tmcr-muted);
        font-size: 18px;
      }

      .tmcr-callout {
        display: grid;
        gap: 8px;
        padding: 18px;
        border-left: 4px solid var(--tmcr-warm);
        border-radius: 8px;
        background: #fffaf4;
        box-shadow: none;
      }

      .tmcr-callout strong {
        color: var(--tmcr-ink);
        font-size: 15px;
        text-transform: uppercase;
      }

      .tmcr-callout span {
        color: var(--tmcr-muted);
        font-size: 14px;
      }

      .tmcr-steps {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .tmcr-step {
        min-height: 78px;
        padding: 14px;
        border: 1px solid #dfe6ed;
        border-radius: 8px;
        background: var(--tmcr-paper);
        box-shadow: 0 8px 18px rgba(21, 25, 34, 0.04);
      }

      .tmcr-step strong {
        display: block;
        margin-bottom: 2px;
        color: var(--tmcr-ink);
        font-size: 13px;
        text-transform: uppercase;
      }

      .tmcr-step span {
        color: var(--tmcr-muted);
        font-size: 14px;
      }

      .tmcr-grid {
        display: grid;
        grid-template-columns: minmax(310px, 0.9fr) minmax(330px, 1fr);
        gap: 22px;
        align-items: start;
      }

      .tmcr-panel {
        padding: clamp(18px, 3vw, 28px);
        border: 1px solid #dfe6ed;
        border-radius: 8px;
        background: var(--tmcr-paper);
        box-shadow: 0 10px 24px rgba(21, 25, 34, 0.06);
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
        font-size: 22px;
        line-height: 1.12;
      }

      .tmcr-panel-heading p {
        margin: 4px 0 0;
        color: var(--tmcr-muted);
        font-size: 14px;
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

      .tmcr-icon-button:hover {
        border-color: var(--tmcr-accent);
        color: var(--tmcr-accent-dark);
      }

      .tmcr-month-label {
        margin-bottom: 12px;
        color: var(--tmcr-muted);
        font-size: 13px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .tmcr-calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 6px;
      }

      .tmcr-weekday {
        padding: 7px 0;
        color: var(--tmcr-muted);
        font-size: 11px;
        font-weight: 900;
        text-align: center;
        text-transform: uppercase;
      }

      .tmcr-day-button {
        min-height: 46px;
        border: 1px solid var(--tmcr-line);
        border-radius: 6px;
        background: white;
        color: var(--tmcr-ink);
        font-weight: 900;
      }

      .tmcr-day-button[disabled] {
        cursor: not-allowed;
        color: #9aa4b1;
        background: #fbfcfd;
        opacity: 1;
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
        margin-top: 20px;
      }

      .tmcr-time-slots p {
        grid-column: 1 / -1;
        margin: 0;
        color: var(--tmcr-muted);
        font-size: 15px;
      }

      .tmcr-slot-button {
        min-height: 42px;
        border: 1px solid var(--tmcr-line);
        border-radius: 6px;
        background: white;
        color: var(--tmcr-ink);
        font-size: 14px;
        font-weight: 900;
      }

      .tmcr-slot-button[disabled] {
        cursor: not-allowed;
        color: #7d8997;
        background: #eef1f4;
        text-decoration: line-through;
      }

      .tmcr-summary {
        display: grid;
        gap: 5px;
        margin: 0 0 18px;
        padding: 14px;
        border-left: 4px solid var(--tmcr-accent);
        border-radius: 0 8px 8px 0;
        background: #eefbfc;
        color: var(--tmcr-ink);
        font-size: 14px;
      }

      .tmcr-summary strong {
        text-transform: uppercase;
      }

      .tmcr-field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .tmcr-field {
        display: grid;
        gap: 7px;
        margin-bottom: 13px;
      }

      .tmcr-field-full {
        grid-column: 1 / -1;
      }

      #tmcr-scheduler label {
        color: var(--tmcr-ink);
        font-size: 12px;
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
        min-height: 106px;
        resize: vertical;
      }

      #tmcr-scheduler input::placeholder,
      #tmcr-scheduler textarea::placeholder {
        color: #687789;
        opacity: 1;
      }

      .tmcr-helper {
        margin: -4px 0 14px;
        color: var(--tmcr-muted);
        font-size: 13px;
      }

      .tmcr-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        margin-top: 8px;
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
        font-weight: 900;
        text-transform: uppercase;
        font-size: 13px;
      }

      .tmcr-button[disabled] {
        cursor: progress;
        opacity: 0.72;
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

      .tmcr-support {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 18px;
        align-items: center;
        padding: 22px;
        border-radius: 8px;
        background: var(--tmcr-ink);
        color: white;
      }

      .tmcr-support strong {
        display: block;
        margin-bottom: 4px;
        font-size: 18px;
        line-height: 1.2;
      }

      .tmcr-support span {
        color: #d9e1ea;
        font-size: 15px;
      }

      .tmcr-support a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        padding: 0 18px;
        border: 1px solid white;
        border-radius: 6px;
        color: white;
        font-size: 13px;
        font-weight: 900;
        text-decoration: none;
        text-transform: uppercase;
        white-space: nowrap;
      }

      @media (max-width: 980px) {
        .tmcr-hero,
        .tmcr-grid,
        .tmcr-steps {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 620px) {
        .tmcr-shell {
          padding: 16px;
          gap: 18px;
        }

        .tmcr-panel {
          padding: 16px;
        }

        .tmcr-panel-heading {
          align-items: flex-start;
          flex-direction: column;
        }

        .tmcr-support {
          grid-template-columns: 1fr;
        }

        .tmcr-support a {
          width: 100%;
        }

        .tmcr-calendar-controls {
          width: 100%;
          justify-content: space-between;
        }

        .tmcr-field-grid,
        .tmcr-time-slots {
          grid-template-columns: 1fr;
        }

        .tmcr-calendar-grid {
          gap: 5px;
        }

        .tmcr-day-button {
          min-height: 40px;
          padding: 0;
          font-size: 14px;
        }

        .tmcr-hero h2 {
          font-size: 30px;
        }

        .tmcr-actions,
        .tmcr-button {
          width: 100%;
        }
      }
    </style>

    <section class="tmcr-shell" aria-label="Schedule computer repair">
      <div class="tmcr-hero">
        <div>
          <span class="tmcr-eyebrow">Tucson mobile computer repair</span>
          <h2>Schedule Service</h2>
          <p>Choose a weekday appointment, tell us what is happening, and we will follow up with clear next steps for diagnostics, pick-up, or repair.</p>
        </div>
        <div class="tmcr-callout">
          <strong>Need help today?</strong>
          <span>Call (520) 585-2939 if the issue is urgent or the device will not power on.</span>
        </div>
      </div>

      <div class="tmcr-steps" aria-label="Booking steps">
        <div class="tmcr-step">
          <strong>1. Pick a time</strong>
          <span>Available weekday slots are shown in Arizona time.</span>
        </div>
        <div class="tmcr-step">
          <strong>2. Describe the issue</strong>
          <span>Include model, symptoms, and recent changes.</span>
        </div>
        <div class="tmcr-step">
          <strong>3. Get confirmation</strong>
          <span>Your request is saved and prepared as an email.</span>
        </div>
      </div>

      <div class="tmcr-grid">
        <div class="tmcr-panel" aria-label="Appointment calendar">
          <div class="tmcr-panel-heading">
            <div>
              <h3>Calendar</h3>
              <p>Weekends and past dates are unavailable.</p>
            </div>
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
            <div>
              <h3>Request Details</h3>
              <p>We use this information only to prepare for your appointment.</p>
            </div>
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
              <input id="tmcr-device" name="deviceInfo" placeholder="Example: Dell laptop, Windows 11, will not start" required>
            </div>
            <div class="tmcr-field tmcr-field-full">
              <label for="tmcr-issue">What is happening?</label>
              <textarea id="tmcr-issue" name="issueDescription" placeholder="Include error messages, recent changes, and anything already tried." required></textarea>
            </div>
          </div>

          <p class="tmcr-helper">Submitting saves your request and opens your email app with the same details ready to send.</p>

          <div class="tmcr-actions">
            <button class="tmcr-button" type="submit" data-submit>Create Request</button>
          </div>
          <div class="tmcr-status" data-status role="status"></div>
        </form>
      </div>

      <div class="tmcr-support">
        <div>
          <strong>Questions before booking?</strong>
          <span>Call or email Tucson Mobile Computer Repair for urgent issues, pricing questions, or help choosing the right service.</span>
        </div>
        <a href="tel:+15205852939">Call (520) 585-2939</a>
      </div>
    </section>
  `;

  const monthLabel = mount.querySelector("[data-month]");
  const calendarGrid = mount.querySelector("[data-calendar]");
  const timeSlots = mount.querySelector("[data-slots]");
  const bookingSummary = mount.querySelector("[data-summary]");
  const bookingStatus = mount.querySelector("[data-status]");
  const bookingForm = mount.querySelector("[data-form]");
  const submitButton = mount.querySelector("[data-submit]");

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
      submitButton.disabled = true;
      submitButton.textContent = "Saving...";
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
      renderCalendar();
    } catch (error) {
      setStatus(error.message, "error");
      await refreshBookings();
      renderTimeSlots();
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Create Request";
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

  async function startScheduler() {
    try {
      await refreshBookings();
    } catch (error) {
      setStatus("The scheduling system is waking up. Please refresh in a moment if times do not load.", "error");
    }

    renderCalendar();
    updateSummary();
  }

  startScheduler();
})();
