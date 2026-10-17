// House of Ketty: renders the site from content.json (edited through the admin CMS).
(function () {
  "use strict";

  var content = null;
  var order = {}; // key -> { name, price, qty }

  var $ = function (sel) { return document.querySelector(sel); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function rupees(n) { return "₹" + Number(n).toLocaleString("en-IN"); }
  function hasPrice(p) { return p !== null && p !== "" && p !== undefined && !isNaN(p); }
  function get(path) {
    return path.split(".").reduce(function (o, k) { return o ? o[k] : undefined; }, content);
  }
  function icon(name, cls) {
    return '<svg class="ico ' + (cls || "") + '"><use href="#i-' + esc(name || "check") + '"/></svg>';
  }

  function waLink(text) {
    var num = String(content.site.whatsapp || "").replace(/\D/g, "");
    return "https://wa.me/" + num + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  function greeting() { return "Hi " + (content.site.name || "") + "! "; }
  function formatPhone(digits) {
    var d = String(digits || "").replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("91") === 0) return "+91 " + d.slice(2, 7) + " " + d.slice(7);
    return "+" + d;
  }

  // ---------- Rendering ----------

  function renderBindings() {
    document.querySelectorAll("[data-bind]").forEach(function (el) {
      var v = get(el.getAttribute("data-bind"));
      if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll("[data-wa]").forEach(function (a) {
      a.href = waLink(greeting() + "I'd like to order a tiffin.");
    });
    $("#phoneText").textContent = formatPhone(content.site.whatsapp);
    $("#year").textContent = new Date().getFullYear();
    $("#footerBadges").innerHTML = (content.site.badges || []).map(function (b) {
      return "<li>" + icon(/halal/i.test(b) ? "check" : "shield") + "<span>" + esc(b) + "</span></li>";
    }).join("");

    var ann = $("#announce");
    if (content.site.announcement) { ann.textContent = content.site.announcement; ann.hidden = false; }
    else ann.hidden = true;

    var firstImg = (content.tiffins || []).filter(function (t) { return t.image; }).pop();
    if (firstImg) $("#heroImg").src = firstImg.image;
  }

  function renderStory() {
    var points = (content.story && content.story.points) || [];
    $("#storyPoints").innerHTML = points.map(function (p) {
      return '<div class="point"><div class="point-ico">' + esc(p.icon) + '</div><div>' +
        "<h3>" + esc(p.title) + "</h3><p>" + esc(p.text) + "</p></div></div>";
    }).join("");
    $("#story").hidden = !(content.story && (content.story.title || content.story.text));
  }

  function stepperHtml(key) {
    var qty = order[key] ? order[key].qty : 0;
    if (!qty) return '<button class="btn btn-sm add-btn" data-add="' + key + '" type="button">+ Add to order</button>';
    return '<div class="stepper"><button type="button" data-dec="' + key + '" aria-label="Remove one">−</button>' +
      "<output>" + qty + '</output><button type="button" data-inc="' + key + '" aria-label="Add one">+</button></div>';
  }

  function renderSpecials() {
    var list = (content.specials || []).filter(function (s) { return s.available !== false && s.name; });
    $("#specialsSection").hidden = list.length === 0;
    $("#specials").innerHTML = list.map(function (s) {
      var i = content.specials.indexOf(s);
      var key = "s" + i;
      var foot = hasPrice(s.price)
        ? stepperHtml(key)
        : '<a class="btn btn-sm btn-wa" target="_blank" rel="noopener" href="' +
          esc(waLink(greeting() + "What's today's " + s.name + "? I'd like to order.")) + '">' + icon("whatsapp") + "Ask on WhatsApp</a>";
      return '<article class="card red">' +
        '<div class="card-head"><h3 class="brush brush-red">' + esc(s.name) + "</h3>" +
        (hasPrice(s.price) ? '<span class="price-badge">' + rupees(s.price) + "</span>" : "") + "</div>" +
        '<div class="card-body' + (s.image ? "" : " noimg") + '">' +
        '<p class="card-desc">' + esc(s.description) + "</p>" +
        (s.image ? '<img class="card-img" loading="lazy" src="' + esc(s.image) + '" alt="' + esc(s.name) + '">' : "") +
        "</div>" +
        '<div class="card-foot"><span></span><span data-slot="' + key + '">' + foot + "</span></div></article>";
    }).join("");
  }

  function renderTiffins() {
    $("#tiffins").innerHTML = (content.tiffins || []).map(function (t, i) {
      var key = "t" + i;
      var red = t.theme === "red";
      var soldOut = t.available === false;
      return '<article class="card' + (red ? " red" : "") + (soldOut ? " soldout" : "") + '">' +
        '<div class="card-head"><h3 class="brush ' + (red ? "brush-red" : "brush-green") + '">' + esc(t.name) + "</h3></div>" +
        '<div class="card-body' + (t.image ? "" : " noimg") + '">' +
        '<div><span class="price-badge">' + rupees(t.price) + "</span>" +
        '<ul class="items" style="margin-top:12px">' + (t.items || []).map(function (it) { return "<li>" + esc(it) + "</li>"; }).join("") + "</ul></div>" +
        (t.image ? '<img class="card-img" loading="lazy" src="' + esc(t.image) + '" alt="' + esc(t.name) + '">' : "") +
        "</div>" +
        '<div class="card-foot"><span>' + (soldOut ? '<span class="tag-soldout">Not available today</span>' : "") + "</span>" +
        (soldOut ? "" : '<span data-slot="' + key + '">' + stepperHtml(key) + "</span>") + "</div></article>";
    }).join("");
  }

  function renderPlans() {
    $("#plansList").innerHTML = (content.plans || []).map(function (p) {
      var red = p.theme === "red";
      return '<div class="plan' + (red ? " red" : "") + '">' +
        '<div class="plan-head">' + icon(red ? "star" : "leaf") + esc(p.name) + "</div>" +
        '<ul class="plan-rows">' + (p.rows || []).map(function (r) {
          var msg = greeting() + "I'd like to book the monthly " + p.name + " plan, " + r.label + " (" + rupees(r.price) + "/month). Please share the details.";
          return '<li class="plan-row"><span class="label">' + esc(r.label) + "</span>" +
            '<span class="amt">' + rupees(r.price) + "<small>/month</small></span>" +
            '<a class="book-btn" target="_blank" rel="noopener" href="' + esc(waLink(msg)) + '">Book</a></li>';
        }).join("") + "</ul></div>";
    }).join("");
  }

  function renderAddons() {
    $("#addons").innerHTML = (content.addons || []).filter(function (a) { return a.available !== false; }).map(function (a) {
      var i = content.addons.indexOf(a);
      var key = "a" + i;
      var right = hasPrice(a.price)
        ? '<span class="amt">' + rupees(a.price) + '</span><span data-slot="' + key + '">' + addonStepper(key) + "</span>"
        : '<span class="demand">On demand</span><a class="ask-link" target="_blank" rel="noopener" href="' +
          esc(waLink(greeting() + "I'd like to know about " + a.name + ".")) + '">Ask</a>';
      return '<li class="addon"><span class="emoji">' + esc(a.icon) + '</span><span class="name">' + esc(a.name) + "</span>" + right + "</li>";
    }).join("");
  }

  function addonStepper(key) {
    var qty = order[key] ? order[key].qty : 0;
    if (!qty) return '<button class="addon-add" type="button" data-add="' + key + '" aria-label="Add">+</button>';
    return '<div class="stepper"><button type="button" data-dec="' + key + '" aria-label="Remove one">−</button>' +
      "<output>" + qty + '</output><button type="button" data-inc="' + key + '" aria-label="Add one">+</button></div>';
  }

  function renderService() {
    $("#service").innerHTML = (content.service || []).map(function (s) {
      return "<li>" + icon(s.icon) + "<span>" + esc(s.text) + "</span></li>";
    }).join("");
  }

  // ---------- Order basket ----------

  function lookup(key) {
    var type = key[0], i = Number(key.slice(1));
    var src = type === "t" ? content.tiffins : type === "a" ? content.addons : content.specials;
    return src[i];
  }

  function changeQty(key, delta) {
    var item = lookup(key);
    if (!item) return;
    var cur = order[key] ? order[key].qty : 0;
    var next = Math.max(0, cur + delta);
    if (next === 0) delete order[key];
    else order[key] = { name: item.name, price: Number(item.price), qty: next };
    var slot = document.querySelector('[data-slot="' + key + '"]');
    if (slot) slot.innerHTML = key[0] === "a" ? addonStepper(key) : stepperHtml(key);
    updateOrderBar();
  }

  function updateOrderBar() {
    var keys = Object.keys(order);
    var count = 0, total = 0, lines = [];
    keys.forEach(function (k) {
      var o = order[k];
      count += o.qty;
      total += o.qty * o.price;
      lines.push("• " + o.qty + " × " + o.name + " (" + rupees(o.qty * o.price) + ")");
    });
    var bar = $("#orderbar");
    bar.hidden = count === 0;
    document.body.classList.toggle("has-order", count > 0);
    $("#orderCount").textContent = count + (count === 1 ? " item" : " items");
    $("#orderTotal").textContent = rupees(total);
    var msg = greeting() + "I'd like to order:\n" + lines.join("\n") +
      "\n\nTotal: " + rupees(total) + "\n\nName:\nAddress:\nLunch or Dinner:";
    $("#orderSend").href = waLink(msg);
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-add],[data-inc],[data-dec]");
    if (!t) return;
    var key = t.getAttribute("data-add") || t.getAttribute("data-inc") || t.getAttribute("data-dec");
    changeQty(key, t.hasAttribute("data-dec") ? -1 : 1);
  });
  $("#orderClear").addEventListener("click", function () {
    Object.keys(order).forEach(function (k) { delete order[k]; });
    renderAll();
  });

  function renderAll() {
    renderBindings();
    renderStory();
    renderSpecials();
    renderTiffins();
    renderPlans();
    renderAddons();
    renderService();
    updateOrderBar();
  }

  fetch("content.json?v=" + Date.now(), { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) { content = data; renderAll(); })
    .catch(function () {
      document.querySelectorAll("[data-wa]").forEach(function (a) { a.href = "https://wa.me/919211685735"; });
      $("#tiffins").innerHTML = '<p class="loading">Menu could not load. Please message us on WhatsApp to order.</p>';
    });
})();
