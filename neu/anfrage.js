(function () {
  var END_BANNER = new Date("2026-12-15T23:59:59+01:00");
  var banner = document.getElementById("season");
  if (banner && new Date() > END_BANNER) banner.hidden = true;

  var cookie = document.getElementById("cookie");
  try {
    if (localStorage.getItem("fj-neu-cookie") === "1" && cookie) cookie.hidden = true;
  } catch (e) {}
  var cookieOk = document.getElementById("cookie-ok");
  if (cookieOk) {
    cookieOk.addEventListener("click", function () {
      try { localStorage.setItem("fj-neu-cookie", "1"); } catch (e) {}
      if (cookie) cookie.hidden = true;
    });
  }

  document.querySelectorAll("[data-filter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-filter");
      document.querySelectorAll("[data-filter]").forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      document.querySelectorAll("[data-audience]").forEach(function (card) {
        var show = key === "alle" || card.getAttribute("data-audience") === key;
        card.hidden = !show;
      });
      var target = document.getElementById("pakete");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  var form = document.getElementById("anfrage");
  if (!form) return;
  var step = 1;
  var occasion = "";
  var steps = form.querySelectorAll("[data-step]");
  var priceEl = document.getElementById("richtpreis");
  var priceNote = document.getElementById("richtpreis-note");
  var done = document.getElementById("anfrage-done");

  function field(name) {
    var el = form.elements[name];
    return el ? String(el.value || "").trim() : "";
  }

  function guests() {
    var n = parseInt(field("guests"), 10);
    return isNaN(n) ? 0 : n;
  }

  function euro(n) {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0
    }).format(n);
  }

  function quote() {
    var g = guests();
    var duration = field("duration");
    var id = occasion;
    var firmaBase = { "1-3": 490, "4-5": 690, "6-8": 890 };
    var firmaDrink = { "1-3": 27, "4-5": 40, "6-8": 60 };
    var privatBase = { "1-3": 390, "4-5": 490, "6-8": 590 };

    function withDrinks(baseMap, label) {
      if (!duration || !baseMap[duration]) {
        return {
          text: "ab " + euro(baseMap["1-3"]),
          note: label + ": Grundpreis  " + euro(baseMap["1-3"]) + " / " + euro(baseMap["4-5"]) + " / " + euro(baseMap["6-8"]) + " für 1–3 / 4–5 / 6–8 Stunden, dazu Getränke 27 / 40 / 60 € pro Person. Anfahrt bis 30 km inklusive. Unverbindlicher Richtpreis."
        };
      }
      var base = baseMap[duration];
      var drink = firmaDrink[duration];
      var sum = base + (g > 0 ? drink * g : 0);
      var note = label + ": Grundpreis " + euro(base) + " (" + duration.replace("-", "–") + " Std.)";
      if (g > 0) note += " + Getränke " + g + " Personen × " + drink + " €";
      note += ". Anfahrt bis 30 km inklusive. Unverbindlicher Richtpreis, kein Angebot.";
      return { text: g > 0 ? euro(sum) : "ab " + euro(base), note: note };
    }

    if (id === "firma" || id === "messe") {
      var q = withDrinks(firmaBase, id === "messe" ? "Messe im Firmenevent-Rahmen" : "Firmenevent");
      if (id === "messe") q.note = "Ein eigenes Messe-Paket steht auf der Live-Seite nicht. " + q.note;
      return q;
    }
    if (id === "weihnachten-firma") return withDrinks(firmaBase, "Weihnachtsfeier Firma");
    if (id === "weihnachten-privat") return withDrinks(privatBase, "Weihnachtsfeier privat");
    if (id === "gluehwein") {
      if (g > 0) {
        return {
          text: euro(290 + 12 * g),
          note: "Glühwein After Work: 290 € Grundpreis inkl. Anfahrt und 1–3 Std. + " + g + " × 12 €. Mindestens 20 Personen. Unverbindlicher Richtpreis."
        };
      }
      return { text: "290 € + 12 € p. P.", note: "Mindestens 20 Personen. Anfahrt bis 30 km inklusive. Unverbindlicher Richtpreis." };
    }
    if (id === "privat" || id === "hochzeit" || id === "geburtstag") {
      return {
        text: "ab 390 €",
        note: "Privates Fest (Geburtstag, Hochzeit, Gartenparty) ab 390 € laut Startseite. Dauer und Getränke stehen dort nicht als feste Stufen – der Endpreis kommt im Angebot. Anfahrt bis 30 km inklusive."
      };
    }
    if (id === "jga") {
      return {
        text: g > 0 ? euro(190 + 15 * g) : "190 € + 15 € p. P.",
        note: "JGA: 190 € + 15 € pro Person, eine Stunde Schaumwein, Freitag bis Sonntag, ab 6 Personen. Unverbindlicher Richtpreis."
      };
    }
    if (id === "tasting") {
      return {
        text: g > 0 ? euro(55 * g) : "55 € p. P.",
        note: "Tasting: sechs Schaumweine, zwei Stunden, 55 € pro Person, 6–12 Personen. Unverbindlicher Richtpreis."
      };
    }
    if (id === "tasting-champ") {
      return {
        text: g > 0 ? euro(120 * g) : "120 € p. P.",
        note: "Champagner-Tasting: 120 € pro Person. Sechs Schaumweine mit Champagner-Upgrade, zwei Stunden, 6–12 Personen. Unverbindlicher Richtpreis."
      };
    }
    if (id === "saturdays") {
      return {
        text: g > 0 ? euro(490 + 55 * g) : "490 € + 55 € p. P.",
        note: "Saturdays: 490 € Grundpauschale + 55 € pro Person, ab 20 Personen. Unverbindlicher Richtpreis."
      };
    }
    if (id === "wagyu-17") {
      return {
        text: g > 0 ? euro(390 * g) : "390 € p. P.",
        note: "Wagyu × Champagner, Do 17.12.2026, InfoTurm Stuttgart, Champagner, 390 € pro Person. Ticketpreis laut Startseite, hier nur als Orientierung."
      };
    }
    if (id === "wagyu-18") {
      return {
        text: g > 0 ? euro(350 * g) : "350 € p. P.",
        note: "Wagyu × Champagner, Fr 18.12.2026, InfoTurm Stuttgart, Champagner & Schaumwein, 350 € pro Person. Ticketpreis laut Startseite, hier nur als Orientierung."
      };
    }
    return { text: "–", note: "Zuerst den Anlass wählen." };
  }

  function paintPrice() {
    var q = quote();
    [priceEl, document.getElementById("richtpreis-live")].forEach(function (el) {
      if (el) el.textContent = q.text;
    });
    [priceNote, document.getElementById("richtpreis-note-2")].forEach(function (el) {
      if (el) el.textContent = q.note;
    });
  }

  function showStep(n) {
    step = n;
    steps.forEach(function (el) {
      el.hidden = Number(el.getAttribute("data-step")) !== n;
    });
    form.querySelectorAll("[data-progress]").forEach(function (dot) {
      var i = Number(dot.getAttribute("data-progress"));
      dot.classList.toggle("is-on", i <= n);
    });
    paintPrice();
  }

  form.querySelectorAll("[data-occasion]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      occasion = btn.getAttribute("data-occasion");
      form.querySelectorAll("[data-occasion]").forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      var needsDuration = /firma|messe|weihnachten/.test(occasion);
      var block = document.getElementById("duration-block");
      if (block) block.hidden = !needsDuration;
      paintPrice();
    });
  });

  ["guests", "duration"].forEach(function (name) {
    var el = form.elements[name];
    if (el) el.addEventListener("input", paintPrice);
  });

  form.addEventListener("click", function (e) {
    var next = e.target.closest("[data-next]");
    var prev = e.target.closest("[data-prev]");
    if (next) {
      e.preventDefault();
      if (step === 1 && !occasion) {
        var hint = document.getElementById("occasion-hint");
        if (hint) hint.hidden = false;
        return;
      }
      if (step === 2) {
        var date = field("date");
        var g = guests();
        var err = document.getElementById("step2-hint");
        if (!date || g < 1) {
          if (err) err.hidden = false;
          return;
        }
        if (err) err.hidden = true;
      }
      showStep(step + 1);
    }
    if (prev) {
      e.preventDefault();
      showStep(Math.max(1, step - 1));
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = field("name");
    var email = field("email");
    var phone = field("phone");
    var err = document.getElementById("step3-hint");
    if (!name || !email || !phone) {
      if (err) err.hidden = false;
      return;
    }
    if (err) err.hidden = true;
    form.hidden = true;
    if (done) {
      done.hidden = false;
      done.focus();
    }
  });

  showStep(1);
})();
