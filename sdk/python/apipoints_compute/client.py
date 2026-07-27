import httpx
from typing import Optional, Dict, Any, Generator


class APIClient:
    def __init__(self, api_key: str, base_url: str = "https://apipoints-worker.francis-e3b.workers.dev"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "X-APIPOINTS-Key": api_key,
            "Content-Type": "application/json",
        }

    def _request(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        with httpx.Client(timeout=60) as client:
            response = client.request(method, url, headers=self.headers, **kwargs)
            response.raise_for_status()
            return response.json()

    def stream(self, path: str) -> Generator[str, None, None]:
        url = f"{self.base_url}{path}"
        with httpx.Client(timeout=300) as client:
            with client.stream("GET", url, headers=self.headers) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if line.startswith("data: "):
                        yield line[6:]
