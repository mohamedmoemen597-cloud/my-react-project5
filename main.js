import { generateExam } from './gemini.js';
import { CURRICULUM } from './data.js';

// --- Global State ---
const state = {
    student: null, // { name, code, group }
    view: 'login', // login, dashboard, exam, results
    examConfig: null,
    questions: [],
    answers: new Map(), // index -> optionIndex
    currentQuestionIndex: 0,
    score: 0,
    loading: false
};

// --- DOM Elements ---
const els = {
    header: document.getElementById('app-header'),
    headerName: document.getElementById('header-name'),
    headerGroup: document.getElementById('header-group'),
    headerAvatar: document.getElementById('header-avatar'),
    logoutBtn: document.getElementById('logout-btn'),
    
    views: {
        login: document.getElementById('login-view'),
        dashboard: document.getElementById('dashboard-view'),
        exam: document.getElementById('exam-view'),
        results: document.getElementById('results-view')
    },

    loginForm: document.getElementById('login-form'),
    
    curriculumContainer: document.getElementById('curriculum-container'),
    
    examLoading: document.getElementById('exam-loading'),
    examError: document.getElementById('exam-error'),
    examContent: document.getElementById('exam-content'),
    examTitle: document.getElementById('exam-title'),
    questionCounter: document.getElementById('question-counter'),
    progressBar: document.getElementById('progress-bar'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    finishBtn: document.getElementById('finish-btn'),

    resultExamTitle: document.getElementById('result-exam-title'),
    scoreCircle: document.getElementById('score-circle'),
    scorePercentage: document.getElementById('score-percentage'),
    scoreNumber: document.getElementById('score-number'),
    totalQuestions: document.getElementById('total-questions'),
    performanceMsg: document.getElementById('performance-msg'),
    backToDashBtn: document.getElementById('back-to-dash-btn')
};

// --- Logic & Controllers ---

function updateView() {
    // Hide all views
    Object.values(els.views).forEach(el => el.classList.add('hidden'));
    
    // Show current view
    els.views[state.view].classList.remove('hidden');

    // Header handling
    if (state.student) {
        els.header.classList.remove('hidden');
        els.headerName.textContent = state.student.name;
        els.headerGroup.textContent = `مجموعة: ${state.student.group}`;
        els.headerAvatar.textContent = state.student.name.charAt(0);
    } else {
        els.header.classList.add('hidden');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const name = document.getElementById('login-name').value;
    const code = document.getElementById('login-code').value;
    const group = document.getElementById('login-group').value;

    if (name && code && group) {
        state.student = { name, code, group };
        state.view = 'dashboard';
        renderDashboard();
        updateView();
    }
}

function handleLogout() {
    state.student = null;
    state.view = 'login';
    // Reset form
    document.getElementById('login-name').value = '';
    document.getElementById('login-code').value = '';
    document.getElementById('login-group').value = '';
    updateView();
}

function renderDashboard() {
    els.curriculumContainer.innerHTML = '';
    
    CURRICULUM.forEach((term) => {
        const termDiv = document.createElement('div');
        termDiv.className = "space-y-8";
        
        const titleHtml = `
          <div class="relative text-center">
            <hr class="absolute top-1/2 left-0 w-full border-t border-gray-200" />
            <h2 class="relative inline-block bg-slate-100 px-6 text-2xl font-bold text-gray-700">${term.termTitle}</h2>
          </div>
        `;
        termDiv.innerHTML = titleHtml;

        term.units.forEach((unit) => {
            const unitCard = document.createElement('div');
            unitCard.className = "bg-white p-6 rounded-2xl shadow-lg border border-gray-200/80 transform hover:scale-[1.02] transition-transform duration-300 mb-6";
            
            // Unit Header
            const unitHeader = document.createElement('div');
            unitHeader.className = "flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b-2 border-gray-100";
            unitHeader.innerHTML = `<h3 class="text-xl font-bold text-blue-800 mb-3 sm:mb-0">${unit.title}</h3>`;
            
            const unitBtn = document.createElement('button');
            unitBtn.className = "bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-700 transition-all transform hover:-translate-y-0.5 shadow-md hover:shadow-lg w-full sm:w-auto";
            unitBtn.textContent = "امتحان شامل على الوحدة";
            unitBtn.onclick = () => initExam('Unit', unit.title);
            unitHeader.appendChild(unitBtn);
            unitCard.appendChild(unitHeader);

            // Lessons Grid
            const lessonsGrid = document.createElement('div');
            lessonsGrid.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5";
            
            unit.lessons.forEach(lesson => {
                const lessonCard = document.createElement('div');
                lessonCard.className = "bg-slate-50 p-5 rounded-xl border border-gray-200 flex flex-col justify-between hover:border-blue-400 transition-colors";
                
                lessonCard.innerHTML = `<h4 class="font-semibold text-gray-700 mb-4 h-12">${lesson.title}</h4>`;
                
                const lessonBtn = document.createElement('button');
                lessonBtn.className = "w-full bg-teal-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-600 transition-all shadow hover:shadow-md";
                lessonBtn.textContent = "ابدأ امتحان الدرس";
                lessonBtn.onclick = () => initExam('Lesson', `${unit.title} - ${lesson.title}`);
                
                lessonCard.appendChild(lessonBtn);
                lessonsGrid.appendChild(lessonCard);
            });

            unitCard.appendChild(lessonsGrid);
            termDiv.appendChild(unitCard);
        });

        els.curriculumContainer.appendChild(termDiv);
    });
}

async function initExam(type, title) {
    state.examConfig = {
        type,
        title,
        questionCount: type === 'Unit' ? 10 : 5, // Reduced for demo/speed
        hardQuestions: type === 'Unit' ? 2 : 1
    };
    
    state.view = 'exam';
    state.questions = [];
    state.answers = new Map();
    state.currentQuestionIndex = 0;
    state.loading = true;
    
    updateView();
    renderExamLoading();

    try {
        const questions = await generateExam(state.examConfig);
        state.questions = questions;
        state.loading = false;
        renderExamQuestion();
    } catch (error) {
        state.loading = false;
        renderExamError(error.message);
    }
}

function renderExamLoading() {
    els.examLoading.classList.remove('hidden');
    els.examContent.classList.add('hidden');
    els.examError.classList.add('hidden');
}

function renderExamError(msg) {
    els.examLoading.classList.add('hidden');
    els.examContent.classList.add('hidden');
    els.examError.classList.remove('hidden');
    els.examError.textContent = msg;
}

function renderExamQuestion() {
    els.examLoading.classList.add('hidden');
    els.examContent.classList.remove('hidden');
    els.examError.classList.add('hidden');

    const q = state.questions[state.currentQuestionIndex];
    const total = state.questions.length;
    
    els.examTitle.textContent = state.examConfig.title;
    els.questionCounter.textContent = `${state.currentQuestionIndex + 1} / ${total}`;
    els.progressBar.style.width = `${((state.currentQuestionIndex + 1) / total) * 100}%`;
    els.questionText.textContent = q.questionText;

    // Render Options
    els.optionsContainer.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        const isSelected = state.answers.get(state.currentQuestionIndex) === idx;
        
        btn.className = `w-full text-right p-4 rounded-lg border-2 transition-all text-lg font-semibold ${
            isSelected 
            ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-400 text-blue-800' 
            : 'bg-white border-gray-300 hover:bg-gray-100 hover:border-blue-400 text-gray-700'
        }`;
        btn.textContent = opt;
        btn.onclick = () => {
            state.answers.set(state.currentQuestionIndex, idx);
            renderExamQuestion(); // Re-render to show selection
        };
        els.optionsContainer.appendChild(btn);
    });

    // Buttons logic
    els.prevBtn.disabled = state.currentQuestionIndex === 0;
    
    if (state.currentQuestionIndex === total - 1) {
        els.nextBtn.classList.add('hidden');
        els.finishBtn.classList.remove('hidden');
    } else {
        els.nextBtn.classList.remove('hidden');
        els.finishBtn.classList.add('hidden');
    }
}

function handleNext() {
    if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex++;
        renderExamQuestion();
    }
}

function handlePrev() {
    if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        renderExamQuestion();
    }
}

function finishExam() {
    let score = 0;
    state.questions.forEach((q, idx) => {
        if (state.answers.get(idx) === q.correctAnswerIndex) {
            score++;
        }
    });
    state.score = score;
    state.view = 'results';
    renderResults();
    updateView();
}

function renderResults() {
    const total = state.questions.length;
    const percentage = total > 0 ? (state.score / total) * 100 : 0;
    
    els.resultExamTitle.textContent = state.examConfig.title;
    els.scoreNumber.textContent = state.score;
    els.totalQuestions.textContent = total;
    els.scorePercentage.textContent = `${percentage.toFixed(0)}%`;
    
    // Circle Animation
    const circumference = 283;
    const offset = circumference * (1 - percentage / 100);
    // Small timeout to allow DOM to paint before animating
    setTimeout(() => {
        els.scoreCircle.style.strokeDashoffset = offset;
    }, 100);

    // Message
    let msg = "";
    if (percentage >= 90) msg = "أداء استثنائي! أنت نجم العلوم القادم!";
    else if (percentage >= 75) msg = "عمل رائع! استمر في هذا التقدم المذهل.";
    else if (percentage >= 50) msg = "جيد جداً! لديك أساس قوي، والمزيد من المراجعة سيجعلك ممتازاً.";
    else msg = "بداية جيدة! كل رحلة نجاح تبدأ بخطوة، وهذه خطوتك الأولى.";
    
    els.performanceMsg.textContent = msg;
}

// --- Event Listeners ---
els.loginForm.addEventListener('submit', handleLogin);
els.logoutBtn.addEventListener('click', handleLogout);
els.prevBtn.addEventListener('click', handlePrev);
els.nextBtn.addEventListener('click', handleNext);
els.finishBtn.addEventListener('click', finishExam);
els.backToDashBtn.addEventListener('click', () => {
    state.view = 'dashboard';
    updateView();
});

// --- Init ---
updateView(); // Start at login