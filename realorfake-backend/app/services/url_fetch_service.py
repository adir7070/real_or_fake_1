import httpx

from app.api.errors import URLFetchError


class URLFetchService:
    def __init__(self, timeout_s: int, max_mb: int, user_agent: str) -> None:
        self.timeout_s = timeout_s
        self.max_bytes = max_mb * 1024 * 1024
        self.user_agent = user_agent

    async def fetch(self, url: str) -> tuple[bytes, str | None]:
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout_s,
                headers={"User-Agent": self.user_agent},
                follow_redirects=True,
            ) as client:
                async with client.stream("GET", url) as resp:
                    if resp.status_code >= 400:
                        raise URLFetchError(f"Upstream returned {resp.status_code}")
                    content_type = resp.headers.get("content-type")
                    chunks: list[bytes] = []
                    total = 0
                    async for chunk in resp.aiter_bytes():
                        total += len(chunk)
                        if total > self.max_bytes:
                            raise URLFetchError("Remote file too large")
                        chunks.append(chunk)
                    return b"".join(chunks), content_type
        except (URLFetchError):
            raise
        except httpx.HTTPError as e:
            raise URLFetchError("URL fetch failed", detail=str(e)) from e
