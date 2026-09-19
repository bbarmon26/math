/* ===================================================================
   iOS Modern Math App Engine
   Author: Bilas Academy Development
   Features: True Global Search Across All Chapters, Canvas Scratchpad,
             Bookmarks, LocalStorage, Instant MathJax Typesetting
   =================================================================== */

// Global State
let currentChapterData = null;
let currentQuestions = [];
let allLoadedChapters = {}; // Cache: { 1: chapterData, 2: chapterData, ... }
let bookmarks = JSON.parse(localStorage.getItem('math_app_bookmarks') || '[]');
let currentFontScale = 1.05;
let isBookmarksOnlyView = false;

// ২৪টি অধ্যায়ের সূচিপত্র তালিকা
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

// গ্লোবাল সার্চের জন্য ব্যাকগ্রাউন্ডে অধ্যায়গুলো ইনডেক্স করা
function preloadAllChapters() {
  chapterRegistry.forEach(ch => {
    // নিরবে ফাইল লোড করার চেষ্টা
    fetch(ch.file)
      .then(res => {
        if (res.ok) return res.text();
        throw new Error('File not found');
      })
      .then(code => {
        // সেফলি ডেটা এক্সট্র্যাক্ট করা
        try {
          const fn = new Function(code + '; return typeof chapterData !== "undefined" ? chapterData : null;');
          const data = fn();
          if (data && data.questions) {
            allLoadedChapters[ch.id] = data;
          }
        } catch (e) {
          // ignore parsing if draft
        }
      })
      .catch(() => {
        // ফাইলটি এখনো তৈরি না থাকলে শান্তভাবে এড়িয়ে যাবে
      });
  });
}

// অ্যাপ চালুর সাথে সাথে প্রি-লোড রান হবে
window.addEventListener('DOMContentLoaded', () => {
  preloadAllChapters();
});

// অধ্যায় খোলার ফাংশন
function openChapter(chapterId, filePath) {
  if (allLoadedChapters[chapterId]) {
    currentChapterData = allLoadedChapters[chapterId];
    currentQuestions = currentChapterData.questions;
    renderChapterView();
    return;
  }

  const oldScript = document.getElementById('activeChapterScript');
  if (oldScript) oldScript.remove();
  window.chapterData = undefined;

  const script = document.createElement('script');
  script.id = 'activeChapterScript';
  script.src = filePath;

  script.onload = () => {
    if (window.chapterData) {
      allLoadedChapters[chapterId] = JSON.parse(JSON.stringify(window.chapterData));
      currentChapterData = allLoadedChapters[chapterId];
      currentQuestions = currentChapterData.questions;
      renderChapterView();
    } else {
      alert("অধ্যায় ডাটা পাওয়া যায়নি!");
    }
  };

  script.onerror = () => {
    alert("এই অধ্যায়ের (" + filePath + ") ফাইলটি এখনো data ফোল্ডারে তৈরি করা হয়নি।");
  };

  document.body.appendChild(script);
}

// অধ্যায়ের ভিউ প্রদর্শন
function renderChapterView() {
  document.getElementById('chapterIndexGrid').style.display = 'none';
  document.getElementById('globalSearchResults').style.display = 'none';
  document.getElementById('chapterContentTray').style.display = 'block';
  document.getElementById('navBackBtn').style.display = 'inline-flex';
  document.getElementById('fontControls').style.display = 'flex';
  document.getElementById('chapterToolbar').style.display = 'flex';

  document.getElementById('pageMainTitle').innerText = currentChapterData.chapterName;

  const searchInput = document.getElementById('spotlightSearch');
  searchInput.placeholder = "এই অধ্যায়ের ভেতরে খুঁজুন...";
  searchInput.value = '';

  renderQuestionCards(currentQuestions, document.getElementById('chapterContentTray'));
}

// প্রশ্ন কার্ড রেন্ডার করা
function renderQuestionCards(questionsList, containerElement, showChapterName = false) {
  containerElement.innerHTML = '';
  document.getElementById('questionCounter').innerText = `মোট প্রশ্ন: ${questionsList.length} টি`;

  if (questionsList.length === 0) {
    containerElement.innerHTML = `
      <div style="text-align:center; padding: 60px 20px; color: var(--ios-text-tertiary);">
        <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px;"></i>
        <p>কোনো প্রশ্ন পাওয়া যায়নি</p>
      </div>`;
    return;
  }

  questionsList.forEach((q) => {
    const card = document.createElement('div');
    card.className = 'math-card';
    card.id = `q-card-${q.id}`;

    const isFav = bookmarks.includes(getBookmarkKey(q.id, q.chapterId));

    let practiceHTML = '';
    if (q.practice && q.practice.length > 0) {
      practiceHTML = `
        <div class="practice-section">
          <div class="practice-head">
            <i class="fa-solid fa-file-circle-check"></i>
            <span>অনুরূপ ও বিগত সালের প্রশ্ন অনুশীলন</span>
          </div>
          ${q.practice.map((item, idx) => {
            const hasDirectSolution = (typeof item === 'object' && item.solution);
            const questionText = typeof item === 'object' ? item.question : item;
            const directSolution = typeof item === 'object' ? item.solution : '';

            return `
              <div class="practice-item">
                <div class="practice-q-text">${questionText}</div>${hasDirectSolution ? `
                  <div class="practice-actions">
                    <button class="practice-toggle-btn" onclick="togglePracticeSolution('${q.id}_${idx}')">
                      <i class="fa-regular fa-lightbulb"></i> সমাধান দেখুন
                    </button>
                  </div>
                  <div id="prac-sol-${q.id}_${idx}" class="practice-sol-box" style="display: none;">
                    ${directSolution}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    const chapterTag = showChapterName && q.chapterName ? `<span class="ios-badge" style="margin-bottom:8px; display:inline-block;">${q.chapterName}</span><br>` : '';

    card.innerHTML = `
      <div class="question-header">
        ${chapterTag}
        <div class="q-top-row">
          <div class="q-badges">
            <span class="problem-badge">${q.title}</span>
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleBookmark(${q.id}, event, ${q.chapterId})">
              <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
            </button>
          </div>
          <span class="toggle-chip" id="chip-${q.id}" onclick="toggleSolution('${q.id}')">
            <i class="fa-regular fa-eye"></i> সমাধান
          </span>
        </div>
        <div class="question-text" onclick="toggleSolution('${q.id}')">${q.question}</div>
      </div>

      <div id="sol-${q.id}" class="solution-panel" style="display: none;">
        <span class="sol-tag"><i class="fa-solid fa-check-double"></i> পূর্ণাঙ্গ সমাধান</span>
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
function toggleSolution(id) {
  const sol = document.getElementById(`sol-${id}`);
  const chip = document.getElementById(`chip-${id}`);
  if (!sol) return;

  if (sol.style.display === 'none') {
    sol.style.display = 'block';
    chip.innerHTML = '<i class="fa-regular fa-eye-slash"></i> বন্ধ করুন';
    chip.style.color = 'var(--ios-text-secondary)';
  } else {
    sol.style.display = 'none';
    chip.innerHTML = '<i class="fa-regular fa-eye"></i> সমাধান';
    chip.style.color = 'var(--ios-blue)';
  }
}

// প্র্যাকটিস সমাধান খোলা/বন্ধ করা
function togglePracticeSolution(key) {
  const el = document.getElementById(`prac-sol-${key}`);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise([el]);
  }
}

// সব সমাধান খোলা/বন্ধ করা
function toggleAllSolutions(expand) {
  currentQuestions.forEach(q => {
    const sol = document.getElementById(`sol-${q.id}`);
    const chip = document.getElementById(`chip-${q.id}`);
    if (sol && chip) {
      if (expand) {
        sol.style.display = 'block';
        chip.innerHTML = '<i class="fa-regular fa-eye-slash"></i> বন্ধ করুন';
      } else {
        sol.style.display = 'none';
        chip.innerHTML = '<i class="fa-regular fa-eye"></i> সমাধান';
      }
    }
  });
}

// সূচিপত্রে ফিরে যাওয়া
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
}

// ==========================================
// আসল ও সম্পূর্ণ গ্লোবাল সার্চ লজিক
// ==========================================
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
    // ১. অধ্যায়ের নামের সাথে মিল আছে কিনা
    let matchedChaptersCount = 0;
    const cards = document.querySelectorAll('.ios-card');
    cards.forEach(card => {
      const text = card.innerText.toLowerCase();
      const match = text.includes(query);
      card.style.display = match ? 'flex' : 'none';
      if (match) matchedChaptersCount++;
    });

    // ২. সব অধ্যায়ের ভেতরে থাকা অংকগুলোর মধ্যে অনুসন্ধান (Global Math Search)
    const matchedQuestions = [];
    Object.keys(allLoadedChapters).forEach(chId => {
      const chap = allLoadedChapters[chId];
      if (chap && chap.questions) {
        chap.questions.forEach(q => {
          const matchQ = (q.question && q.question.toLowerCase().includes(query)) ||
                         (q.title && q.title.toLowerCase().includes(query)) ||
                         (q.solution && q.solution.toLowerCase().includes(query));
          
          let matchPractice = false;
          if (q.practice) {
            matchPractice = q.practice.some(p => {
              const pText = typeof p === 'object' ? (p.question + ' ' + p.solution) : p;
              return pText.toLowerCase().includes(query);
            });
          }

          if (matchQ || matchPractice) {
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
        <div class="search-title-banner">
          <i class="fa-solid fa-magnifying-glass"></i> "${query}" সম্পর্কিত <b>${matchedQuestions.length}</b>টি অংক পাওয়া গেছে:
        </div>
        <div id="searchResultsInner"></div>
      `;
      renderQuestionCards(matchedQuestions, document.getElementById('searchResultsInner'), true);
    } else {
      searchResultsTray.style.display = 'none';
    }

  } else {
    // নির্দিষ্ট অধ্যায়ের ভেতরে সার্চ
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
function getBookmarkKey(questionId, customChapId = null) {
  const chapId = customChapId || (currentChapterData ? currentChapterData.chapterId : '0');
  return `ch_${chapId}_q_${questionId}`;
}

function toggleBookmark(questionId, event, customChapId = null) {
  event.stopPropagation();
  const key = getBookmarkKey(questionId, customChapId);
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
      const filtered = currentQuestions.filter(q => bookmarks.includes(getBookmarkKey(q.id)));
      renderQuestionCards(filtered, document.getElementById('chapterContentTray'));
    }
  } else {
    if (currentChapterData) {
      renderQuestionCards(currentQuestions, document.getElementById('chapterContentTray'));
    }
  }
}

// ফন্ট সাইজ নিয়ন্ত্রণ
function adjustFontSize(delta) {
  currentFontScale = Math.min(Math.max(0.9, currentFontScale + delta * 0.1), 1.4);
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
  canvas.height = canvas.parentElement.clientHeight - 60;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.5;
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