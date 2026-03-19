<div align="center">
  <h1>✨ AuraResume ✨</h1>
  <p><strong>Your dream job starts with an extraordinary resume.</strong></p>

  <h3><a href="https://resumeaura.netlify.app/">🚀 View Live Demo Here</a></h3>
  
  <p>
    <a href="#features">Features</a> • 
    <a href="#tech-stack">Tech Stack</a> • 
    <a href="#quick-start">Quick Start</a> • 
    <a href="#deployment">Deployment</a>
  </p>
</div>

<br/>

AuraResume is a high-performance, **100% stateless AI-powered career platform**. 

Built with Vanilla Web Technologies on the frontend and FastAPI on the backend, AuraResume utilizes the power of **NVIDIA NIM** LLMs for elite career coaching. It analyzes job descriptions, searches the internet for company culture, generates ATS-optimized resumes (scoring 90%+), and prepares you for interviews with pinpoint accuracy.

*If you like this project, please consider giving it a ⭐!*

## 🚀 Features
- **Stateless Architecture**: No databases required. Operates purely in-memory.
- **AI Web Researcher**: Uses powerful LLMs to search for critical ATS keywords, company values, and culture fits.
- **Parallel Generation**: Implements `asyncio.gather` for blazing fast concurrent generation of the Resume and the Interview Intelligence.
- **ATS Guaranteed**: Bullet points are explicitly formulated with action-verbs, metrics, and required keywords to bypass corporate applicant tracking systems.
- **Instant Export**: Download your generated resume as a beautifully formatted PDF (via `reportlab`) or an editable Word Document (via `python-docx`) directly from memory.

## 💻 Tech Stack
- **Frontend**: Vanilla HTML5, CSS3 (Custom Variables, Flexbox/Grid), Vanilla JavaScript (Zero dependencies!)
- **Backend**: Python 3, FastAPI, Uvicorn
- **AI Framework**: NVIDIA NIM APIs (`llama-3.1-nemotron-ultra`, `gpt-oss-120b`, `deepseek-r1`, etc.)
- **Deployments**: Configured natively for Netlify (Frontend) and Render (Backend).

## 🛠️ Quick Start (Local Development)

### 1. Backend Setup
1. Navigate to the backend folder: `cd backend`
2. Install Python dependencies: `pip install -r requirements.txt`
3. Add your NVIDIA NIM API key: Open `.env` and set `NVIDIA_API_KEY=your_key_here`
4. Start the server: `uvicorn main:app --reload`
*The API will be available at `http://localhost:8000`*

### 2. Frontend Setup
AuraResume requires no build step! Simply open the `frontend/index.html` file in your preferred browser, or use a lightweight development server like Live Server (VS Code).

## 🌍 Production Deployment

The codebase includes out-of-the-box support for free-tier deployments:

1. **Backend to Render**: Connect your GitHub repository to Render and specify the repository root. Render will automatically read the `backend/render.yaml` configuration. Add your `NVIDIA_API_KEY` as an environment variable in Render.
2. **Frontend to Netlify**: Connect your GitHub repository to Netlify and set the publish directory to `frontend/`. 
3. **CORS Linking**: Finally, update the `frontend/netlify.toml` file so that the redirect URL points to your new live `.onrender.com` backend URL.
