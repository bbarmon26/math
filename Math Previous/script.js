// ==================== APP CONFIG & STATE ====================
const chaptersConfig = [
  { id: 1, name: "ঐকিক নিয়ম, সময় ও কাজ", icon: "fa-calculator", color: "#FF9500" },
  { id: 2, name: "নল ও চৌবাচ্চা / গতিবেগ", icon: "fa-faucet-drip", color: "#007AFF" },
  { id: 3, name: "নৌকা ও স্রোত", icon: "fa-ship", color: "#5856D6" },
  { id: 4, name: "ট্রেন", icon: "fa-train", color: "#FF2D55" },
  { id: 5, name: "অনুপাত, মিশ্রণ ও বয়স", icon: "fa-users", color: "#AF52DE" },
  { id: 6, name: "সংখ্যার সমীকরণ", icon: "fa-arrow-down-1-9", color: "#34C759" },
  { id: 7, name: "শতকরা হিসাব, লাভ-ক্ষতি", icon: "fa-percent", color: "#FF3B30" },
  { id: 8, name: "মুনাফা আসল", icon: "fa-coins", color: "#FFCC00" },
  { id: 9, name: "পরিমাপ", icon: "fa-ruler-combined", color: "#5AC8FA" },
  { id: 10, name: "ত্রিকোণমিতি", icon: "fa-shapes", color: "#4CD964" },
  { id: 11, name: "দূরত্ব ও গড়", icon: "fa-route", color: "#FF9500" },
  { id: 12, name: "ভগ্নাংশ ও দশমিক", icon: "fa-divide", color: "#007AFF" },
  { id: 13, name: "ধারা ও গড়", icon: "fa-chart-line", color: "#5856D6" },
  { id: 15, name: "সরল ও মান নির্ণয়", icon: "fa-square-root-variable", color: "#34C759" },
  { id: 16, name: "উৎপাদক", icon: "fa-cubes", color: "#FF2D55" },
  { id: 17, name: "গ.সা.গু এবং ল.সা.গু", icon: "fa-layer-group", color: "#AF52DE" },
  { id: 18, name: "সমীকরণ সমাধান", icon: "fa-equals", color: "#007AFF" },
  { id: 19, name: "সূচক ও লগারিদম", icon: "fa-superscript", color: "#FF9500" },
  { id: 20, name: "বিবিধ", icon: "fa-asterisk", color: "#8E8E93" },
  { id: 21, name: "জ্যামিতি", icon: "fa-draw-polygon", color: "#FF3B30" },
  { id: 22, name: "জ্যামিতিক সংজ্ঞা ও সূত্র", icon: "fa-book-bookmark", color: "#5AC8FA" }
];

let currentFilterList = [];
let displayedCount = 0;
const BATCH_SIZE = 15;
let activePostType = "all";
let searchTimer = null;
let currentFontSize = 0;

// ==================== HELPER FUNCTIONS ====================
function cleanMathText(str) {
  return (str || '').replace(/[\\$\s{}()]/g, '').trim().toLowerCase();
}

function getDuplicateMap(db) {
  const map = {};
  if (!Array.isArray(db)) return map;
  db.forEach(item => {
    if (!item || !item.question) return;
    const key = cleanMathText(item.question);
    if (!map[key]) map[key] = [];
    map[key].push(item.id);
  });
  return map;
}

// নির্বাচিত পদের ভিত্তিতে ডাটা ফিল্টার করা
function getBaseData() {
  if (typeof mathDatabase === "undefined") return [];
  if (activePostType === "all") return mathDatabase;
  return mathDatabase.filter(item => item.postType === activePostType);
}

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", () => {
  renderFilterPills();
  renderHomeScreen();
});

// ফিল্টার পিল বাটন তৈরি
function renderFilterPills() {
  const pillsWrap = document.getElementById("filterPillsContainer");
  if (!pillsWrap || typeof mathDatabase === "undefined") return;

  const postTypes = [...new Set(mathDatabase.map(item => item.postType).filter(Boolean))];

  let html = `<button class="filter-pill ${activePostType === 'all' ? 'active' : ''}" onclick="selectPostType('all')">সব পদ</button>`;

  postTypes.forEach(pod => {
    html += `<button class="filter-pill ${activePostType === pod ? 'active' : ''}" onclick="selectPostType('${pod}')"><i class="fa-solid fa-briefcase" style="font-size:0.75rem; margin-right:4px;"></i>${pod}</button>`;
  });

  pillsWrap.innerHTML = html;
}

// পদে চাপ দিলে শুধু হোমস্ক্রিনের কার্ড এবং কাউন্ট আপডেট হবে
function selectPostType(pod) {
  activePostType = pod;
  renderFilterPills();
  
  // যদি কোনো প্রশ্ন ওপেন থাকা অবস্থায় ফিল্টারে চাপ পড়ে, তবে হোমে ফিরে আসবে
  if (document.getElementById("chapterContentTray").style.display !== "none") {
    goBackToIndex();
  } else {
    renderHomeScreen();
  }
}

// হোমস্ক্রিনের চ্যাপ্টার গ্রিড ও টোটাল কাউন্ট রেন্ডার
function renderHomeScreen() {
  const container = document.getElementById("gridContainer");
  const countEl = document.getElementById("totalQuestionsCountText");
  if (!container || typeof mathDatabase === "undefined") return;

  const currentData = getBaseData();

  // টোটাল কাউন্ট ব্যানার আপডেট
  if (countEl) {
    if (activePostType === "all") {
      countEl.innerText = `${currentData.length} টি বিগত সালের গণিত সমাধান`;
    } else {
      countEl.innerText = `${activePostType}-এর মোট ${currentData.length} টি গণিত`;
    }
  }

  // প্রতিটি অধ্যায়ের প্রশ্ন সংখ্যা গণনা
  const countMap = {};
  currentData.forEach(q => {
    countMap[q.chapterId] = (countMap[q.chapterId] || 0) + 1;
  });

  // চ্যাপ্টার কার্ড ড্র করা (যে অধ্যায়ে নির্বাচিত পদের প্রশ্ন আছে শুধু সেগুলো দৃশ্যমান বা সক্রিয় থাকবে)
  container.innerHTML = chaptersConfig.map(chap => {
    const qCount = countMap[chap.id] || 0;
    
    // যদি ওই পদে কোনো অধ্যায়ের প্রশ্ন না থাকে তবে সেটি হালকা হয়ে থাকবে
    const opacityStyle = qCount === 0 ? "opacity: 0.45; pointer-events: none;" : "";

    return `
      <div class="ios-card" style="--accent-color: ${chap.color}; ${opacityStyle}" onclick="openChapter(${chap.id}, '${chap.name}')">
        <div class="card-glass-symbol">
          <i class="fa-solid ${chap.icon}"></i>
        </div>
        <div class="card-details">
          <span class="chap-badge">অধ্যায় ${chap.id < 10 ? '০' + chap.id : chap.id}</span>
          <h3>${chap.name}</h3>
          <span class="chap-sub">${qCount} টি প্রশ্ন</span>
        </div>
        <i class="fa-solid fa-chevron-right chevron-icon"></i>
      </div>
    `;
  }).join('');
}

// ==================== VIEW SWITCHING ====================
// "সকল প্রশ্ন ব্যাংক" কার্ডে চাপ দিলে
function openAllQuestions() {
  const data = getBaseData();
  const title = activePostType === "all" ? "সকল প্রশ্ন ব্যাংক" : `${activePostType} (সকল অধ্যায়)`;
  showQuestionsTray(data, title);
}

// নির্দিষ্ট অধ্যায়ে চাপ দিলে
function openChapter(chapterId, chapterName) {
  const data = getBaseData().filter(q => q.chapterId === chapterId);
  const title = activePostType === "all" ? chapterName : `${chapterName} [${activePostType}]`;
  showQuestionsTray(data, title);
}

function showQuestionsTray(list, title) {
  document.getElementById("chapterIndexGrid").style.display = "none";
  const tray = document.getElementById("chapterContentTray");
  tray.style.display = "flex";
  tray.innerHTML = "";

  document.getElementById("navBackBtn").style.display = "flex";
  document.getElementById("pageMainTitle").innerText = title;

  currentFilterList = list;
  displayedCount = 0;

  renderNextBatch();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goBackToIndex() {
  document.getElementById("chapterContentTray").style.display = "none";
  document.getElementById("chapterIndexGrid").style.display = "block";
  document.getElementById("navBackBtn").style.display = "none";
  document.getElementById("pageMainTitle").innerText = "গণিত প্রস্তুতি";
  document.getElementById("spotlightSearch").value = "";
  renderHomeScreen();
}

// ==================== LAZY LOADING / INFINITE SCROLL ====================
function renderNextBatch() {
  const tray = document.getElementById("chapterContentTray");
  const loader = document.getElementById("scrollLoader");
  if (!tray || displayedCount >= currentFilterList.length) {
    if (loader) loader.style.display = "none";
    return;
  }

  const nextBatch = currentFilterList.slice(displayedCount, displayedCount + BATCH_SIZE);
  const dupMap = getDuplicateMap(mathDatabase);

  const fragment = document.createDocumentFragment();

  nextBatch.forEach(item => {
    const div = document.createElement("div");

    const dupKey = cleanMathText(item.question);
    const dupIds = dupMap[dupKey] || [];
    const isDuplicate = dupIds.length > 1;
    const isFirstDuplicate = isDuplicate && dupIds[0] === item.id;
    const isSecondary = isDuplicate && dupIds[0] !== item.id;

    let cardClass = "question-card";
    if (isFirstDuplicate) cardClass += " duplicate-primary";
    if (isSecondary) cardClass += " duplicate-secondary";

    div.className = cardClass;
    div.innerHTML = `
      ${isSecondary ? '<div class="duplicate-watermark">অনুরূপ প্রশ্ন</div>' : ''}
      <div class="q-meta">
        <div class="badge-wrap">
          <span class="q-tag">${item.category || 'সাধারণ'}</span>
          ${item.postType ? `<span class="q-post-badge"><i class="fa-solid fa-user-tie" style="font-size:0.7rem; margin-right:3px;"></i>${item.postType}</span>` : ''}
          ${item.source ? `<span class="q-tag q-source">${item.source}${item.examYear || ''}</span>` : ''}
          ${isDuplicate ? `<span class="duplicate-badge"><i class="fa-solid fa-copy"></i> রিপিটেড (${dupIds.length} বার)</span>` : ''}
        </div>
        <span style="font-size: 0.8rem; font-weight: 700; color: #8e8e93;">#${item.id}</span>
      </div>

      <div class="q-title">${item.question}</div>

      <button class="toggle-sol-btn" onclick="toggleSolution(this, 'sol_${item.id}')">
        <i class="fa-solid fa-lightbulb"></i>
        <span>সমাধান দেখুন</span>
      </button>

      <div class="solution-drawer" id="sol_${item.id}">
        ${item.solution}
      </div>
    `;

    fragment.appendChild(div);
  });

  tray.appendChild(fragment);

  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([tray]).catch(err => console.log(err));
  }

  displayedCount += nextBatch.length;

  if (displayedCount < currentFilterList.length && loader) {
    loader.style.display = "block";
  } else if (loader) {
    loader.style.display = "none";
  }
}

// স্ক্রোল ইভেন্ট
window.addEventListener("scroll", () => {
  if (document.getElementById("chapterContentTray").style.display !== "none") {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
      renderNextBatch();
    }
  }
});

// সলিউশন টগল
function toggleSolution(btn, solId) {
  const drawer = document.getElementById(solId);
  if (!drawer) return;

  const isOpen = drawer.classList.contains("open");
  if (isOpen) {
    drawer.classList.remove("open");
    btn.querySelector("span").innerText = "সমাধান দেখুন";
  } else {
    drawer.classList.add("open");
    btn.querySelector("span").innerText = "সমাধান লুকান";
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([drawer]);
    }
  }
}

// ==================== SEARCH ====================
function onSearchInput(query) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    executeFilter(query);
  }, 250);
}

function executeFilter(searchText) {
  const cleanQ = (searchText || "").trim().toLowerCase();
  
  if (!cleanQ) {
    goBackToIndex();
    return;
  }

  // নির্বাচিত পদের মধ্যে সার্চ হবে
  let list = getBaseData().filter(item => {
    const qText = (item.question || "").toLowerCase();
    const sText = (item.source || "").toLowerCase();
    const pText = (item.postType || "").toLowerCase();
    const cText = (item.category || "").toLowerCase();
    return qText.includes(cleanQ) || sText.includes(cleanQ) || pText.includes(cleanQ) || cText.includes(cleanQ);
  });

  showQuestionsTray(list, `অনুসন্ধান: "${cleanQ}"`);
}

// ==================== FONT SIZE STEPPER ====================
function adjustFontSize(dir) {
  currentFontSize += dir;
  if (currentFontSize > 4) currentFontSize = 4;
  if (currentFontSize < -2) currentFontSize = -2;

  const baseTitle = 1.05 + (currentFontSize * 0.08);
  const baseSol = 0.98 + (currentFontSize * 0.08);

  document.documentElement.style.setProperty("--q-title-size", `${baseTitle}rem`);
  document.documentElement.style.setProperty("--q-sol-size", `${baseSol}rem`);
}
