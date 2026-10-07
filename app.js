(() => {
  "use strict";
  const config = window.CY_CONFIG || {};
  const email = typeof config.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email.trim()) ? config.email.trim() : "";
  const phone = typeof config.whatsapp === "string" ? config.whatsapp.replace(/[^0-9]/g, "") : "";
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const menu = document.querySelector(".menu-toggle");
  const nav = document.getElementById("navigation");
  const closeMenu = () => { nav.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); };
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    nav.classList.toggle("open", open);
    menu.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") { closeMenu(); menu.focus(); }
  });
  document.addEventListener("click", event => {
    if (!nav.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
  window.addEventListener("resize", () => { if (window.innerWidth > 800) closeMenu(); });

  const flows = {
    leads: ["01 / 03", "A new enquiry arrives", "Capture. Organise. Follow up.", "Save the lead in your CRM and prepare a timely, relevant response.", "CRM updated", "Details in one place", "Team notified", "Ready for the next step"],
    support: ["02 / 03", "A customer asks a question", "Find. Answer. Escalate.", "Search your approved information and pass complex questions to your team.", "Relevant answer", "Grounded in your content", "Human handover", "When more help is needed"],
    ops: ["03 / 03", "It's time for your daily report", "Collect. Check. Summarise.", "Gather updates from your tools and prepare a report your team can use.", "Data organised", "A consistent overview", "Report prepared", "Ready for your review"]
  };
  const flowTargets = [".panel-number", "#flow-start", "#flow-middle", "#flow-detail", "#flow-output-one", "#flow-output-detail-one", "#flow-output-two", "#flow-output-detail-two"];
  document.querySelectorAll("[data-flow]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-flow]").forEach(tab => { const active = tab === button; tab.classList.toggle("active", active); tab.setAttribute("aria-pressed", String(active)); });
      flows[button.dataset.flow].forEach((value, index) => { document.querySelector(flowTargets[index]).textContent = value; });
    });
  });

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-filter]").forEach(tab => { const active = tab === button; tab.classList.toggle("active", active); tab.setAttribute("aria-pressed", String(active)); });
      document.querySelectorAll("[data-category]").forEach(card => { card.hidden = button.dataset.filter !== "all" && card.dataset.category !== button.dataset.filter; });
    });
  });
  document.querySelectorAll("[data-interest]").forEach(link => {
    link.addEventListener("click", () => { document.getElementById("service").value = link.dataset.interest; });
  });

  const contactLinks = document.getElementById("contact-links");
  const showContact = (id, href) => { const link = document.getElementById(id); link.href = href; link.hidden = false; contactLinks.hidden = false; };
  if (email) showContact("email-link", "mailto:" + email);
  if (/^[1-9][0-9]{6,14}$/.test(phone)) showContact("whatsapp-link", "https://wa.me/" + phone);
  if (typeof config.bookingUrl === "string" && config.bookingUrl) {
    try { const url = new URL(config.bookingUrl); if (url.protocol === "https:") showContact("booking-link", url.href); } catch (_) { /* Invalid URLs remain hidden. */ }
  }
  const profileHosts = { upworkUrl: ["upwork.com", "www.upwork.com"], linkedinUrl: ["linkedin.com", "www.linkedin.com"] };
  for (const [key, hosts] of Object.entries(profileHosts)) {
    if (typeof config[key] !== "string" || !config[key]) continue;
    try {
      const url = new URL(config[key]);
      if (url.protocol !== "https:" || !hosts.includes(url.hostname) || url.username || url.password) continue;
      if (key === "upworkUrl" && !url.pathname.startsWith("/freelancers/")) continue;
      if (key === "linkedinUrl" && !url.pathname.startsWith("/in/")) continue;
      showContact(key === "upworkUrl" ? "upwork-link" : "linkedin-link", url.href);
    } catch (_) { /* Unconfirmed or invalid profiles stay hidden. */ }
  }

  let brief = "";
  const form = document.getElementById("project-form");
  const result = document.getElementById("brief-result");
  const status = document.getElementById("brief-status");
  const send = document.getElementById("send-brief");
  if (email) {
    document.getElementById("form-hint").textContent = "Prepare your brief, then open an email draft to send it. Nothing is sent automatically.";
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    brief = "PROJECT ENQUIRY — Consistently You Automation Hub\n\n" +
      "Name: " + String(values.get("name") || "").trim() + "\n" +
      "Email: " + String(values.get("email") || "").trim() + "\n" +
      "Service: " + String(values.get("service") || "") + "\n\n" +
      "Project details:\n" + String(values.get("message") || "").trim();
    document.getElementById("brief-text").textContent = brief;
    status.textContent = email ? "Your brief is ready. Open an email draft to send it, or copy/download it." : "Your brief is ready. Copy or download it to share.";
    if (email) {
      send.href = "mailto:" + email + "?subject=" + encodeURIComponent("Project enquiry: " + String(values.get("service") || "")) + "&body=" + encodeURIComponent(brief);
      send.hidden = false;
    }
    result.hidden = false;
    result.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  });
  document.getElementById("copy-brief").addEventListener("click", async () => {
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(brief);
      status.textContent = "Brief copied. You can paste it into your message.";
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents(document.getElementById("brief-text"));
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(range);
      status.textContent = "The brief is selected. Use your device's Copy command, or download it below.";
    }
  });
  document.getElementById("download-brief").addEventListener("click", () => {
    if (!brief) return;
    const url = URL.createObjectURL(new Blob([brief], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "consistently-you-project-brief.txt";
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "Download requested. Your brief has not been sent.";
  });
})();
