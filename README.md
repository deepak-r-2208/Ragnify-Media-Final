# RAGnify Media

RAGnify Media is a fully local Retrieval-Augmented Generation (RAG) web app. Upload your own documents, ask questions by text or voice, and receive answers grounded in retrieved passages from those documents.

## What was reworked

This package is a cleaned and corrected version of the supplied project. The main reliability fixes include:

- Fixed the frontend embedding-model ID mismatch that could cause settings requests to fail with HTTP 400.
- Signup now creates the user's default settings row automatically.
- Duplicate signup returns a clear HTTP 409 instead of a generic 400.
- Removed the requirement to manually create `backend/.env` before Docker Compose can start.
- Added an Ollama initialization service that automatically downloads the required local models on first startup.
- Added Docker health checks and startup dependencies for PostgreSQL and Ollama.
- Kept all LLM, embeddings, OCR, database, and authentication components local.
- Added Windows `.bat` scripts for start, stop, reset, and backend logs.
- Added Python compile checks and a small automated backend test suite.

## Features

- Local signup, login, and verification-code flow
- PDF, DOCX, TXT, MD, CSV, JSON, PNG, JPG, JPEG, WEBP and TIFF ingestion
- OCR for images and scanned PDFs
- Intelligent chunking with overlap
- Ollama embeddings
- Hybrid keyword + vector retrieval
- Grounding gate that refuses unsupported questions
- Local Ollama answer generation
- Source passages shown with every grounded answer
- Persistent conversations
- Voice input through the browser Web Speech API
- Retrieval settings
- No OpenAI key, paid API, or cloud database required

## Recommended setup on Windows

### 1. Install Docker Desktop

Install Docker Desktop for Windows and make sure the WSL 2 backend is enabled. Restart Windows if Docker asks you to.

### 2. Extract this project

Extract the ZIP and open a terminal in the folder containing `docker-compose.yml`.

### 3. Start the complete application

You can double-click:

```text
scripts/start.bat
```

Or run:

```bash
docker compose up -d --build
```

The first startup downloads three local models:

- `all-minilm` — lightweight embeddings
- `nomic-embed-text` — higher-quality embeddings
- `llama3.2:3b` — local chat model

The first run can take several minutes and requires several GB of free disk space.

### 4. Open the application

Open:

```text
http://localhost:5173
```

Backend API documentation:

```text
http://localhost:8000/docs
```

Health check:

```text
http://localhost:8000/health
```

## Useful commands

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f ollama-init
docker compose down
docker compose down -v
```

`docker compose down -v` deletes the local PostgreSQL database and Ollama model volume. Use it when you intentionally want a completely fresh installation.

Windows shortcuts are also included:

```text
scripts/start.bat
scripts/stop.bat
scripts/logs.bat
scripts/reset.bat
```

## Project structure

```text
RAGnify-Media/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── chunking.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── embeddings.py
│   │   ├── llm_client.py
│   │   ├── main.py
│   │   ├── parsing.py
│   │   ├── retrieval.py
│   │   ├── schemas.py
│   │   └── security.py
│   ├── sql/schema.sql
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── scripts/
│   ├── start.bat
│   ├── stop.bat
│   ├── logs.bat
│   └── reset.bat
├── docker-compose.yml
└── README.md
```

## Why the app can say “I don't know”

RAGnify does not send every question directly to the language model. The backend first searches the uploaded chunks. If no chunk passes the relevance gate, the model is not called and the app refuses to guess.

When relevant chunks are found, only those passages plus a short conversation history are sent to the local Ollama model. The answer is stored together with its source passages.

This reduces hallucinations, but it is not a mathematical guarantee that a local language model can never make a mistake. Always verify important information against the source document.

## Authentication note

For a completely local project, the default verification flow displays the six-digit verification code in the application instead of sending an email. No external email provider is required.

Passwords are hashed with bcrypt and login tokens are signed JWTs.

## Important model-setting note

Documents are embedded using the embedding model selected at upload time. Changing the embedding model does not magically convert old documents. Existing documents remain searchable through keyword retrieval, while new uploads use the newly selected embedding model. For best semantic retrieval, keep one embedding model selected for a document collection.

## Included checks

The backend includes lightweight unit tests for chunking and request validation. Run them from the `backend` directory after installing the development requirements:

```bash
pip install -r requirements-dev.txt
python -m unittest discover -s tests -v
```

On Windows, `scripts/test.bat` runs the same test suite.

## If signup says the account already exists

That is not a broken signup endpoint. It means the email is already stored in the local PostgreSQL database.

Use **Sign in**, or, if this is only a test installation and you want to start from zero:

```bash
docker compose down -v
docker compose up -d --build
```

The `-v` option intentionally deletes the local data.

## Troubleshooting

### `POST /auth/signup 400/409`

Check the JSON being sent by the browser. It must contain:

```json
{
  "name": "Your Name",
  "email": "you@example.com",
  "password": "at-least-6-characters"
}
```

If the account already exists, sign in or reset the local database with `docker compose down -v`.

### Backend is not reachable

Run:

```bash
docker compose ps
docker compose logs --tail=200 backend
```

Then open `http://localhost:8000/health`.

### Ollama model error

Run:

```bash
docker compose logs --tail=200 ollama-init
docker compose exec ollama ollama list
```

The expected models are `all-minilm`, `nomic-embed-text`, and `llama3.2:3b`.

### Port already in use

If ports 5173, 8000, 5432, or 11434 are already used by another application, stop that application or change the corresponding host-side port in `docker-compose.yml`.

## Development without Docker

Docker is the supported path because it packages PostgreSQL + pgvector, Ollama, Tesseract, Poppler, Python, and the frontend into one reproducible setup.

If you still want native development, you need:

- Python 3.11+
- Node.js 20+
- PostgreSQL with pgvector
- Ollama
- Tesseract OCR
- Poppler

Then install backend dependencies from `backend/requirements.txt`, initialize `backend/sql/schema.sql`, start Ollama, and run:

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

## License

For academic/project use. Add your own license if you publish or redistribute the project.
