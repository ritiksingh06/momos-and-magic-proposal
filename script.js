const sceneIds = ["scene-1", "scene-2", "scene-3", "scene-4", "scene-5", "scene-6", "scene-7"];
const app = document.getElementById("app");
const toast = document.getElementById("toast");
const vineGrow = document.getElementById("vine-grow");
const markers = Array.from(document.querySelectorAll(".marker"));
const starfield = document.getElementById("starfield");
const heartfield = document.getElementById("heartfield");
const firefliesLayer = document.getElementById("fireflies");
const particleLayer = document.getElementById("particle-layer");
const clickLogKey = "puiClickLogs";
const remoteLogEndpoint = window.SORRY_CARD_LOG_ENDPOINT || "";
const ipGeoEndpoint = window.SORRY_CARD_IP_GEO_ENDPOINT || "https://ipwho.is/";

let currentScene = 1;
let noPressCount = 0;
let easterCount = 0;
let musicOn = false;
let lastNoEscapeAt = 0;
let gussaProgress = 0;
let gussaTapCount = 0;
const gussaSteps = [20, 40, 60, 80, 100];
let locationContextPromise;
const locationContextTTLms = 1000; // 1 second

const landingLines = [
  "heyy Ishy pishy, angelbabyyy...",
  "Can I steal just two minutes?",
  "I made something only for you ❤"
];

const apologyLines = [
  "I know I hurt you, and I am truly sorry. sachhi mein!!!",
  "I promise I'll be better for you 🥺",
  "You deserve kindness, patience, and sweetness from me.",
  "I am trying to grow, not just say words."
];

const memoryMessages = [
  "You made ordinary days feel special.",
  "You taught me patience.",
  "I still smile remembering our conversations.",
  "Some memories still feel warm."
];

const playfulNoMessages = [
  "Oops... pakad ke dikhao 😝",
  "Ek baar aur soch lo... 🥺",
  "Bas ek aur chance? 🌸",
  "Andi mandi shandi... 😏",
];

const cuteTrailEmojis = ["🐻", "🐱", "🐰", "❤️", "✨", "🌸"];

const openStoryBtn = document.getElementById("open-story");
const envelopeCard = document.getElementById("envelope-card");
const landingType = document.getElementById("landing-type");
const stickyNote = document.getElementById("sticky-note");
const stickyPrompt = document.getElementById("sticky-prompt");
const angerQuestion = document.getElementById("anger-question");
const angerChoices = document.getElementById("anger-choices");
const apologyActions = document.getElementById("apology-actions");
const nextLineBtn = document.getElementById("next-line");
const apologyLineEl = document.getElementById("apology-line");
const gardenEl = document.getElementById("memory-garden");
const intermissionBtn = document.getElementById("to-intermission");
const gussaTapBtn = document.getElementById("gussa-tap");
const gussaMeterFill = document.getElementById("gussa-meter-fill");
const gussaMeterText = document.getElementById("gussa-meter-text");
const gussaResult = document.getElementById("gussa-result");
const proposalBtn = document.getElementById("to-proposal");
const proposalRevealBtn = document.getElementById("proposal-reveal");
const proposalType = document.getElementById("proposal-type");
const proposalQuestion = document.getElementById("proposal-question");
const proposalActions = document.getElementById("proposal-actions");
const proposalCard = document.querySelector(".proposal-card");
const yesMoment = document.getElementById("yes-moment");
const shareBtn = document.getElementById("share-btn");
const yesBtn = document.getElementById("yes-btn");
const noBtn = document.getElementById("no-btn");
const musicToggle = document.getElementById("music-toggle");

function getClickLogs() {
  try {
    return JSON.parse(localStorage.getItem(clickLogKey)) || [];
  } catch {
    return [];
  }
}

function getStoredLocationContext() {
  try {
    const stored = JSON.parse(sessionStorage.getItem("puiLocationContext")) || null;
    if (!stored || !stored._capturedAt) {
      return null;
    }

    if (Date.now() - stored._capturedAt > locationContextTTLms) {
      return null;
    }

    return stored;
  } catch {
    return null;
  }
}

function storeLocationContext(context) {
  try {
    sessionStorage.setItem("puiLocationContext", JSON.stringify({
      ...context,
      _capturedAt: Date.now()
    }));
  } catch {
    console.warn("[p-ui logger] Location context cache failed");
  }
}

function resetLocationContextCache() {
  locationContextPromise = null;
  try {
    sessionStorage.removeItem("puiLocationContext");
  } catch {
    console.warn("[p-ui logger] Location context reset failed");
  }
}

function getGeoPermissionState() {
  if (!navigator.permissions || !navigator.permissions.query) {
    return Promise.resolve("unsupported");
  }

  return navigator.permissions
    .query({ name: "geolocation" })
    .then((result) => result.state)
    .catch(() => "unsupported");
}

function fetchApproximateIpLocation(permissionState) {
  const regionCodeMap = {
    "delhi": "DL",
    "national capital territory of delhi": "DL",
    "maharashtra": "MH",
    "karnataka": "KA",
    "tamil nadu": "TN",
    "telangana": "TG",
    "andhra pradesh": "AP",
    "uttar pradesh": "UP",
    "gujarat": "GJ",
    "west bengal": "WB",
    "rajasthan": "RJ",
    "haryana": "HR",
    "punjab": "PB",
    "madhya pradesh": "MP",
    "bihar": "BR",
    "odisha": "OR",
    "kerala": "KL",
    "assam": "AS",
    "jammu and kashmir": "JK",
    "himachal pradesh": "HP",
    "uttarakhand": "UT",
    "jharkhand": "JH",
    "chhattisgarh": "CT",
    "goa": "GA"
  };

  // Try ipinfo.io first for much better Indian ISP/pincode mapping accuracy
  return fetch("https://ipinfo.io/json", {
    method: "GET",
    cache: "no-store"
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error("ipinfo_failed");
      }
      return res.json();
    })
    .then((data) => {
      const loc = (data.loc || "").split(",");
      const latitude = loc[0] || "";
      const longitude = loc[1] || "";
      const normalizedRegion = (data.region || "").toLowerCase().trim();
      const derivedRegionCode = regionCodeMap[normalizedRegion] || "";

      return {
        locationSource: permissionState === "denied" ? "ipinfo_after_geo_denied" : "ipinfo_lookup",
        geolocationPermission: permissionState,
        ipAddress: data.ip || "",
        ipType: (data.ip || "").includes(":") ? "IPv6" : "IPv4",
        ipCity: data.city || "",
        ipRegion: data.region || "",
        ipRegionCode: derivedRegionCode,
        ipCountry: data.country || "",
        ipCountryCode: data.country || "",
        ipContinent: "",
        ipPostal: data.postal || "",
        ipLatitude: Number(latitude) || "",
        ipLongitude: Number(longitude) || "",
        ipTimezone: data.timezone || "",
        ipFlag: "",
        ipConnectionOrg: data.org || "",
        ipConnectionIsp: data.org || "",
        ipLookupSuccess: "true"
      };
    })
    .catch(() => {
      // Fallback to original ipwho.is if ipinfo.io is rate-limited or fails
      return fetch(ipGeoEndpoint, {
        method: "GET",
        cache: "no-store"
      })
        .then((response) => response.json())
        .then((data) => ({
          locationSource: permissionState === "denied" ? "ip_fallback_after_geo_denied" : "ip_lookup",
          geolocationPermission: permissionState,
          ipAddress: data.ip || "",
          ipType: data.type || "",
          ipCity: data.city || "",
          ipRegion: data.region || "",
          ipRegionCode: data.region_code || "",
          ipCountry: data.country || "",
          ipCountryCode: data.country_code || "",
          ipContinent: data.continent || "",
          ipPostal: data.postal || "",
          ipLatitude: data.latitude || "",
          ipLongitude: data.longitude || "",
          ipTimezone: data.timezone && data.timezone.id ? data.timezone.id : "",
          ipFlag: data.flag && data.flag.emoji ? data.flag.emoji : "",
          ipConnectionOrg: data.connection && data.connection.org ? data.connection.org : "",
          ipConnectionIsp: data.connection && data.connection.isp ? data.connection.isp : "",
          ipLookupSuccess: data.success === true ? "true" : "false"
        }))
        .catch(() => ({
          locationSource: "all_ip_lookups_failed",
          geolocationPermission: permissionState,
          ipLookupSuccess: "false"
        }));
    });
}

function fetchReverseGeocode(latitude, longitude) {
  // Nominatim (OpenStreetMap) is significantly more accurate for Indian
  // locality-level postcodes than bigdatacloud which returns city centroids
  const nominatim = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&format=json&addressdetails=1&accept-language=en`;

  return fetch(nominatim, {
    method: "GET",
    cache: "no-store",
    headers: {
      "User-Agent": "momos-and-magic-proposal/1.0"
    }
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error("nominatim_failed");
      }
      return res.json();
    })
    .then((data) => {
      const addr = data.address || {};
      return {
        postcode: addr.postcode || "",
        city: addr.suburb || addr.town || addr.village || addr.city_district || addr.city || "",
        locality: addr.suburb || addr.neighbourhood || addr.quarter || "",
        principalSubdivision: addr.state || "",
        principalSubdivisionCode: "",
        countryName: addr.country || "",
        countryCode: addr.country_code ? addr.country_code.toUpperCase() : "",
        continent: ""
      };
    })
    .catch(() => {
      // Fallback to bigdatacloud if Nominatim fails
      const fallback = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&localityLanguage=en`;

      return fetch(fallback, {
        method: "GET",
        cache: "no-store"
      })
        .then((res) => res.json())
        .then((data) => ({
          postcode: data.postcode || "",
          city: data.city || data.locality || data.principalSubdivision || "",
          locality: data.locality || "",
          principalSubdivision: data.principalSubdivision || "",
          principalSubdivisionCode: data.principalSubdivisionCode || "",
          countryName: data.countryName || "",
          countryCode: data.countryCode || "",
          continent: data.continent || ""
        }))
        .catch(() => ({}));
    });
}

function fetchBrowserGeolocation(permissionState) {
  if (!navigator.geolocation || !navigator.geolocation.getCurrentPosition) {
    return Promise.reject(new Error("geolocation_unavailable"));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

          // Run reverse geocode and IP lookup in parallel so we get both
          // GPS-accurate location AND real IP/ISP/postal data
          const [reverse, ipData] = await Promise.all([
            fetchReverseGeocode(latitude, longitude),
            fetch("https://ipinfo.io/json", { method: "GET", cache: "no-store" })
              .then((r) => r.json())
              .catch(() => ({}))
          ]);

          const ipLoc = (ipData.loc || "").split(",");
          const normalizedRegion = (ipData.region || "").toLowerCase().trim();
          const regionCodeMap = {
            "delhi": "DL", "national capital territory of delhi": "DL",
            "maharashtra": "MH", "karnataka": "KA", "tamil nadu": "TN",
            "telangana": "TG", "andhra pradesh": "AP", "uttar pradesh": "UP",
            "gujarat": "GJ", "west bengal": "WB", "rajasthan": "RJ",
            "haryana": "HR", "punjab": "PB", "madhya pradesh": "MP",
            "bihar": "BR", "odisha": "OR", "kerala": "KL", "assam": "AS",
            "jammu and kashmir": "JK", "himachal pradesh": "HP",
            "uttarakhand": "UT", "jharkhand": "JH", "chhattisgarh": "CT", "goa": "GA"
          };

          resolve({
            locationSource: "browser_geolocation",
            geolocationPermission: permissionState,
            // IP info from ipinfo.io
            ipAddress: ipData.ip || "",
            ipType: (ipData.ip || "").includes(":") ? "IPv6" : "IPv4",
            ipConnectionOrg: ipData.org || "",
            ipConnectionIsp: ipData.org || "",
            // Location from GPS + reverse geocode (most accurate)
            ipCity: reverse.city || reverse.locality || ipData.city || "",
            ipRegion: reverse.principalSubdivision || ipData.region || "",
            ipRegionCode: reverse.principalSubdivisionCode || regionCodeMap[normalizedRegion] || "",
            ipCountry: reverse.countryName || ipData.country || "",
            ipCountryCode: reverse.countryCode || ipData.country || "",
            ipContinent: reverse.continent || "",
            // GPS postal first, IP postal as fallback
            ipPostal: reverse.postcode || ipData.postal || "",
            ipLatitude: latitude,
            ipLongitude: longitude,
            ipTimezone: timezone || ipData.timezone || "",
            ipFlag: "",
            ipLookupSuccess: "true"
          });
        } catch {
          reject(new Error("reverse_geocode_failed"));
        }
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    );
  });
}

function getLocationContext() {
  if (locationContextPromise) {
    return locationContextPromise;
  }

  const storedContext = getStoredLocationContext();
  if (storedContext) {
    locationContextPromise = Promise.resolve(storedContext);
    return locationContextPromise;
  }

  locationContextPromise = getGeoPermissionState()
    .then((permissionState) => {
      if (permissionState === "granted" || permissionState === "prompt") {
        return fetchBrowserGeolocation(permissionState)
          .catch(() => fetchApproximateIpLocation(permissionState));
      }

      return fetchApproximateIpLocation(permissionState);
    })
    .then((context) => {
      storeLocationContext(context);
      return context;
    });

  return locationContextPromise;
}

function logClick(action) {
  const baseEntry = {
    action,
    timestamp: new Date().toISOString(),
    readableTime: new Date().toLocaleString(),
    pageUrl: window.location.href,
    referrer: document.referrer,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    userAgent: navigator.userAgent
  };

  getLocationContext().then((locationContext) => {
    const entry = {
      ...baseEntry,
      ...locationContext
    };

    const logs = [...getClickLogs(), entry];
    localStorage.setItem(clickLogKey, JSON.stringify(logs));
    window.puiClickLogs = logs;

    if (remoteLogEndpoint) {
      try {
        fetch(remoteLogEndpoint, {
          method: "POST",
          mode: "no-cors",
          keepalive: true,
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(entry)
        }).catch(() => {
          console.warn("[p-ui logger] Remote log failed");
        });
      } catch {
        console.warn("[p-ui logger] Remote log failed");
      }
    }
  });
}

function setScene(step) {
  currentScene = step;
  sceneIds.forEach((id, index) => {
    const scene = document.getElementById(id);
    scene.classList.toggle("active", index + 1 === step);
  });

  app.className = `scene-stage scene-${Math.min(step, 7)}`;
  document.body.setAttribute("data-scene", String(Math.min(step, 7)));
  const progressPercent = Math.min(100, 5 + (step - 1) * 15);
  vineGrow.style.width = `${progressPercent}%`;

  markers.forEach((marker, index) => {
    marker.classList.toggle("active", index < Math.min(step, markers.length));
  });
}

function typeLines(el, lines, speed = 42, gap = 700) {
  let lineIndex = 0;
  let charIndex = 0;

  return new Promise((resolve) => {
    function draw() {
      if (lineIndex >= lines.length) {
        resolve();
        return;
      }

      const currentLine = lines[lineIndex];
      if (charIndex <= currentLine.length) {
        const previous = lines.slice(0, lineIndex).map((l) => `"${l}"`).join("<br>");
        const now = `"${currentLine.slice(0, charIndex)}"`;
        el.innerHTML = previous ? `${previous}<br>${now}` : now;
        charIndex += 1;
        setTimeout(draw, speed);
      } else {
        lineIndex += 1;
        charIndex = 0;
        setTimeout(draw, gap);
      }
    }

    draw();
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  const ttl = 2000 + Math.floor(Math.random() * 1000);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, ttl);
}

function burstHearts(x, y) {
  for (let i = 0; i < 12; i += 1) {
    const spark = document.createElement("span");
    spark.className = "spark";
    const angle = (Math.PI * 2 * i) / 12;
    const distance = 20 + Math.random() * 40;
    spark.style.left = `${x + Math.cos(angle) * distance}px`;
    spark.style.top = `${y + Math.sin(angle) * distance}px`;
    particleLayer.appendChild(spark);
    setTimeout(() => spark.remove(), 760);
  }
}

function burstBigLove(x, y) {
  const hearts = ["❤", "💖", "💗", "✨", "🌸", "⭐"];
  for (let i = 0; i < 24; i += 1) {
    const spark = document.createElement("span");
    spark.className = "escape-trail";
    spark.textContent = hearts[i % hearts.length];
    const angle = (Math.PI * 2 * i) / 24;
    const distance = 24 + Math.random() * 90;
    spark.style.left = `${x + Math.cos(angle) * distance}px`;
    spark.style.top = `${y + Math.sin(angle) * distance}px`;
    spark.style.animationDuration = `${700 + Math.random() * 400}ms`;
    particleLayer.appendChild(spark);
    setTimeout(() => spark.remove(), 1200);
  }

  burstHearts(x, y);
}

function popEscapeSound() {
  if (!window.AudioContext) {
    return;
  }

  if (!popEscapeSound.ctx) {
    popEscapeSound.ctx = new AudioContext();
  }

  const ctx = popEscapeSound.ctx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(780, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.11);
}

function emitTrailEmoji(x, y) {
  const trail = document.createElement("span");
  trail.className = "escape-trail";
  trail.textContent = cuteTrailEmojis[Math.floor(Math.random() * cuteTrailEmojis.length)];
  trail.style.left = `${x}px`;
  trail.style.top = `${y}px`;
  particleLayer.appendChild(trail);
  setTimeout(() => trail.remove(), 920);
}

function emitButtonSparkles(x, y) {
  const glyphs = ["🌸", "🌷", "✨", "💫", "💕", "🌼", "💖"];
  for (let index = 0; index < 22; index += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "btn-sparkle";
    sparkle.textContent = glyphs[index % glyphs.length];
    const angle = (Math.PI * 2 * index) / 22;
    const spread = 50 + Math.random() * 120;
    const driftX = Math.cos(angle) * spread;
    const driftY = Math.sin(angle) * spread - (70 + Math.random() * 70);
    const originX = x + (Math.random() - 0.5) * 40;
    const originY = y + (Math.random() - 0.5) * 18;
    sparkle.style.setProperty("--dx", `${driftX}px`);
    sparkle.style.setProperty("--dy", `${driftY}px`);
    sparkle.style.left = `${originX}px`;
    sparkle.style.top = `${originY}px`;
    sparkle.style.fontSize = `${1 + Math.random() * 0.7}rem`;
    sparkle.style.animationDelay = `${Math.random() * 0.12}s`;
    particleLayer.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 1300);
  }

  for (let index = 0; index < 12; index += 1) {
    const shower = document.createElement("span");
    shower.className = "btn-sparkle shower";
    shower.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    shower.style.left = `${Math.random() * window.innerWidth}px`;
    shower.style.top = `${-20 - Math.random() * 60}px`;
    shower.style.setProperty("--dx", `${-30 + Math.random() * 60}px`);
    shower.style.setProperty("--dy", `${180 + Math.random() * 180}px`);
    shower.style.fontSize = `${0.95 + Math.random() * 0.9}rem`;
    shower.style.animationDelay = `${Math.random() * 0.18}s`;
    particleLayer.appendChild(shower);
    setTimeout(() => shower.remove(), 1600);
  }
}

function resetNoButtonToOrigin() {
  noBtn.classList.remove("no-bounce", "no-wiggle");
  noBtn.style.position = "absolute";
  noBtn.style.left = "65%";
  noBtn.style.top = "50%";
  noBtn.style.transform = "translate(-50%, -50%) scale(1) rotate(0deg)";
  noBtn.setAttribute("aria-disabled", "true");
  noBtn.tabIndex = -1;
}

function resetProposalScene() {
  proposalCard.classList.remove("celebrating");
  proposalRevealBtn.classList.remove("hidden");
  proposalType.textContent = "";
  proposalQuestion.textContent = "";
  proposalActions.classList.add("hidden");
  yesMoment.classList.add("hidden");
  resetNoButtonToOrigin();
}

function resetGussaScene() {
  gussaProgress = 0;
  gussaTapCount = 0;
  gussaMeterFill.style.width = "0%";
  gussaMeterText.textContent = "0%";
  gussaResult.classList.add("hidden");
  gussaTapBtn.disabled = false;
  gussaTapBtn.textContent = "💖 Tap Tap";
}

function completeGussaMeter() {
  gussaResult.classList.remove("hidden");
  gussaTapBtn.disabled = true;
  gussaTapBtn.textContent = "Forgiven 💕";
  showToast("You're forgiven 💕");
  emitButtonSparkles(window.innerWidth / 2, window.innerHeight / 2);
  burstBigLove(window.innerWidth / 2, window.innerHeight / 2);
  setTimeout(() => setScene(6), 1400);
}

function advanceGussaMeter() {
  if (gussaProgress >= 100) {
    return;
  }

  gussaProgress = gussaSteps[Math.min(gussaTapCount, gussaSteps.length - 1)];
  gussaTapCount += 1;
  gussaMeterFill.style.width = `${gussaProgress}%`;
  gussaMeterText.textContent = `${gussaProgress}%`;

  if (gussaProgress >= 100) {
    completeGussaMeter();
  }
}

function createBackground() {
  for (let i = 0; i < 80; i += 1) {
    const star = document.createElement("span");
    star.className = "star";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.setProperty("--d", `${2 + Math.random() * 4}s`);
    starfield.appendChild(star);
  }

  for (let i = 0; i < 22; i += 1) {
    const heart = document.createElement("span");
    heart.className = "float-heart";
    heart.textContent = Math.random() > 0.5 ? "❤" : "♡";
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.fontSize = `${12 + Math.random() * 16}px`;
    heart.style.setProperty("--d", `${8 + Math.random() * 10}s`);
    heart.style.animationDelay = `${Math.random() * 8}s`;
    heartfield.appendChild(heart);
  }

  for (let i = 0; i < 3; i += 1) {
    const fly = document.createElement("span");
    fly.className = "fly";
    fly.style.left = `${30 + i * 12}%`;
    fly.style.top = `${35 + i * 9}%`;
    firefliesLayer.appendChild(fly);
  }

  const butterflies = ["🦋", "🧚", "🦋", "🌟"];
  butterflies.forEach((emoji, idx) => {
    const b = document.createElement("span");
    b.className = "butterfly";
    b.textContent = emoji;
    b.style.left = `${10 + idx * 22}%`;
    b.style.top = `${15 + (idx % 2) * 45}%`;
    b.style.animationDelay = `${idx * 0.9}s`;
    firefliesLayer.appendChild(b);
  });
}

function initGarden() {
  memoryMessages.forEach((message, index) => {
    const flower = document.createElement("button");
    flower.className = "flower";
    flower.type = "button";

    const icons = ["🌸", "🌷", "🌹", "🌼"];
    flower.innerHTML = `<span class="petal">${icons[index % icons.length]}</span><span class="msg">${message}</span>`;

    flower.addEventListener("click", () => {
      logClick(`memory flower tapped: ${message}`);
      if (flower.classList.contains("bloom")) {
        return;
      }

      flower.classList.add("bloom");
      const rect = flower.getBoundingClientRect();
      burstHearts(rect.left + rect.width / 2, rect.top + rect.height / 2);

      const bloomed = document.querySelectorAll(".flower.bloom").length;
      if (bloomed === memoryMessages.length) {
        intermissionBtn.classList.remove("hidden");
      }
    });

    gardenEl.appendChild(flower);
  });
}

function runApologyScene() {
  apologyActions.innerHTML = "";
  apologyLineEl.textContent = "";
  nextLineBtn.classList.add("hidden");

  const randomPool = [...apologyLines].sort(() => Math.random() - 0.5).slice(0, 4);
  let revealedCount = 0;

  randomPool.forEach((line, index) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "note-chip";
    chip.textContent = `Open note ${index + 1} ✨`;

    chip.addEventListener("click", () => {
      logClick(`apology note opened: ${index + 1}`);
      chip.classList.add("done");
      let c = 0;
      const typer = setInterval(() => {
        apologyLineEl.textContent = line.slice(0, c);
        c += 1;
        if (c > line.length) {
          clearInterval(typer);
        }
      }, 24);

      revealedCount += 1;
      if (revealedCount === randomPool.length) {
        nextLineBtn.classList.remove("hidden");
      }
    }, { once: true });

    apologyActions.appendChild(chip);
  });

  nextLineBtn.textContent = "Go to Memory Garden";
  nextLineBtn.onclick = () => {
    logClick("apology continue clicked");
    setScene(4);
  };
}

function moveNoButton() {
  const areaRect = proposalActions.getBoundingClientRect();
  const yesRect = yesBtn.getBoundingClientRect();
  const noRect = noBtn.getBoundingClientRect();

  const startX = noRect.left + noRect.width / 2;
  const startY = noRect.top + noRect.height / 2;

  const yesCenterX = yesRect.left - areaRect.left + yesRect.width / 2;
  const yesCenterY = yesRect.top - areaRect.top + yesRect.height / 2;

  const margin = 10;
  const yesHalfWidth = yesRect.width / 2;
  const yesHalfHeight = yesRect.height / 2;
  const noHalfWidth = noRect.width / 2;
  const noHalfHeight = noRect.height / 2;
  const minRadiusX = yesHalfWidth + noHalfWidth + 26;
  const minRadiusY = yesHalfHeight + noHalfHeight + 18;
  const maxRadiusX = Math.max(minRadiusX + 10, Math.min(150, areaRect.width / 2 - noHalfWidth - margin));
  const maxRadiusY = Math.max(minRadiusY + 8, Math.min(92, areaRect.height / 2 - noHalfHeight - margin));

  let targetX = yesCenterX;
  let targetY = yesCenterY;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radiusX = minRadiusX + Math.random() * Math.max(12, maxRadiusX - minRadiusX);
    const radiusY = minRadiusY + Math.random() * Math.max(10, maxRadiusY - minRadiusY);

    const candidateX = yesCenterX + Math.cos(angle) * radiusX;
    const candidateY = yesCenterY + Math.sin(angle) * radiusY;
    const clampedX = Math.max(margin + noHalfWidth, Math.min(areaRect.width - margin - noHalfWidth, candidateX));
    const clampedY = Math.max(margin + noHalfHeight, Math.min(areaRect.height - margin - noHalfHeight, candidateY));

    const separatedX = Math.abs(clampedX - yesCenterX) >= minRadiusX * 0.88;
    const separatedY = Math.abs(clampedY - yesCenterY) >= minRadiusY * 0.72;

    if (separatedX || separatedY) {
      targetX = clampedX;
      targetY = clampedY;
      break;
    }
  }

  const rotate = -20 + Math.random() * 40;
  const scale = Math.random() < 0.25 ? 0.78 + Math.random() * 0.12 : 0.9 + Math.random() * 0.15;
  const durationMs = 300 + Math.floor(Math.random() * 201);

  noBtn.classList.remove("no-bounce", "no-wiggle");
  void noBtn.offsetWidth;

  noBtn.style.position = "absolute";
  noBtn.style.transition = `transform ${durationMs}ms cubic-bezier(0.2, 0.8, 0.2, 1), left ${durationMs}ms cubic-bezier(0.2, 0.8, 0.2, 1), top ${durationMs}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
  noBtn.style.left = `${targetX}px`;
  noBtn.style.top = `${targetY}px`;
  noBtn.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`;

  emitTrailEmoji(startX, startY);
  burstHearts(startX, startY);

  setTimeout(() => {
    noBtn.classList.add("no-bounce");
    if (Math.random() < 0.38) {
      noBtn.classList.add("no-wiggle");
      setTimeout(() => noBtn.classList.remove("no-wiggle"), 520);
    }

    const currentRect = noBtn.getBoundingClientRect();
    const endX = currentRect.left + currentRect.width / 2;
    const endY = currentRect.top + currentRect.height / 2;
    emitTrailEmoji(endX, endY);
  }, durationMs + 20);
}

function randomNoMessage() {
  return playfulNoMessages[noPressCount % playfulNoMessages.length];
}

function handleNoAttempt(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (currentScene !== 7 || proposalActions.classList.contains("hidden")) {
    return;
  }

  const now = Date.now();
  if (now - lastNoEscapeAt < 300) {
    return;
  }

  lastNoEscapeAt = now;
  const trigger = event ? (event.type || "unknown") : "proximity";
  logClick(`no button escaped (${trigger}) - attempt ${noPressCount + 1}`);
  showToast(randomNoMessage());
  noPressCount += 1;
  moveNoButton();
  popEscapeSound();
}

function maybeEscapeFromCursor(event) {
  if (currentScene !== 7 || proposalActions.classList.contains("hidden")) {
    return;
  }

  const rect = noBtn.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = event.clientX - cx;
  const dy = event.clientY - cy;
  const dist = Math.hypot(dx, dy);

  // Proximity threshold of 85 pixels
  if (dist < 85) {
    handleNoAttempt();
  }
}

function generateAndSharePeaceTreaty() {
  // Generate a custom Peace Treaty card as canvas image
  const canvas = document.createElement("canvas");
  const isMobileShare = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);
  const dpr = Math.min(window.devicePixelRatio || 1, isMobileShare ? 1.35 : 2);
  const width = 1080 * dpr;
  const height = 1350 * dpr;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Fill background with soft gradient (cream to blush pink)
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#FBF8F3");  // Cream
  gradient.addColorStop(1, "#FFE8E0");  // Blush pink
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Helper: Draw text with scaling
  const drawText = (text, x, y, fontSize, fontFamily, color, align = "center", weight = "400") => {
    ctx.font = `${weight} ${fontSize * dpr}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x * dpr, y * dpr);
  };

  // Helper: Draw decorative element (heart, sparkle)
  const drawDecor = (emoji, x, y, size) => {
    ctx.font = `${size * dpr}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, x * dpr, y * dpr);
  };

  // Title with emoji
  drawDecor("🕊️", 540, 80, 60);
  drawText("Peace Treaty", 540, 160, 48, "Georgia", "#8B4C5C", "center", "700");

  // Subtitle
  drawText("Treaty for New Beginnings", 540, 220, 24, "Georgia", "#C17A8C", "center", "500");
  drawText("Effective Immediately", 540, 260, 18, "Courier New", "#9B6B7C");

  // Decorative line
  ctx.strokeStyle = "#D4A5B4";
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  ctx.moveTo(150 * dpr, 300 * dpr);
  ctx.lineTo(930 * dpr, 300 * dpr);
  ctx.stroke();

  // Main text
  const mainText = `After careful consideration, excessive smiling,
and overwhelming evidence of genuine love...`;
  let yPos = 360;
  mainText.split("\n").forEach((line) => {
    drawText(line, 540, yPos, 16, "Georgia", "#5C3D47", "center");
    yPos += 40;
  });

  // Agreement preamble
  drawText("I, Ishita Jaiswal, hereby agree to:", 540, yPos + 30, 18, "Georgia", "#8B4C5C", "center", "600");
  yPos += 90;

  // Agreement points
  const agreements = [
    "❤️  I officially accept your proposal.",
    "❤️  I accept this lifelong partnership with Ritik Singh.",
    "❤️  I promise to create countless memories, laugh at your terrible jokes (most of the time),",
    "and stand by your side through every adventure.",
    "❤️  We agree to settle disagreements with hugs, snacks, and honest conversations.",
    "❤️  We promise to celebrate victories, support difficult days, and choose each other daily."
  ];

  agreements.forEach((line) => {
    if (line.startsWith("❤️")) {
      drawText(line.substring(0, 2), 100, yPos, 20, "Arial", "#E84855");
      drawText(line.substring(2).trim(), 150, yPos, 15, "Georgia", "#5C3D47", "left");
    } else {
      drawText(line, 150, yPos, 15, "Georgia", "#5C3D47", "left");
    }
    yPos += 45;
  });

  // Bottom decoration line
  yPos += 30;
  ctx.strokeStyle = "#D4A5B4";
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  ctx.moveTo(150 * dpr, yPos * dpr);
  ctx.lineTo(930 * dpr, yPos * dpr);
  ctx.stroke();

  // Signature section
  yPos += 60;
  drawText("Signed with love ❤️", 540, yPos, 18, "Georgia", "#8B4C5C", "center", "600");
  yPos += 80;

  const sigY = yPos;
  drawText("Ishita Jaiswal", 270, sigY, 20, "Brush Script MT, cursive", "#8B4C5C", "center", "700");
  drawText("Ritik Singh", 810, sigY, 20, "Brush Script MT, cursive", "#8B4C5C", "center", "700");

  // Convert canvas to a mobile-friendly share payload.
  const shareMimeType = isMobileShare ? "image/jpeg" : "image/png";
  const shareFileName = isMobileShare ? "peace-treaty.jpg" : "peace-treaty.png";
  const shareQuality = isMobileShare ? 0.82 : 0.92;

  canvas.toBlob(async (blob) => {
    if (!blob) {
      showToast("Could not prepare image. Please try again.");
      return;
    }

    const file = new File([blob], shareFileName, { type: shareMimeType });

    if (!navigator.share) {
      showToast("Sharing is not supported on this browser.");
      return;
    }

    const canShareFiles = typeof navigator.canShare === "function"
      ? navigator.canShare({ files: [file] })
      : true;

    if (!canShareFiles) {
      showToast("This browser cannot share image files here.");
      return;
    }

    try {
      await navigator.share({
        title: "Peace Treaty ❤️",
        text: "I accept this proposal!",
        files: [file]
      });
      showToast("Shared successfully! 💌");
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }
      showToast("Could not send image. Please try again.");
    }
  }, shareMimeType, shareQuality);
}

function downloadCard(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Card ready to share! 🎉");
}

function runProposalIntro() {
  proposalCard.classList.remove("celebrating");
  yesMoment.classList.add("hidden");
  proposalType.textContent = "";
  proposalQuestion.textContent = "";
  proposalActions.classList.add("hidden");

  typeLines(proposalType, ["Okay... this one is from my whole heart 💫"], 40, 400)
    .then(() => {
      return new Promise((resolve) => setTimeout(resolve, 900));
    })
    .then(() => {
      const question = "Can I be your boyfriend? ❤";
      let idx = 0;
      return new Promise((resolve) => {
        const timer = setInterval(() => {
          proposalQuestion.textContent = question.slice(0, idx);
          idx += 1;
          if (idx > question.length) {
            clearInterval(timer);
            resolve();
          }
        }, 45);
      });
    })
    .then(() => {
      resetNoButtonToOrigin();
      proposalActions.classList.remove("hidden");
    });
}

function playTinyPiano() {
  if (!window.AudioContext) {
    return;
  }

  if (!playTinyPiano.ctx) {
    playTinyPiano.ctx = new AudioContext();
  }

  const ctx = playTinyPiano.ctx;
  const notes = [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25];

  let time = ctx.currentTime;
  notes.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.09, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.33);
    time += 0.2;
  });
}

function triggerWhatsAppRedirect() {
  const msg = encodeURIComponent(
  "I forgive you, idiot. ❤️ Now take me out for momos! 🥟❤\n\nP.S. Go back to the page...there's one last surprise waiting for you.😉✨");
//   encodeURIComponent("I forgive you, idiot. Now take me out for momos! 🥟❤");
  const waUrl = `https://wa.me/917291848860?text=${msg}`;
  const waProtocol = `whatsapp://send?phone=917291848860&text=${msg}`;

  // Strategy: Try multiple redirect methods for iOS Safari compatibility.
  // 1. Try direct location assignment (works best on most devices)
  // 2. Fallback to whatsapp:// protocol
  // 3. Fallback back to wa.me via anchor click

  const attemptRedirect = () => {
    try {
      // Try wa.me first (most reliable across platforms)
      window.location.href = waUrl;
    } catch {
      try {
        // Fallback to whatsapp:// protocol
        window.location.href = waProtocol;
      } catch {
        // Last resort: anchor click
        const link = document.createElement("a");
        link.href = waUrl;
        link.target = "_blank";
        link.click();
      }
    }
  };

  // Use minimal delay (100ms) to stay within iOS user-gesture window,
  // or execute immediately if called synchronously.
  clearTimeout(runCelebration.waTimer);
  runCelebration.waTimer = setTimeout(attemptRedirect, 100);
}

function runCelebration() {
  document.body.classList.add("accepted");
  clearTimeout(runCelebration.acceptedTimer);
  runCelebration.acceptedTimer = setTimeout(() => {
    document.body.classList.remove("accepted");
  }, 1800);

  proposalCard.classList.add("celebrating");
  proposalRevealBtn.classList.add("hidden");
  proposalType.textContent = "";
  proposalQuestion.innerHTML = "Yay! Almost done... 🥹💕<br>If this made you smile,<br>make me smile too.<br>I'm probably staring at my phone right now ;)";
  proposalActions.classList.add("hidden");
  yesMoment.classList.remove("hidden");

  // Trigger WhatsApp redirect after 2.8s celebration.
  clearTimeout(runCelebration.waTimer);
  runCelebration.waTimer = setTimeout(() => {
    triggerWhatsAppRedirect();
  }, 2800);

  const canvas = document.getElementById("celebration-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = Array.from({ length: 260 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height,
    s: 4 + Math.random() * 8,
    vy: 1.6 + Math.random() * 4.4,
    vx: -1 + Math.random() * 2,
    c: ["#ff6faa", "#ffd57c", "#c4a2ff", "#ffffff"][Math.floor(Math.random() * 4)],
    shape: Math.random() > 0.6 ? "heart" : "dot"
  }));

  let frame = 0;
  function drawHeart(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - size / 2, y - size / 2, x - size, y + size / 3, x, y + size);
    ctx.bezierCurveTo(x + size, y + size / 3, x + size / 2, y - size / 2, x, y);
    ctx.fill();
  }

  function loop() {
    frame += 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > canvas.height + 25) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }

      if (p.shape === "heart") {
        drawHeart(p.x, p.y, p.s, p.c);
      } else {
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (frame < 640) {
      requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  loop();
}

async function captureScreenBlob() {
  if (typeof window.html2canvas !== "function") {
    throw new Error("Capture library not loaded");
  }

  const target = document.body;
  const canvas = await window.html2canvas(target, {
    backgroundColor: null,
    scale: Math.min(2, window.devicePixelRatio || 1.5),
    useCORS: true,
    width: window.innerWidth,
    height: window.innerHeight,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0
  });

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) {
    throw new Error("Capture failed");
  }

  return blob;
}

async function shareMagicCard() {
  try {
    shareBtn.disabled = true;
    shareBtn.textContent = "✨ Capturing...";

    const blob = await captureScreenBlob();
    const file = new File([blob], "wizarding-yes-moment.png", { type: "image/png" });
    const shareText = "If this made you smile, share it on your Insta Story or Snap story 💕";
    const basePayload = {
      title: "Magic Apology Story",
      text: shareText,
      url: window.location.href
    };

    if (navigator.share) {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ ...basePayload, files: [file] });
      } else {
        await navigator.share(basePayload);
      }
      showToast("Shared! Post it to Insta/Snap story ✨");
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wizarding-yes-moment.png";
      a.click();
      URL.revokeObjectURL(url);
      showToast("Saved image. Post it to Insta/Snap story if you liked it 💖");
    }
  } catch (error) {
    showToast("Could not share right now, but you can try again ✨");
  } finally {
    shareBtn.disabled = false;
    shareBtn.textContent = "📸 Share This Magic";
  }
}

function setupEvents() {
  openStoryBtn.addEventListener("click", () => {
    logClick("open story clicked");
    envelopeCard.classList.add("opened");
    burstHearts(window.innerWidth / 2, window.innerHeight / 2);
    setTimeout(() => setScene(2), 1100);
  });

  document.querySelectorAll(".choice-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      logClick(`anger choice selected: ${btn.dataset.choice}`);
      showToast(`Noted: ${btn.dataset.choice} 💌`);
      btn.style.transform = "scale(1.08)";
      setTimeout(() => {
        setScene(3);
        runApologyScene();
      }, 500);
    });
  });

  intermissionBtn.addEventListener("click", () => {
    logClick("memory garden continue clicked");
    resetGussaScene();
    setScene(5);
  });

  intermissionBtn.addEventListener("touchend", (event) => {
    event.preventDefault();
    logClick("memory garden continue touched");
    resetGussaScene();
    setScene(5);
  }, { passive: false });

  gussaTapBtn.addEventListener("click", () => {
    logClick("gussa meter tap");
    advanceGussaMeter();
  });

  proposalBtn.addEventListener("click", () => {
    logClick("final question clicked");
    resetProposalScene();
    setScene(7);
  });

  proposalBtn.addEventListener("touchend", (event) => {
    event.preventDefault();
    logClick("final question touched");
    resetProposalScene();
    setScene(7);
  }, { passive: false });

  stickyNote.addEventListener("click", () => {
    if (!stickyNote.classList.contains("folded")) {
      return;
    }

    logClick("sticky note opened");
    stickyNote.classList.remove("folded");
    stickyPrompt.classList.add("hidden");
    angerQuestion.classList.remove("hidden");
    angerChoices.classList.remove("hidden");
    showToast("Thank you for opening it 💌");
  });

  proposalRevealBtn.addEventListener("click", () => {
    logClick("proposal reveal clicked");
    proposalRevealBtn.classList.add("hidden");
    runProposalIntro();
  });

  proposalRevealBtn.addEventListener("touchend", (event) => {
    event.preventDefault();
    logClick("proposal reveal touched");
    proposalRevealBtn.classList.add("hidden");
    runProposalIntro();
  }, { passive: false });

  noBtn.addEventListener("pointerenter", handleNoAttempt);
  noBtn.addEventListener("pointerdown", handleNoAttempt);
  noBtn.addEventListener("touchstart", handleNoAttempt, { passive: false });
  noBtn.addEventListener("click", (event) => {
    logClick(`no button click blocked - attempt ${noPressCount}`);
    event.preventDefault();
    event.stopPropagation();
  });

  yesBtn.addEventListener("click", () => {
    logClick("yes button clicked");
    const rect = yesBtn.getBoundingClientRect();
    burstBigLove(rect.left + rect.width / 2, rect.top + rect.height / 2);
    emitButtonSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2);
    playTinyPiano();
    runCelebration();
    // Also attempt immediate redirect for iOS (fallback if delayed redirect fails)
    triggerWhatsAppRedirect();
  });

  shareBtn.addEventListener("click", () => {
    logClick("share magic clicked");
    generateAndSharePeaceTreaty();
  });

  const footerLink = document.querySelector(".footer-link");
  if (footerLink) {
    footerLink.addEventListener("click", () => {
      logClick("instagram footer clicked");
    });
  }

  musicToggle.addEventListener("click", () => {
    logClick("music toggle clicked");
    musicOn = !musicOn;
    musicToggle.textContent = `Piano: ${musicOn ? "On" : "Off"}`;
    if (musicOn) {
      playTinyPiano();
      showToast("Soft piano on ✨");
    } else {
      showToast("Piano paused 🌙");
    }
  });

  document.body.addEventListener("mousemove", (event) => {
    const flies = Array.from(document.querySelectorAll(".fly"));
    flies.forEach((fly, index) => {
      const factor = 0.015 + index * 0.005;
      const x = event.clientX * factor + index * 40;
      const y = event.clientY * factor + index * 30;
      fly.style.transform = `translate(${x}px, ${y}px)`;
    });

    maybeEscapeFromCursor(event);
  });

  document.body.addEventListener("click", (event) => {
    burstHearts(event.clientX, event.clientY);
    easterCount += 1;
    if (easterCount === 12) {
      showToast("Secret unlocked: You found the hidden wish ✨");
    }
  });

  // Butterflies briefly land on hovered interactive controls.
  document.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("pointerdown", () => {
      const rect = btn.getBoundingClientRect();
      emitButtonSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2);
    });

    btn.addEventListener("mouseenter", () => {
      const butterfly = document.createElement("span");
      butterfly.className = "butterfly";
      butterfly.textContent = "🦋";
      const rect = btn.getBoundingClientRect();
      butterfly.style.left = `${rect.left + rect.width / 2}px`;
      butterfly.style.top = `${rect.top - 8}px`;
      particleLayer.appendChild(butterfly);
      setTimeout(() => butterfly.remove(), 1500);
    });
  });

  window.addEventListener("resize", () => {
    const canvas = document.getElementById("celebration-canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

function boot() {
  resetLocationContextCache();
  getLocationContext();
  createBackground();
  initGarden();
  setupEvents();
  setScene(1);
  angerChoices.classList.add("hidden");
  angerQuestion.classList.add("hidden");
  stickyNote.classList.add("folded");
  resetGussaScene();
  resetProposalScene();
  typeLines(landingType, landingLines, 50, 580);
}

boot();
