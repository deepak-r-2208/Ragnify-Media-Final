"""Application settings, loaded from environment variables (.env in local dev).

Nothing here requires a paid service: DATABASE_URL points at a local
Postgres (e.g. the docker-compose `db` service), and OLLAMA_BASE_URL points
at a local Ollama instance. No API keys required anywhere.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Local Postgres connection string. In docker-compose this is overridden
    # to point at the `db` service; for non-Docker local dev it defaults to
    # a Postgres running on your own machine.
    database_url: str = "postgresql://ragnify:ragnify@localhost:5432/ragnify"

    # Local Ollama instance. In docker-compose this is overridden to
    # http://ollama:11434 (the service name); for non-Docker local dev it
    # defaults to Ollama running on your own machine.
    ollama_base_url: str = "http://localhost:11434"
    ollama_chat_model: str = "llama3.2:3b"

    # Comma-separated list of origins allowed to call this API.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Retrieval tuning. min_relevance_score is the minimum cosine similarity a
    # chunk needs (or a literal keyword hit) to count as relevant; below it the
    # app refuses to answer rather than guess. 0.3 suits the bundled Ollama
    # embedding models — raise it for stricter grounding.
    top_k: int = 3
    min_relevance_score: float = 0.3

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
