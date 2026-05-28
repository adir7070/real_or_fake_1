from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import torch
import torch.nn as nn


def save_checkpoint(
    model: nn.Module,
    path: str | Path,
    meta: dict[str, Any] | None = None,
) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), path)
    if meta is not None:
        meta_path = path.with_suffix(".ckpt.json")
        meta_path.write_text(json.dumps(meta, indent=2))


def load_checkpoint(
    path: str | Path,
    model: nn.Module,
    device: torch.device | str = "cpu",
) -> nn.Module:
    path = Path(path)
    state = torch.load(path, map_location=device, weights_only=True)
    if isinstance(state, dict) and "state_dict" in state:
        state = state["state_dict"]
    model.load_state_dict(state)
    return model
