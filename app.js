/* ===================================================================
   iOS Modern Math App Engine (With Full Global Math Search)
   Author: Bilas Academy Development
   =================================================================== */

let currentChapterData = null;
let currentQuestions = [];
let allLoadedChapters = {};
let bookmarks = JSON.parse(localStorage.getItem('math_app_bookmarks') || '[]');
let currentFontScale = 1.0;
let isBookmarksOnlyView = false;

// ২৪টি অধ্যায়ের তালিকা (গ্লোবাল সার্চের জন্য)
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

// ব্যাকগ্রাউন্ডে শান্তভাবে অধ্যায়গুলোর অংক ইনডেক্স করা (ব্যবহারকারী টেরও পাবে না)
function indexChaptersSilently() {
  chapterRegistry.forEach(ch => {
    fetch(ch.file)
      .then(res => {
        if (res.ok) return res.text();
        throw new Error('Not found');
      })
      .then(code => {
        try {
          const fn = new Function(code + '; return typeof chapterData !== "undefined" ? chapterData : null;');
          const data = fn();
          if (data && data.questions) {
            allLoadedChapters[ch.id] = data;
          }
        } catch(e) {}
      })
      .catch(() => {});
  });
}

// পেজ ওপেন হলেই ব্যাকগ্রাউন্ডে ইনডেক্স শুরু হবে
window.addEventListener('DOMContentLoaded', () => {
  indexChaptersSilently();
});

// আপনার আদি ও সহজ অধ্যায় লোডার (একদম অপরিবর্তিত)
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
    if (typeof chapterData !== 'undefined' && chapterData) {
      allLoadedChapters[chapterId] = JSON.parse(JSON.stringify(chapterData));
      currentChapterData = allLoadedChapters[chapterId];
      currentQuestions = currentChapterData.questions;
      renderChapterView();
    } else {
      alert("অধ্যায় ডাটা লোড হতে ব্যর্থ হয়েছে!");
    }
  };

  script.onerror = () => {
    alert("এই অধ্যায়ের (" + filePath + ") ফাইলটি data ফোল্ডারে পাওয়া যায়নি!");
  };

  document.body.appendChild(script);
}

function renderChapterView() {
  document.getElementById('chapterIndexGrid').style.display = 'none';
  document.getElementById('chapterContentTray').style.display = 'block';
  document.getElementById('navBackBtn').style.display = 'inline-flex';
  document.getElementById('fontControls').style.display = 'flex';
  document.getElementById('chapterToolbar').style.display = 'flex';

  document.getElementById('pageMainTitle').innerText = currentChapterData.chapterName;

  const searchInput = document.getElementById('spotlightSearch');
  searchInput.placeholder = "এই অধ্যায়ের ভেতরে খুঁজুন...";
  searchInput.value = '';

  renderQuestionCards(currentQuestions, document.getElementById('chapterContentTray'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderQuestionCards(questionsList, containerElement, showChapterBadge = false) {
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

  questionsList.forEach((q) => {
    const card = document.createElement('div');
    card.className = 'math-card';
    card.id = `card-${q.id}`;

    const chapId = q.parentChapterId || (currentChapterData ? currentChapterData.chapterId : 1);
    const isFav = bookmarks.includes(`ch_${chapId}_q_${q.id}`);

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
            const pracSolId = `prac_${q.id}_${idx}`;

            return `
              <div class="practice-item">
                <div class="practice-q-text">${questionText}</div>${hasDirectSolution ? `
                  <button class="practice-toggle-btn" onclick="togglePracticeSolution('${pracSolId}')">
                    <i class="fa-regular fa-lightbulb"></i> সমাধান দেখুন
                  </button>
                  <div id="${pracSolId}" class="practice-sol-box" onclick="togglePracticeSolution('${pracSolId}')" style="display: none;">
                    ${directSolution}
                    <div style="font-size:0.7rem; color:var(--ios-text-tertiary); margin-top:6px; text-align:right;">▲ ট্যাপ করে বন্ধ করুন</div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    const chapterBadgeHTML = showChapterBadge && q.parentChapterName 
      ? `<span class="ios-badge" style="margin-bottom:6px; display:inline-block;">${q.parentChapterName}</span>` 
      : '';

    card.innerHTML = `
      <div class="question-header" onclick="toggleSolution(${q.id})">
        ${chapterBadgeHTML}
        <div class="q-top-row">
          <div class="q-badges">
            <span class="problem-badge">${q.title}</span>
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleBookmark(${q.id}, event, ${chapId})">
              <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
            </button>
          </div>
          <span class="toggle-chip" id="chip-${q.id}">
            <i class="fa-regular fa-eye"></i> সমাধান
          </span>
        </div>
        <div class="question-text">${q.question}</div>
      </div>

      <div id="sol-${q.id}" class="solution-panel" onclick="toggleSolution(${q.id})" style="display: none;">
        <div class="sol-tag-row">
          <span class="sol-tag"><i class="fa-solid fa-check-double"></i> পূর্ণাঙ্গ সমাধান</span>
          <span class="sol-close-hint">ট্যাপ করে বন্ধ করুন</span>
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

function toggleSolution(id) {
  const sol = document.getElementById(`sol-${id}`);
  const chip = document.getElementById(`chip-${id}`);
  if (!sol) return;

  if (sol.style.display === 'none') {
    sol.style.display = 'block';
    if (chip) chip.innerHTML = '<i class="fa-regular fa-eye-slash"></i> বন্ধ করুন';
  } else {
    sol.style.display = 'none';
    if (chip) chip.innerHTML = '<i class="fa-regular fa-eye"></i> সমাধান';
  }
}

function togglePracticeSolution(solId) {
  const el = document.getElementById(solId);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise([el]);
  }
}

function toggleAllSolutions(expand) {
  currentQuestions.forEach(q => {
    const sol = document.getElementById(`sol-${q.id}`);
    const chip = document.getElementById(`chip-${q.id}`);
    if (sol && chip) {
      sol.style.display = expand ? 'block' : 'none';
      chip.innerHTML = expand ? '<i class="fa-regular fa-eye-slash"></i> বন্ধ করুন' : '<i class="fa-regular fa-eye"></i> সমাধান';
    }
  });
}

function goBackToIndex() {
  document.getElementById('chapterIndexGrid').style.display = 'grid';
  document.getElementById('chapterContentTray').style.display = 'none';
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
  
  // ক্লিয়ার করা সার্চ রেজাল্ট যদি থাকে
  const oldResults = document.getElementById('searchResultBox');
  if (oldResults) oldResults.remove();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// আসল গ্লোবাল সার্চ লজিক
function onSearchInput(val) {
  const query = val.trim().toLowerCase();
  const clearBtn = document.getElementById('clearSearchBtn');
  clearBtn.style.display = query ? 'block' : 'none';

  const isIndexView = document.getElementById('chapterContentTray').style.display === 'none';

  if (!query) {
    if (isIndexView) {
      const cards = document.querySelectorAll('.ios-card');
      cards.forEach(c => c.style.display = 'flex');
      const oldResults = document.getElementById('searchResultBox');
      if (oldResults) oldResults.remove();
    } else {
      renderQuestionCards(currentQuestions, document.getElementById('chapterContentTray'));
    }
    return;
  }

  if (isIndexView) {
    // ১. অধ্যায়ের নাম ফিল্টার করা
    const cards = document.querySelectorAll('.ios-card');
    cards.forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(query) ? 'flex' : 'none';
    });

    // ২. সব অধ্যায়ের অংকের মধ্যে খোঁজ করা
    const matchedQuestions = [];
    Object.keys(allLoadedChapters).forEach(chId => {
      const chap = allLoadedChapters[chId];
      if (chap && chap.questions) {
        chap.questions.forEach(q => {
          const inQuestion = q.question && q.question.toLowerCase().includes(query);
          const inTitle = q.title && q.title.toLowerCase().includes(query);
          const inSol = q.solution && q.solution.toLowerCase().includes(query);
          
          let inPractice = false;
          if (q.practice) {
            inPractice = q.practice.some(p => {
              const pText = typeof p === 'object' ? (p.question + ' ' + p.solution) : p;
              return pText.toLowerCase().includes(query);
            });
          }

          if (inQuestion || inTitle || inSol || inPractice) {
            matchedQuestions.push({
              ...q,
              parentChapterId: chap.chapterId,
              parentChapterName: chap.chapterName
            });
          }
        });
      }
    });

    // রেজাল্ট দেখানোর কন্টেইনার
    let searchResultBox = document.getElementById('searchResultBox');
    if (!searchResultBox) {
      searchResultBox = document.createElement('div');
      searchResultBox.id = 'searchResultBox';
      searchResultBox.style.marginBottom = '20px';
      const bodyMain = document.querySelector('.ios-body');
      bodyMain.insertBefore(searchResultBox, document.getElementById('chapterIndexGrid'));
    }

    if (matchedQuestions.length > 0) {
      searchResultBox.innerHTML = `
        <div style="font-size: 0.85rem; font-weight: 700; color: var(--ios-blue); margin-bottom: 10px; display:flex; align-items:center; gap:6px;">
          <i class="fa-solid fa-magnifying-glass"></i> "${query}" সম্পর্কিত ${matchedQuestions.length}টি অংক পাওয়া গেছে:
        </div>
        <div id="searchInnerCards"></div>
      `;
      renderQuestionCards(matchedQuestions, document.getElementById('searchInnerCards'), true);
    } else {
      searchResultBox.innerHTML = '';
    }

  } else {
    // নির্দিষ্ট অধ্যায়ের ভেতরে সার্চ
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

function toggleBookmark(questionId, event, chapterId) {
  event.stopPropagation();
  const chapId = chapterId || (currentChapterData ? currentChapterData.chapterId : 1);
  const key = `ch_${chapId}_q_${questionId}`;
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

function adjustFontSize(delta) {
  currentFontScale = Math.min(Math.max(0.85, currentFontScale + delta * 0.08), 1.35);
  document.documentElement.style.setProperty('--math-font-size', `${currentFontScale}rem`);
}

// Scratchpad Engine
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
