"""RAGnify Media backend — FastAPI application entrypoint.

Run locally with:  uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import close_pool, get_pool, init_pool
from app.routers import chat, documents, settings as settings_router


import asyncio
from app.embeddings import available_models, embed_texts


async def _backfill_embeddings():
    try:
        pool = get_pool()
        for model_name in available_models():
            async with pool.acquire() as conn:
                missing = await conn.fetch(
                    """
                    select c.id, c.content
                    from chunks c
                    left join chunk_embeddings e on e.chunk_id = c.id and e.model_name = $1
                    where e.chunk_id is null
                    limit 500
                    """,
                    model_name,
                )
                if not missing:
                    continue
                texts = [r["content"] for r in missing]
                chunk_ids = [r["id"] for r in missing]
                vectors = await embed_texts(texts, model_name)
                rows = [(cid, model_name, vec) for cid, vec in zip(chunk_ids, vectors)]
                await conn.executemany(
                    """
                    insert into chunk_embeddings (chunk_id, model_name, embedding)
                    values ($1, $2, $3)
                    on conflict (chunk_id, model_name) do update set embedding = excluded.embedding
                    """,
                    rows,
                )
    except Exception as e:
        print(f"Embedding backfill notice: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    asyncio.create_task(_backfill_embeddings())
    yield
    await close_pool()


app = FastAPI(title="RAGnify Media API", version="1.0.0", lifespan=lifespan)

_settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origin_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(settings_router.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
