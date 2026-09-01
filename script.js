/* ============================================================
   SUNRISE STEEL — front-end behaviour
   - Mobile nav toggle
   - RFQ form: submit to /api/rfq, fall back to mailto on failure
   - Honeypot spam trap
   - Lightweight landing attribution (no cookies, no 3rd-party JS)
   - "Get price" links prefill the product field via URL params
   ============================================================ */
(function () {
  "use strict";

  var OWNER_EMAIL = "sales@sunrisesteel.example.com"; // fallback mailto target

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");
  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var open = siteNav.classList.toggle("open");
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    siteNav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        siteNav.classList.remove("open");
        navToggle.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Landing attribution (in-memory only) ---------- */
  var attribution = {
    landing: location.pathname,
    referrer: document.referrer || "direct",
  };
  try {
    var params = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign"].forEach(function (k) {
      var v = params.get(k);
      if (v) attribution[k] = v;
    });
  } catch (e) { /* older browsers: attribution is optional */ }

  /* ---------- Prefill product from "quote-link" anchors ---------- */
  var productSelect = document.getElementById("f-product");
  document.querySelectorAll(".quote-link[data-product]").forEach(function (a) {
    a.addEventListener("click", function () {
      var p = a.getAttribute("data-product") || "";
      if (productSelect) {
        for (var i = 0; i < productSelect.options.length; i++) {
          if (productSelect.options[i].text === p) {
            productSelect.selectedIndex = i;
            break;
          }
        }
      }
    });
  });
  // Also support direct URL: ?product=...&quantity=...&details=...
  try {
    var q = new URLSearchParams(location.search);
    ["product", "quantity", "details"].forEach(function (key) {
      var v = q.get(key);
      if (!v) return;
      var el = document.getElementById("f-" + key);
      if (!el) return;
      if (el.tagName === "SELECT") {
        for (var i = 0; i < el.options.length; i++) {
          if (el.options[i].text.toLowerCase() === v.toLowerCase()) {
            el.selectedIndex = i;
            break;
          }
        }
      } else {
        el.value = v;
      }
    });
  } catch (e) { /* optional feature */ }

  /* ---------- RFQ form ---------- */
  var form = document.getElementById("rfqForm");
  var statusEl = document.getElementById("formStatus");
  var submitBtn = document.getElementById("rfqSubmit");

  function setStatus(msg, cls) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "form-status " + (cls || "");
  }

  function buildInquiry(data) {
    return [
      "New RFQ from website",
      "",
      "Name: " + data.name,
      "Email: " + data.email,
      "Country/Port: " + (data.country || "-"),
      "Product: " + (data.product || "-"),
      "Quantity: " + (data.quantity || "-"),
      "",
      "Details:",
      data.details,
      "",
      "---- Page info ----",
      "Page: " + attribution.landing,
      "Referrer: " + attribution.referrer,
      Object.keys(attribution).filter(function (k) { return k.indexOf("utm_") === 0; })
        .map(function (k) { return k + ": " + attribution[k]; }).join("\n")
    ].join("\n");
  }

  function mailtoFallback(data) {
    var subject = "RFQ: " + (data.product || "Steel products") + " — " + data.name;
    var href = "mailto:" + OWNER_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(buildInquiry(data));
    window.location.href = href;
    setStatus("Opening your email app so you can send the RFQ directly…", "ok");
  }

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Honeypot: if the hidden field is filled, silently "succeed" (bot trap)
    var hp = form.querySelector('input[name="website"]');
    if (hp && hp.value) {
      setStatus("Thank you! We will reply within 24 hours.", "ok");
      return;
    }

    var data = {
      name: (form.name && form.name.value || "").trim(),
      email: (form.email && form.email.value || "").trim(),
      country: (form.country && form.country.value || "").trim(),
      product: (form.product && form.product.value || "").trim(),
      quantity: (form.quantity && form.quantity.value || "").trim(),
      details: (form.details && form.details.value || "").trim(),
    };

    if (!data.name || !data.email || !data.details) {
      setStatus("Please fill in name, email and requirement details.", "err");
      return;
    }
    if (data.email.indexOf("@") < 1) {
      setStatus("Please enter a valid email address.", "err");
      return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }
    setStatus("");

    var payload = {
      name: data.name,
      email: data.email,
      country: data.country,
      product: data.product,
      quantity: data.quantity,
      details: data.details,
      page: attribution
    };

    // 15s timeout — never lose the lead
    var timedOut = false;
    var timer = setTimeout(function () { timedOut = true; }, 15000);

    fetch("/api/rfq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function () {
        if (timedOut) return;
        setStatus("Thank you! Your RFQ has been sent — we will reply within 24 hours.", "ok");
        form.reset();
      })
      .catch(function () {
        clearTimeout(timer);
        setStatus("Could not send automatically — opening your email app instead…", "err");
        mailtoFallback(data);
      })
      .then(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Send RFQ"; }
      });
  });
})();
