from .client import APIClient
from typing import Optional, Dict, Any, List, Generator


class SandboxManager:
    def __init__(self, client: APIClient):
        self.client = client

    def create(
        self,
        name: Optional[str] = None,
        image: str = "node:20-slim",
        vcpu_count: int = 1,
        memory_mb: int = 512,
        gpu_type: Optional[str] = None,
        egress_rules: Optional[List[str]] = None,
    ) -> "Sandbox":
        payload = {"image": image, "vcpu_count": vcpu_count, "memory_mb": memory_mb}
        if name:
            payload["name"] = name
        if gpu_type:
            payload["gpu_type"] = gpu_type
        if egress_rules:
            payload["egress_rules"] = egress_rules

        data = self.client._request("POST", "/v1/compute/sandboxes", json=payload)
        return Sandbox(self.client, data)

    def list(self) -> List[Dict[str, Any]]:
        data = self.client._request("GET", "/v1/compute/sandboxes")
        return data.get("data", [])

    def get(self, sandbox_id: str) -> "Sandbox":
        sandboxes = self.list()
        for s in sandboxes:
            if s["sandbox_id"] == sandbox_id:
                return Sandbox(self.client, s)
        raise ValueError(f"Sandbox {sandbox_id} not found")

    def usage(self) -> Dict[str, Any]:
        return self.client._request("GET", "/v1/compute/usage")


class Sandbox:
    def __init__(self, client: APIClient, data: Dict[str, Any]):
        self.client = client
        self.sandbox_id = data["sandbox_id"]
        self.daytona_id = data.get("daytona_id") or data.get("daytona_sandbox_id")
        self.status = data.get("status", "running")
        self.vcpu_count = data.get("vcpu_count", 1)
        self.memory_mb = data.get("memory_mb", 512)
        self.gpu_type = data.get("gpu_type")
        self.vcpu_rate = data.get("vcpu_rate", 0.15)
        self._data = data

    def run_code(self, code: str, language: str = "python", timeout: int = 30) -> Dict[str, Any]:
        return self.client._request(
            "POST",
            f"/v1/compute/sandboxes/{self.sandbox_id}/code-run",
            json={"code": code, "language": language, "timeout": timeout},
        )

    def logs(self) -> Generator[str, None, None]:
        return self.client.stream(f"/v1/compute/sandboxes/{self.sandbox_id}/logs/stream")

    def snapshot(self, name: Optional[str] = None) -> Dict[str, Any]:
        payload = {"sandbox_id": self.sandbox_id}
        if name:
            payload["name"] = name
        return self.client._request("POST", "/v1/compute/snapshots", json=payload)

    def destroy(self) -> Dict[str, Any]:
        return self.client._request("DELETE", f"/v1/compute/sandboxes/{self.sandbox_id}")

    def __repr__(self):
        return f"<Sandbox id={self.sandbox_id} status={self.status} vcpu={self.vcpu_count}>"
