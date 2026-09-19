/* ===================================================================
   iOS Modern Math App Engine (Original Stable Dynamic Loader)
   Author: Bilas Academy Development
   =================================================================== */

let currentChapterData = null;
let currentQuestions = [];
let allLoadedChapters = {};
let bookmarks = JSON.parse(localStorage.getItem('math_app_bookmarks') || '[]');
let currentFontScale = 1.0;
let isBookmarksOnlyView = false;

// আপনার আদি ও সহজ অধ্যায় লোডার
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
    // ফাইলে chapterData থাকলে সরাসরি নিয়ে নেবে
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

function renderQuestionCards(questionsList, containerElement) {
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

    const isFav = bookmarks.includes(`ch_${currentChapterData.chapterId}_q_${q.id}`);

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

    card.innerHTML = `
      <div class="question-header" onclick="toggleSolution(${q.id})">
        <div class="q-top-row">
          <div class="q-badges">
            <span class="problem-badge">${q.title}</span>
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleBookmark(${q.id}, event)">
              <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
            </button>
          </div>
          <span class="toggle-chip" id="chip-${q.id}">
            <i class="fa-regular fa-eye"></i> সমাধান
          </span>
        </div>
        <div class="question-text">${q.question}</div>
      </div>

      <!-- উত্তরের বডিতে চাপ দিলেও হাইড হবে -->
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onSearchInput(val) {
  const query = val.trim().toLowerCase();
  const clearBtn = document.getElementById('clearSearchBtn');
  clearBtn.style.display = query ? 'block' : 'none';

  const isIndexView = document.getElementById('chapterContentTray').style.display === 'none';

  if (isIndexView) {
    const cards = document.querySelectorAll('.ios-card');
    cards.forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(query) ? 'flex' : 'none';
    });
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

function toggleBookmark(questionId, event) {
  event.stopPropagation();
  const key = `ch_${currentChapterData.chapterId}_q_${questionId}`;
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

// Scratchpad
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
