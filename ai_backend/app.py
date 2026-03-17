from io import BytesIO
import importlib
import os
from typing import Any

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app = FastAPI(title="AI Fit Style Assistant", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COLOR_LOOKUP = {
    "#000000": "Black",
    "#ffffff": "White",
    "#808080": "Gray",
    "#1f2937": "Charcoal",
    "#1d4ed8": "Royal Blue",
    "#2563eb": "Blue",
    "#0f766e": "Teal",
    "#166534": "Deep Green",
    "#7c2d12": "Rust",
    "#92400e": "Amber",
    "#a16207": "Mustard",
    "#7c3aed": "Violet",
    "#be123c": "Rose",
    "#dc2626": "Red",
    "#f59e0b": "Orange",
    "#fbbf24": "Golden",
    "#d97706": "Saffron",
    "#78350f": "Brown",
    "#f5f5dc": "Beige",
    "#0b132b": "Navy"
}

VLM_CACHE: dict[str, Any] = {
    "loaded": False,
    "available": None,
    "processor": None,
    "model": None,
    "device": "cpu",
    "model_name": None,
    "reason": "Not initialized",
}


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def nearest_named_color(hex_color: str) -> str:
    target = np.array(
        [
            int(hex_color[1:3], 16),
            int(hex_color[3:5], 16),
            int(hex_color[5:7], 16),
        ]
    )

    nearest_name = "Tone"
    best_distance = float("inf")

    for known_hex, name in COLOR_LOOKUP.items():
        known = np.array(
            [
                int(known_hex[1:3], 16),
                int(known_hex[3:5], 16),
                int(known_hex[5:7], 16),
            ]
        )
        distance = float(np.linalg.norm(target - known))
        if distance < best_distance:
            best_distance = distance
            nearest_name = name

    return nearest_name


def extract_dominant_colors(image: Image.Image, color_count: int = 5) -> list[dict[str, Any]]:
    small = image.convert("RGB").resize((180, 180))
    quantized = small.convert("P", palette=Image.ADAPTIVE, colors=color_count)

    color_counts = quantized.getcolors(maxcolors=180 * 180) or []
    palette = quantized.getpalette() or []

    if not color_counts or not palette:
        return []

    total_pixels = sum(count for count, _ in color_counts)
    sorted_counts = sorted(color_counts, key=lambda item: item[0], reverse=True)

    results: list[dict[str, Any]] = []
    for count, palette_index in sorted_counts[:color_count]:
        base = palette_index * 3
        rgb = (
            int(palette[base]),
            int(palette[base + 1]),
            int(palette[base + 2]),
        )
        hex_color = rgb_to_hex(rgb)
        percentage = round((count / max(total_pixels, 1)) * 100, 1)
        results.append(
            {
                "hex": hex_color,
                "name": nearest_named_color(hex_color),
                "percentage": percentage,
                "rgb": {"r": rgb[0], "g": rgb[1], "b": rgb[2]},
            }
        )

    return results


def luminance(rgb: dict[str, int]) -> float:
    return 0.2126 * rgb["r"] + 0.7152 * rgb["g"] + 0.0722 * rgb["b"]


def warmth(rgb: dict[str, int]) -> float:
    return float(rgb["r"] - rgb["b"])


def infer_style_direction(primary_rgb: dict[str, int]) -> str:
    lightness = luminance(primary_rgb)
    temp = warmth(primary_rgb)

    if lightness > 180:
        base = "Light and Minimal"
    elif lightness < 80:
        base = "Dark and Bold"
    else:
        base = "Balanced Everyday"

    if temp > 15:
        return f"{base} with Warm Undertones"
    if temp < -15:
        return f"{base} with Cool Undertones"
    return f"{base} with Neutral Undertones"


def build_color_advice(primary_rgb: dict[str, int], dominant_colors: list[dict[str, Any]]) -> list[str]:
    temp = warmth(primary_rgb)

    if temp > 15:
        pairings = ["ivory", "olive", "camel", "deep navy", "rust"]
    elif temp < -15:
        pairings = ["charcoal", "white", "steel blue", "emerald", "lavender"]
    else:
        pairings = ["black", "white", "beige", "navy", "forest green"]

    highlights = ", ".join(color["name"] for color in dominant_colors[:3])

    return [
        f"Your image leans toward {highlights}.",
        f"Try pairings like {', '.join(pairings[:3])} for easy coordination.",
        f"Use one accent from {pairings[3]} or {pairings[4]} to add contrast.",
    ]


def build_outfit_ideas(style_direction: str, dominant_colors: list[dict[str, Any]]) -> list[str]:
    top_color = dominant_colors[0]["name"] if dominant_colors else "neutral"
    second_color = dominant_colors[1]["name"] if len(dominant_colors) > 1 else "white"

    return [
        f"Smart casual: {top_color} top with charcoal trousers and clean sneakers.",
        f"Street casual: {second_color} tee, relaxed denims, and a lightweight overshirt.",
        "Ethnic fusion: solid kurta with tapered bottoms and a minimal layer in a complementary tone.",
        f"Work-ready: structured shirt in {second_color} with dark bottoms and simple accessories.",
    ]


def build_caption(style_direction: str, dominant_colors: list[dict[str, Any]]) -> str:
    color_names = ", ".join(color["name"] for color in dominant_colors[:3])
    return f"Detected a {style_direction.lower()} look with dominant shades of {color_names}."


def infer_style_from_caption(caption: str) -> str | None:
    text = (caption or "").lower()
    if not text:
        return None

    if any(word in text for word in ["blazer", "suit", "formal", "office", "shirt"]):
        return "Smart and Structured"
    if any(word in text for word in ["hoodie", "street", "oversized", "sneaker", "denim"]):
        return "Street Casual"
    if any(word in text for word in ["kurta", "ethnic", "dupatta", "embroidered"]):
        return "Ethnic Contemporary"
    if any(word in text for word in ["sport", "athletic", "active", "training", "jogger"]):
        return "Athleisure"
    if any(word in text for word in ["minimal", "clean", "solid", "neutral"]):
        return "Minimal Everyday"

    return None


def load_vlm_model() -> dict[str, Any]:
    if VLM_CACHE["loaded"]:
        return VLM_CACHE

    model_name = os.getenv("STYLE_AI_VLM_MODEL", "Salesforce/blip-image-captioning-base")
    VLM_CACHE["model_name"] = model_name

    try:
        torch = importlib.import_module("torch")
        transformers = importlib.import_module("transformers")
        BlipForConditionalGeneration = transformers.BlipForConditionalGeneration
        BlipProcessor = transformers.BlipProcessor
    except Exception as exc:  # pragma: no cover - optional dependency path
        VLM_CACHE.update(
            {
                "loaded": True,
                "available": False,
                "reason": f"Optional VLM deps missing: {exc}",
            }
        )
        return VLM_CACHE

    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        processor = BlipProcessor.from_pretrained(model_name)
        model = BlipForConditionalGeneration.from_pretrained(model_name).to(device)
        VLM_CACHE.update(
            {
                "loaded": True,
                "available": True,
                "processor": processor,
                "model": model,
                "device": device,
                "reason": "ok",
            }
        )
    except Exception as exc:  # pragma: no cover - model download/initialization failure path
        VLM_CACHE.update(
            {
                "loaded": True,
                "available": False,
                "reason": f"Failed loading VLM model: {exc}",
            }
        )

    return VLM_CACHE


def generate_vlm_caption(image: Image.Image) -> dict[str, Any]:
    cache = load_vlm_model()
    if not cache.get("available"):
        return {
            "ok": False,
            "caption": None,
            "reason": cache.get("reason", "VLM unavailable"),
            "model": "heuristic-fallback",
        }

    processor = cache["processor"]
    model = cache["model"]
    device = cache["device"]

    try:
        inputs = processor(images=image, return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}
        output = model.generate(**inputs, max_new_tokens=32)
        caption = processor.decode(output[0], skip_special_tokens=True)
        return {
            "ok": True,
            "caption": caption,
            "reason": "ok",
            "model": cache.get("model_name", "blip"),
        }
    except Exception as exc:  # pragma: no cover - inference failure path
        return {
            "ok": False,
            "caption": None,
            "reason": f"VLM inference failed: {exc}",
            "model": "heuristic-fallback",
        }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/model-status")
def model_status() -> dict[str, Any]:
    cache = load_vlm_model()
    return {
        "vlm_available": bool(cache.get("available")),
        "vlm_model": cache.get("model_name"),
        "device": cache.get("device"),
        "reason": cache.get("reason"),
    }


@app.post("/analyze-style")
async def analyze_style(file: UploadFile = File(...), mode: str = Form("auto")) -> dict[str, Any]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    try:
        image = Image.open(BytesIO(raw_bytes)).convert("RGB")
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=400, detail="Unable to decode image.") from exc

    dominant_colors = extract_dominant_colors(image)
    if not dominant_colors:
        raise HTTPException(status_code=500, detail="Could not extract colors from image.")

    mode_normalized = (mode or "auto").strip().lower()
    if mode_normalized not in {"auto", "vlm", "heuristic"}:
        raise HTTPException(status_code=400, detail="mode must be one of: auto, vlm, heuristic")

    primary_rgb = dominant_colors[0]["rgb"]

    vlm_result = {"ok": False, "caption": None, "reason": "heuristic mode", "model": "heuristic"}
    if mode_normalized in {"auto", "vlm"}:
        vlm_result = generate_vlm_caption(image)

    style_direction = infer_style_direction(primary_rgb)
    if vlm_result.get("ok"):
        style_direction = infer_style_from_caption(vlm_result.get("caption", "")) or style_direction

    final_caption = (
        vlm_result.get("caption")
        if vlm_result.get("ok")
        else build_caption(style_direction, dominant_colors)
    )

    response = {
        "caption": final_caption,
        "style_direction": style_direction,
        "dominant_colors": [
            {
                "hex": color["hex"],
                "name": color["name"],
                "percentage": color["percentage"],
            }
            for color in dominant_colors
        ],
        "color_palette_advice": build_color_advice(primary_rgb, dominant_colors),
        "outfit_ideas": build_outfit_ideas(style_direction, dominant_colors),
        "model": vlm_result.get("model") if vlm_result.get("ok") else "local-color-style-engine",
        "confidence": "medium" if vlm_result.get("ok") else "low-medium",
        "mode_requested": mode_normalized,
        "fallback_reason": None if vlm_result.get("ok") else vlm_result.get("reason"),
    }

    return response
