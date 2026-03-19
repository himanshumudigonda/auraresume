// Global State
let userSkills = [];
let jobAnalysis = null;
let currentResumeData = null;

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    initTagInput();
    initSmoothScroll();
});

// 1. TAG INPUT SYSTEM
function initTagInput() {
    const input = document.getElementById('skillsInput');
    const container = document.getElementById('skillsContainer');

    function createTag(text) {
        text = text.trim();
        if (text && !userSkills.includes(text)) {
            userSkills.push(text);
            const chip = document.createElement('div');
            chip.className = 'tag-chip';
            chip.innerHTML = `${text} <span class="tag-close" onclick="removeTag('${escapeHtml(text)}', this)">×</span>`;
            container.insertBefore(chip, input);
            input.value = '';
        }
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            createTag(input.value);
        }
    });

    window.removeTag = (text, element) => {
        userSkills = userSkills.filter(s => s !== unescapeHtml(text));
        element.parentElement.remove();
    };
}

// Security: simple HTML escaper
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
function unescapeHtml(safe) {
    return safe
         .replace(/&amp;/g, "&")
         .replace(/&lt;/g, "<")
         .replace(/&gt;/g, ">")
         .replace(/&quot;/g, "\"")
         .replace(/&#039;/g, "'");
}

// 2. SMOOTH SCROLL
function initSmoothScroll() {
    document.querySelectorAll('.nav-links a, footer a, .hero-buttons a, .hero-buttons button').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href') || (this.onclick && this.onclick.toString().match(/'#(.*?)'/)?.[1]);
            const targetId = href?.replace('#', '');
            if (targetId) {
                const element = document.getElementById(targetId);
                if(element) {
                    e.preventDefault();
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

// 3. analyzeJob()
async function analyzeJob() {
    const company = document.getElementById('company').value.trim();
    const jobTitle = document.getElementById('jobTitle').value.trim();
    const jobDescription = document.getElementById('jobDescription').value.trim();

    if (!company || !jobTitle || !jobDescription) {
        showToast("Please fill in Company, Job Title, and Description.", "error");
        return;
    }

    // Toggle UI States
    document.getElementById('researchEmpty').classList.add('hidden');
    document.getElementById('researchLoaded').classList.add('hidden');
    document.getElementById('researchLoading').classList.remove('hidden');

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company, jobTitle, jobDescription })
        });
        
        if (!response.ok) throw new Error("Analysis failed. Rate limit or server error.");

        const data = await response.json();
        jobAnalysis = data;
        renderAnalysisPanel(data);
    } catch (e) {
        console.error(e);
        showToast("AI is analyzing carefully, but encountered an error. Please try again.", "error");
        // Revert to empty state
        document.getElementById('researchLoading').classList.add('hidden');
        document.getElementById('researchEmpty').classList.remove('hidden');
    }
}

// 4. renderAnalysisPanel
function renderAnalysisPanel(data) {
    document.getElementById('researchLoading').classList.add('hidden');
    document.getElementById('researchLoaded').classList.remove('hidden');
    
    // Populate simple data
    document.getElementById('companyNameFound').textContent = data.company_meta?.name || document.getElementById('company').value;
    document.getElementById('companyInitial').textContent = (data.company_meta?.name || document.getElementById('company').value).charAt(0).toUpperCase();
    document.getElementById('companyDetails').textContent = `${data.company_meta?.industry || 'Tech'} • ${data.company_meta?.size || 'Enterprise'}`;

    document.getElementById('matchScore').textContent = data.match_score + '%';
    document.getElementById('atsScore').textContent = data.ats_score;
    
    // Keywords hit logic (mocking count if missing)
    const totalKeywords = (data.match_analysis?.keywords_must?.length || 0) + (data.match_analysis?.keywords_good?.length || 0);
    document.getElementById('keywordsHit').textContent = `${data.match_analysis?.keywords_hit_count || Math.floor(totalKeywords * 0.8)}/${totalKeywords}`;

    // Render chips
    const chipContainer = document.getElementById('keywordChips');
    chipContainer.innerHTML = '';
    
    const appendChips = (arr, colorClass) => {
        if(!arr) return;
        arr.forEach(k => {
            const span = document.createElement('span');
            span.className = `k-chip ${colorClass}`;
            span.textContent = k;
            chipContainer.appendChild(span);
        });
    };

    appendChips(data.match_analysis?.keywords_must, 'k-red');
    appendChips(data.match_analysis?.keywords_good, 'k-green');
    appendChips(data.match_analysis?.keywords_bonus, 'k-gold');

    // Values list
    const valuesList = document.getElementById('companyValuesList');
    valuesList.innerHTML = '';
    if(data.company_values) {
        data.company_values.forEach(v => {
            const li = document.createElement('li');
            li.textContent = v;
            valuesList.appendChild(li);
        });
    }
}

// 5. generateResume()
async function generateResume() {
    const requiredIds = ['fullName', 'experience', 'email', 'phone', 'degree', 'achievement'];
    let valid = true;
    for(let id of requiredIds) {
        const el = document.getElementById(id);
        if(!el.value.trim()) {
            el.style.borderColor = 'red';
            valid = false;
        } else {
            el.style.borderColor = 'var(--border)';
        }
    }
    if(!valid || userSkills.length === 0) {
        showToast("Please complete STEP 2 and add at least one skill.", "error");
        return;
    }

    if (!jobAnalysis) {
         showToast("Please Analyze the job first.", "error");
         return;
    }

    const payload = {
        company: document.getElementById('company').value.trim(),
        jobTitle: document.getElementById('jobTitle').value.trim(),
        jobDescription: document.getElementById('jobDescription').value.trim(),
        name: document.getElementById('fullName').value.trim(),
        experience: document.getElementById('experience').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        skills: userSkills,
        degree: document.getElementById('degree').value.trim(),
        achievement: document.getElementById('achievement').value.trim(),
        linkedin: document.getElementById('linkedin').value.trim(),
        github: document.getElementById('github').value.trim(),
        keywords: [
            ...(jobAnalysis.match_analysis?.keywords_must || []),
            ...(jobAnalysis.match_analysis?.keywords_good || [])
        ]
    };

    showLoadingOverlay([
        "🔍 Researching company...",
        "🎨 Designing your resume...",
        "✍️ Writing tailored content...",
        "✅ Finalising..."
    ]);

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error("Generation failed.");
        
        const result = await response.json();
        currentResumeData = result.resume; // store for download
        
        renderResume(result.resume, result.scores);
        renderInterviewIntel(result.intel, payload.company);
        
        hideLoadingOverlay();
        document.getElementById('result').classList.remove('hidden');
        document.getElementById('interview-intel').classList.remove('hidden');
        // Scroll to result smoothly, with a slight delay to allow rendering
        setTimeout(() => document.getElementById('result').scrollIntoView({behavior: 'smooth'}), 100);
        showToast("Resume generated successfully!", "success");
    } catch (e) {
        console.error(e);
        hideLoadingOverlay();
        showToast("Failed to generate resume. Please try again.", "error");
    }
}

// 6. renderResume
function renderResume(resume, scores) {
    document.getElementById('resName').textContent = resume.name;
    document.getElementById('resRole').textContent = resume.role.toUpperCase();
    
    // Contact
    let contactHtml = [];
    if(resume.email) contactHtml.push(`<span>📧 ${escapeHtml(resume.email)}</span>`);
    if(resume.phone) contactHtml.push(`<span>📱 ${escapeHtml(resume.phone)}</span>`);
    if(resume.linkedin) contactHtml.push(`<span>🔗 ${escapeHtml(resume.linkedin)}</span>`);
    if(resume.github) contactHtml.push(`<span>💻 ${escapeHtml(resume.github)}</span>`);
    document.getElementById('resContact').innerHTML = contactHtml.join(' &nbsp;|&nbsp; ');

    // Summary
    document.getElementById('resSummary').textContent = resume.summary;
    
    // Experience
    const expContainer = document.getElementById('resExperience');
    expContainer.innerHTML = '';
    if(resume.experience) {
        resume.experience.forEach(job => {
            const block = document.createElement('div');
            block.className = 'job-block';
            let bulletsHtml = job.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('');
            block.innerHTML = `
                <div class="job-header">
                    <span class="job-company">${escapeHtml(job.company)}</span>
                    <span class="job-dates">${escapeHtml(job.duration)}</span>
                </div>
                <div class="job-title">${escapeHtml(job.title)}</div>
                <ul class="job-bullets">${bulletsHtml}</ul>
            `;
            expContainer.appendChild(block);
        });
    }

    // Skills
    const skillsContainer = document.getElementById('resSkills');
    skillsContainer.innerHTML = '';
    if(resume.skills) {
        resume.skills.forEach(skill => {
            const s = document.createElement('span');
            s.className = 'res-skill-tag';
            s.textContent = skill;
            skillsContainer.appendChild(s);
        });
    }

    // Education
    document.getElementById('resEducation').textContent = resume.degree;

    // Certs
    const certsContainer = document.getElementById('resCertsContainer');
    const certsList = document.getElementById('resCertifications');
    if (resume.certifications && resume.certifications.length > 0) {
        certsContainer.style.display = 'block';
        certsList.innerHTML = resume.certifications.map(c => `<li>${escapeHtml(c)}</li>`).join('');
    } else {
        certsContainer.style.display = 'none';
        certsList.innerHTML = '';
    }

    // Links sidebar
    let linksHtml = [];
    if(resume.linkedin) linksHtml.push(`<li><strong>LinkedIn:</strong><br><a href="${escapeHtml(resume.linkedin)}" target="_blank">${escapeHtml(resume.linkedin)}</a></li>`);
    if(resume.github) linksHtml.push(`<li><strong>GitHub:</strong><br><a href="${escapeHtml(resume.github)}" target="_blank">${escapeHtml(resume.github)}</a></li>`);
    document.getElementById('resLinks').innerHTML = linksHtml.join('');

    // ATS Gauge update
    if (scores && scores.ats) {
        document.getElementById('finalAtsScore').textContent = scores.ats;
        document.getElementById('atsGauge').style.background = `conic-gradient(var(--sage) 0% ${scores.ats}%, #333 ${scores.ats}% 100%)`;
    }
}

// 7. renderInterviewIntel
function renderInterviewIntel(intel, companyName) {
    document.getElementById('intelCompanyName').textContent = companyName;

    const fillList = (id, items) => {
        const el = document.getElementById(id);
        el.innerHTML = '';
        if(items) {
            items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                el.appendChild(li);
            });
        }
    };

    fillList('intelCulture', intel.culture_points);
    fillList('intelTips', intel.interview_tips);

    if (intel.salary) {
        document.getElementById('intelSalaryRange').textContent = `${intel.salary.min} - ${intel.salary.max}`;
        fillList('intelSalaryNotes', intel.salary.notes);
    }

    const qContainer = document.getElementById('intelQuestions');
    qContainer.innerHTML = '';
    if (intel.interview_questions) {
        intel.interview_questions.forEach((q, idx) => {
            const box = document.createElement('div');
            box.className = 'question-box';
            let formattedType = q.type.charAt(0).toUpperCase() + q.type.slice(1);
            if(formattedType !== 'Technical' && formattedType !== 'Behavioural' && formattedType !== 'Situational') {
                formattedType = 'Technical'; // fallback
            }
            box.innerHTML = `
                <span class="q-num">QUESTION 0${idx + 1}</span>
                <p class="q-text">${escapeHtml(q.question)}</p>
                <span class="q-tag q-type-${formattedType}">${formattedType}</span>
            `;
            qContainer.appendChild(box);
        });
    }
}

// 8. downloadPDF
async function downloadPDF() {
    if(!currentResumeData) return;
    const btn = document.getElementById('btnDownloadPDF');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Generating PDF...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/download/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume: currentResumeData })
        });
        
        if (!response.ok) throw new Error("Failed to download PDF");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentResumeData.name.replace(/\\s+/g, '_')}_Resume.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (e) {
        console.error(e);
        showToast("Error downloading PDF.", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 9. downloadWord
async function downloadWord() {
    if(!currentResumeData) return;
    const btn = document.getElementById('btnDownloadWord');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Generating Word...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/download/word', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume: currentResumeData })
        });
        
        if (!response.ok) throw new Error("Failed to download DOCX");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentResumeData.name.replace(/\\s+/g, '_')}_Resume.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (e) {
        console.error(e);
        showToast("Error downloading Word doc.", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 11. Toast notification system
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    // Basic icon depending on type
    const icon = type === 'error' ? '❌ ' : (type === 'success' ? '✅ ' : 'ℹ️ ');
    toast.innerHTML = `<span>${icon}${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 12. Loading overlay
let loadingInterval;
function showLoadingOverlay(steps) {
    const overlay = document.getElementById('loadingOverlay');
    const container = document.getElementById('loadingSteps');
    container.innerHTML = '';
    
    steps.forEach((step, idx) => {
        const el = document.createElement('div');
        el.className = 'load-step';
        el.id = `step-${idx}`;
        el.innerHTML = escapeHtml(step);
        container.appendChild(el);
    });

    overlay.classList.remove('hidden');

    let currentStep = 0;
    const processStep = () => {
        if (currentStep > 0) {
            document.getElementById(`step-${currentStep - 1}`).classList.add('done');
            document.getElementById(`step-${currentStep - 1}`).classList.remove('active');
        }
        if (currentStep < steps.length) {
            document.getElementById(`step-${currentStep}`).classList.add('active');
            currentStep++;
            loadingInterval = setTimeout(processStep, 2000); // Wait 2s per step
        }
    };
    
    // Start sequence
    setTimeout(processStep, 100);
}

function hideLoadingOverlay() {
    clearTimeout(loadingInterval);
    document.getElementById('loadingOverlay').classList.add('hidden');
}
