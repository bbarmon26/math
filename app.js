/* ===================================================================
   iOS Modern Math App Engine (Universal Loader + Mobile Optimized)
   Author: Bilas Academy Development
   =================================================================== */

let currentChapterData = null;
let currentQuestions = [];
let allLoadedChapters = {};
let bookmarks = JSON.parse(localStorage.getItem('math_app_bookmarks') || '[]');
let currentFontScale = 1.0;
let isBookmarksOnlyView = false;

// ২৪টি অধ্যায়ের তালিকা
const chapterRegistry = [
  { id: 1, name: "ঐকিক নিয়ম, সময় ও কাজ", file: "data/ch01.js" },
  { id: 2, name: "নল ও চৌবাচ্চা", file: "data/ch02.js" },
  { id: 3, name: "নৌকা ও স্রোত", file: "data/ch03.js" },
  { id: 4, name: "ট্রেন", file: "data/ch04.js" },
  { id: 5, name: "অনুপাত, মিশ্রণ ও বয়স", file: "data/ch05.js" },
  { id: 6, name: "সংখ্যার সমীকরণ", file: "data/ch06.js" },
  { id: 7, name: "শতকরা হিসাব, লাভ-ক্ষতি", file: "data/ch07.js" },
  { id: 8, name: "মুনাফা আসল", file: "data/ch08.js" },
  { id: 9, name: "পরিমাপ", file: "data/ch09.js" },
  { id: 10, name: "সরল ও দ্বিপদী সমীকরণ", file: "data/ch10.js" },
  { id: 11, name: "দূরত্ব", file: "data/ch11.js" },
  { id: 12, name: "ভগ্নাংশ", file: "data/ch12.js" },
  { id: 13, name: "গড়", file: "data/ch13.js" },
  { id: 14, name: "ধারা", file: "data/ch14.js" },
  { id: 15, name: "সরল ও মান নির্ণয়", file: "data/ch15.js" },
  { id: 16, name: "উৎপাদক", file: "data/ch16.js" },
  { id: 17, name: "গ.সা.গু এবং ল.সা.গু", file: "data/ch17.js" },
  { id: 18, name: "সমীকরণ সমাধান", file: "data/ch18.js" },
  { id: 19, name: "সূচক ও লগারিদম", file: "data/ch19.js" },
  { id: 20, name: "বিবিধ", file: "data/ch20.js" },
  { id: 21, name: "ত্রিকোণমিতি", file: "data/ch21.js" },
  { id: 22, name: "জ্যামিতিক সংজ্ঞা", file: "data/ch22.js" },
  { id: 23, name: "সংক্ষিপ্ত প্রশ্ন-উত্তর", file: "data/ch23.js" },
  { id: 24, name: "নমুনা প্রশ্ন", file: "data/ch24.js" }
];

// অধ্যায় ওপেন করার সার্বজনীন নিরাপদ ফাংশন
function openChapter(chapterId, customPath) {
  const filePath = customPath || `data/ch${chapterId < 10 ? '0' + chapterId : chapterId}.js`;

  // ১. মেমোরিতে আগেই থাকলে সরাসরি দেখানো
  if (allLoadedChapters[chapterId]) {
    currentChapterData = allLoadedChapters[chapterId];
    currentQuestions = currentChapterData.questions;
    renderChapterView();
    return;
  }

  // ২. MATH_DATABASE-এ থাকলে নেওয়া
  if (window.MATH_DATABASE && window.MATH_DATABASE[chapterId]) {
    allLoadedChapters[chapterId] = window.MATH_DATABASE[chapterId];
    currentChapterData = allLoadedChapters[chapterId];
    currentQuestions = currentChapterData.questions;
    renderChapterView();
    return;
  }

  // ৩. সরাসরি স্ক্রিপ্ট ইনজেক্ট করে লোড করা (আপনার আগের সফল নিয়ম)
  const oldScript = document.getElementById('activeChapterScript');
  if (oldScript) oldScript.remove();
  window.chapterData = undefined;

  const script = document.createElement('script');
  script.id = 'activeChapterScript';
  script.src = filePath;

  script.onload = () => {
    const loadedData = window.chapterData || (window.MATH_DATABASE && window.MATH_DATABASE[chapterId]);
    if (loadedData) {
      allLoadedChapters[chapterId] = JSON.parse(JSON.stringify(loadedData));
      currentChapterData = allLoadedChapters[chapterId];
      currentQuestions = currentChapterData.questions;
      renderChapterView();
    } else {
      alert("অধ্যায় ডাটা পাওয়া যায়নি! ফাইলটি ঠিকমতো সেভ আছে কিনা দেখুন।");
    }
  };

  script.onerror = () => {
    alert("এই অধ্যায়ের (" + filePath + ") ফাইলটি এখনো তৈরি করা হয়নি!");
  };

  document.body.appendChild(script);
}

// অধ্যায়ের ভিউ প্রদর্শন
function renderChapterView() {
  document.getElementById('chapterIndexGrid').style.display = 'none';
  document.getElementById('globalSearchResults').style.display = 'none';
  document.getElementById('chapterContentTray').style.display = 'block';
  document.getElementById('navBackBtn').style.display = 'inline-flex';
  document.getElementById('fontControls').style.display = 'flex';
  document.getElementById('chapterToolbar').style.display = 'flex';

  document.getElementById('pageMainTitle').innerText = currentChapterData.chapterName;

  const searchInput = document.getElementById('spotlightSearch');
  searchInput.placeholder = "এই অধ্যায়ের ভেতরে প্রশ্ন খুঁজুন...";
  searchInput.value = '';

  renderQuestionCards(currentQuestions, document.getElementById('chapterContentTray'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// প্রশ্ন ও সমাধান রেন্ডার করা
function renderQuestionCards(questionsList, containerElement, showChapterName = false) {
  containerElement.innerHTML = '';
  document.getElementById('questionCounter').innerText = `মোট প্রশ্ন: ${questionsList.length} টি`;

  if (questionsList.length === 0) {
    containerElement.innerHTML = `
      <div style="text-align:center; padding: 50px 16px; color: var(--ios-text-tertiary);">
        <i class="fa-solid fa-folder-open" style="font-size: 2.2rem; margin-bottom: 10px;"></i>
        <p>কোনো প্রশ্ন পাওয়া যায়নি</p>
      </div>`;
    return;
  }

  questionsList.forEach((q, idxNum) => {
    const card = document.createElement('div');
    card.className = 'math-card';
    const currentChapId = q.chapterId || (currentChapterData ? currentChapterData.chapterId : 0);
    const cardUniqueId = `card-${currentChapId}-${q.id}-${idxNum}`;
    card.id = cardUniqueId;

    const isFav = bookmarks.includes(`ch_${currentChapId}_q_${q.id}`);

    let practiceHTML = '';
    if (q.practice && q.practice.length > 0) {
      practiceHTML = `
        <div class="practice-section" onclick="event.stopPropagation()">
          <div class="practice-head">
            <i class="fa-solid fa-file-circle-check"></i>
            <span>অনুরূপ ও বিগত সালের প্রশ্ন অনুশীলন</span>
          </div>
          ${q.practice.map((item, idx) => {
            const hasDirectSolution = (typeof item === 'object' && item.solution);
            const questionText = typeof item === 'object' ? item.question : item;
            const directSolution = typeof item === 'object' ? item.solution : '';
            const pracSolId = `prac_${currentChapId}_${q.id}_${idx}`;

            return `
              <div class="practice-item">
                <div class="practice-q-text">${questionText}</div>${hasDirectSolution ? `
                  <div class="practice-actions">
                    <button class="practice-toggle-btn" onclick="togglePracticeSolution('${pracSolId}')">
                      <i class="fa-regular fa-lightbulb"></i> সমাধান দেখুন
                    </button>
                  </div>
                  <div id="${pracSolId}" class="practice-sol-box" onclick="togglePracticeSolution('${pracSolId}')" title="ট্যাপ করে বন্ধ করুন" style="display: none;">
                    ${directSolution}
                    <div style="font-size:0.75rem; color:var(--ios-text-tertiary); margin-top:8px; text-align:right;">▲ ট্যাপ করে বন্ধ করুন</div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    const chapterTag = showChapterName && q.chapterName ? `<span class="ios-badge" style="margin-bottom:6px; display:inline-block;">${q.chapterName}</span><br>` : '';

    const solPanelId = `sol_${currentChapId}_${q.id}_${idxNum}`;
    const chipId = `chip_${currentChapId}_${q.id}_${idxNum}`;

    card.innerHTML = `
      <div class="question-header" onclick="toggleSolutionById('${solPanelId}', '${chipId}')">
        ${chapterTag}
        <div class="q-top-row">
          <div class="q-badges">
            <span class="problem-badge">${q.title}</span>
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleBookmark(${q.id}, event, ${currentChapId})">
              <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
            </button>
          </div>
          <span class="toggle-chip" id="${chipId}">
            <i class="fa-regular fa-eye"></i> সমাধান
          </span>
        </div>
        <div class="question-text">${q.question}</div>
      </div>

      <!-- উত্তরের উপরে চাপ দিলেও সমাধান হাইড হবে -->
      <div id="${solPanelId}" class="solution-panel" onclick="toggleSolutionById('${solPanelId}', '${chipId}')" title="ট্যাপ করে সমাধান বন্ধ করুন" style="display: none;">
        <div class="sol-tag-row">
          <span class="sol-tag"><i class="fa-solid fa-check-double"></i> পূর্ণাঙ্গ সমাধান</span>
          <span class="sol-close-hint"><i class="fa-solid fa-chevron-up"></i> বন্ধ করতে ট্যাপ করুন</span>
        </div>
        <div class="solution-content">${q.solution}</div>
        ${practiceHTML}
      </div>
    `;

    containerElement.appendChild(card);
  });

  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise([containerElement]);
  }
}

// সমাধান খোলা/বন্ধ করা
function toggleSolutionById(solId, chipId) {
  const sol = document.getElementById(solId);
  const chip = document.getElementById(chipId);
  if (!sol) return;

  if (sol.style.display === 'none') {
    sol.style.display = 'block';
    if (chip) {
      chip.innerHTML = '<i class="fa-regular fa-eye-slash"></i> বন্ধ করুন';
      chip.style.color = 'var(--ios-text-secondary)';
    }
  } else {
    sol.style.display = 'none';
    if (chip) {
      chip.innerHTML = '<i class="fa-regular fa-eye"></i> সমাধান';
      chip.style.color = 'var(--ios-blue)';
    }
  }
}

// প্র্যাকটিস সমাধান টগল
function togglePracticeSolution(solId) {
  const el = document.getElementById(solId);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise([el]);
  }
}

// সব সমাধান খোলা/বন্ধ করা
function toggleAllSolutions(expand) {
  const panels = document.querySelectorAll('#chapterContentTray .solution-panel');
  const chips = document.querySelectorAll('#chapterContentTray .toggle-chip');

  panels.forEach(p => p.style.display = expand ? 'block' : 'none');
  chips.forEach(c => {
    c.innerHTML = expand ? '<i class="fa-regular fa-eye-slash"></i> বন্ধ করুন' : '<i class="fa-regular fa-eye"></i> সমাধান';
    c.style.color = expand ? 'var(--ios-text-secondary)' : 'var(--ios-blue)';
  });
}

// সূচিপত্রে ফেরা
function goBackToIndex() {
  document.getElementById('chapterIndexGrid').style.display = 'grid';
  document.getElementById('chapterContentTray').style.display = 'none';
  document.getElementById('globalSearchResults').style.display = 'none';
  document.getElementById('navBackBtn').style.display = 'none';
  document.getElementById('fontControls').style.display = 'none';
  document.getElementById('chapterToolbar').style.display = 'none';

  document.getElementById('pageMainTitle').innerText = 'গণিত প্রস্তুতি';

  const searchInput = document.getElementById('spotlightSearch');
  searchInput.placeholder = "যেকোনো অধ্যায় বা অংকের প্রশ্ন খুঁজুন...";
  searchInput.value = '';
  document.getElementById('clearSearchBtn').style.display = 'none';

  const cards = document.querySelectorAll('.ios-card');
  cards.forEach(c => c.style.display = 'flex');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// সার্চ লজিক
function onSearchInput(val) {
  const query = val.trim().toLowerCase();
  const clearBtn = document.getElementById('clearSearchBtn');
  clearBtn.style.display = query ? 'block' : 'none';

  const isIndexView = document.getElementById('chapterContentTray').style.display === 'none';

  if (!query) {
    if (isIndexView) {
      document.getElementById('chapterIndexGrid').style.display = 'grid';
      document.getElementById('globalSearchResults').style.display = 'none';
      const cards = document.querySelectorAll('.ios-card');
      cards.forEach(c => c.style.display = 'flex');
    } else {
      renderQuestionCards(currentQuestions, document.getElementById('chapterContentTray'));
    }
    return;
  }

  if (isIndexView) {
    const cards = document.querySelectorAll('.ios-card');
    cards.forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(query) ? 'flex' : 'none';
    });

    // গ্লোবাল সার্চ (যে অধ্যায়গুলো মেমোরিতে আছে)
    const matchedQuestions = [];
    Object.keys(allLoadedChapters).forEach(chId => {
      const chap = allLoadedChapters[chId];
      if (chap && chap.questions) {
        chap.questions.forEach(q => {
          const matchQ = (q.question && q.question.toLowerCase().includes(query)) ||
                         (q.title && q.title.toLowerCase().includes(query)) ||
                         (q.solution && q.solution.toLowerCase().includes(query));
          
          if (matchQ) {
            matchedQuestions.push({
              ...q,
              chapterId: chap.chapterId,
              chapterName: chap.chapterName
            });
          }
        });
      }
    });

    const searchResultsTray = document.getElementById('globalSearchResults');
    if (matchedQuestions.length > 0) {
      searchResultsTray.style.display = 'block';
      searchResultsTray.innerHTML = `
        <div class="search-title-banner" style="padding: 10px 0; color: var(--ios-blue); font-weight: bold; font-size: 0.9rem;">
          <i class="fa-solid fa-magnifying-glass"></i> "${query}" সম্পর্কিত ${matchedQuestions.length}টি অংক পাওয়া গেছে:
        </div>
        <div id="searchResultsInner"></div>
      `;
      renderQuestionCards(matchedQuestions, document.getElementById('searchResultsInner'), true);
    } else {
      searchResultsTray.style.display = 'none';
    }

  } else {
    const filtered = currentQuestions.filter(q => 
      q.title.toLowerCase().includes(query) || 
      q.question.toLowerCase().includes(query) ||
      q.solution.toLowerCase().includes(query)
    );
    renderQuestionCards(filtered, document.getElementById('chapterContentTray'));
  }
}

function clearSearch() {
  const input = document.getElementById('spotlightSearch');
  input.value = '';
  onSearchInput('');
}

// বুকমার্ক লজিক
function toggleBookmark(questionId, event, chapterId) {
  event.stopPropagation();
  const key = `ch_${chapterId}_q_${questionId}`;
  const index = bookmarks.indexOf(key);

  if (index > -1) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push(key);
  }

  localStorage.setItem('math_app_bookmarks', JSON.stringify(bookmarks));
  
  const target = event.currentTarget;
  if (target) {
    target.classList.toggle('active');
    const icon = target.querySelector('i');
    if (icon) {
      icon.className = target.classList.contains('active') ? 'fa-solid fa-star' : 'fa-regular fa-star';
    }
  }
}

function toggleBookmarksView() {
  const favBtn = document.getElementById('favFilterBtn');
  isBookmarksOnlyView = !isBookmarksOnlyView;
  favBtn.classList.toggle('active', isBookmarksOnlyView);

  if (isBookmarksOnlyView) {
    if (document.getElementById('chapterContentTray').style.display !== 'none') {
      const filtered = currentQuestions.filter(q => bookmarks.includes(`ch_${currentChapterData.chapterId}_q_${q.id}`));
      renderQuestionCards(filtered, document.getElementById('chapterContentTray'));
    }
  } else {
    if (currentChapterData) {
      renderQuestionCards(currentQuestions, document.getElementById('chapterContentTray'));
    }
  }
}

// ফন্ট কন্ট্রোল
function adjustFontSize(delta) {
  currentFontScale = Math.min(Math.max(0.85, currentFontScale + delta * 0.08), 1.35);
  document.documentElement.style.setProperty('--math-font-size', `${currentFontScale}rem`);
}

// Scratchpad Canvas Engine
const canvas = document.getElementById('scratchCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;

function toggleScratchpad() {
  const modal = document.getElementById('scratchpadModal');
  if (modal.style.display === 'none') {
    modal.style.display = 'flex';
    resizeCanvas();
  } else {
    modal.style.display = 'none';
  }
}

function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight - 55;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener('mousemove', (e) => {
  if (isDrawing) {
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  }
});

window.addEventListener('mouseup', () => isDrawing = false);

canvas.addEventListener('touchstart', (e) => {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
  ctx.stroke();
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', () => isDrawing = false);
