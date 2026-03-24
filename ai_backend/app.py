from io import BytesIO
import importlib
import os
import re
from typing import Any

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, Field

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

COLOR_KEYWORDS = {
    "black",
    "white",
    "gray",
    "grey",
    "charcoal",
    "blue",
    "navy",
    "teal",
    "green",
    "olive",
    "rust",
    "amber",
    "mustard",
    "violet",
    "purple",
    "rose",
    "red",
    "orange",
    "golden",
    "saffron",
    "brown",
    "beige",
    "cream",
}


class ChatContext(BaseModel):
    measurements: dict[str, float | int | str | None] | None = None
    preferred_brands: list[str] = Field(default_factory=list)
    audience: str | None = None
    style_direction: str | None = None
    dominant_colors: list[str] = Field(default_factory=list)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    context: ChatContext | None = None


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def extract_first_number(text: str, pattern: str) -> float | None:
    match = re.search(pattern, text)
    if not match:
        return None
    try:
        return float(match.group(1))
    except Exception:
        return None


def detect_intent(message: str) -> str:
    text = normalize_text(message)

    if any(token in text for token in ["review", "rate", "feedback", "looks good", "looks bad"]):
        return "outfit_review"
    if any(token in text for token in ["size", "fit", "chest", "waist", "measurement", "too tight", "too loose"]):
        return "size_advice"
    if any(token in text for token in ["color", "colour", "match", "pair", "palette", "contrast"]):
        return "color_pairing"
    if any(token in text for token in ["wedding", "office", "interview", "party", "date", "occasion", "festival"]):
        return "occasion_styling"
    if any(token in text for token in ["wash", "iron", "care", "shrink", "fabric", "dry clean", "detergent"]):
        return "fabric_care"
    return "general_fashion_qa"


def detect_category(message: str) -> str:
    text = normalize_text(message)
    if any(token in text for token in ["jeans", "pants", "trouser", "bottom", "waist"]):
        return "bottom"
    return "top"


def infer_general_size(category: str, chest: float | None, waist: float | None) -> str:
    top_rules = [
        (86, "XS"),
        (94, "S"),
        (102, "M"),
        (110, "L"),
        (118, "XL"),
        (126, "XXL"),
    ]
    bottom_rules = [
        (72, "XS"),
        (80, "S"),
        (88, "M"),
        (96, "L"),
        (104, "XL"),
        (112, "XXL"),
    ]

    value = waist if category == "bottom" else chest
    rules = bottom_rules if category == "bottom" else top_rules

    if value is None:
        return "M"

    for max_value, size in rules:
        if value <= max_value:
            return size
    return "3XL"


def parse_measurements(message: str, context: ChatContext | None) -> dict[str, float | None]:
    ctx = context.measurements if context and isinstance(context.measurements, dict) else {}

    chest = extract_first_number(message, r"chest\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)")
    waist = extract_first_number(message, r"waist\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)")
    height = extract_first_number(message, r"height\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)")

    def from_ctx(key: str) -> float | None:
        raw = ctx.get(key)
        try:
            return float(raw) if raw not in {None, ""} else None
        except Exception:
            return None

    return {
        "chest": chest if chest is not None else from_ctx("chest"),
        "waist": waist if waist is not None else from_ctx("waist"),
        "height": height if height is not None else from_ctx("height"),
    }


def extract_colors_from_message(message: str, context: ChatContext | None) -> list[str]:
    text_tokens = set(re.findall(r"[a-zA-Z]+", message.lower()))
    found = [token for token in COLOR_KEYWORDS if token in text_tokens]

    if not found and context and context.dominant_colors:
        found = [str(color).lower() for color in context.dominant_colors[:3]]

    # Preserve order while removing duplicates
    unique_colors: list[str] = []
    seen = set()
    for color in found:
        if color in seen:
            continue
        seen.add(color)
        unique_colors.append(color)

    return unique_colors


def build_size_advice(message: str, context: ChatContext | None) -> tuple[str, str, list[str]]:
    category = detect_category(message)
    measurements = parse_measurements(message, context)
    suggested_size = infer_general_size(category, measurements.get("chest"), measurements.get("waist"))

    missing = []
    if category == "top" and measurements.get("chest") is None:
        missing.append("chest")
    if category == "bottom" and measurements.get("waist") is None:
        missing.append("waist")

    if missing:
        reply = (
            f"I can give a much better fit recommendation if you share {', '.join(missing)} in cm. "
            f"For now, a safe starting point is size {suggested_size} for {category} wear."
        )
        confidence = "medium"
    else:
        reply = (
            f"Based on your measurements, the likely {category} size is {suggested_size}. "
            "If you are between sizes, choose the larger size for relaxed fit and the smaller one for slim fit."
        )
        confidence = "high"

    suggestions = [
        "Compare this size across 3 brands",
        "What if I prefer an oversized fit?",
        "Give me office outfit ideas in this size",
    ]
    return reply, confidence, suggestions


def build_color_pairing_advice(message: str, context: ChatContext | None) -> tuple[str, str, list[str]]:
    colors = extract_colors_from_message(message, context)

    if not colors:
        reply = (
            "Try the easy rule: one neutral base (black, white, navy, beige), one main color, and one small accent. "
            "This keeps outfits balanced without looking flat."
        )
        return reply, "medium", [
            "Suggest 5 neutral-safe combinations",
            "Give me festive color combos",
            "How to style warm undertones?",
        ]

    primary = colors[0]
    pairing_map = {
        "black": ["white", "charcoal", "olive"],
        "white": ["navy", "beige", "olive"],
        "navy": ["white", "beige", "rust"],
        "blue": ["white", "charcoal", "beige"],
        "olive": ["cream", "black", "rust"],
        "red": ["black", "white", "charcoal"],
        "mustard": ["navy", "white", "brown"],
        "green": ["beige", "white", "charcoal"],
    }
    pairings = pairing_map.get(primary, ["white", "black", "beige"])

    reply = (
        f"For {primary}, use {pairings[0]} as base, {pairings[1]} as support, and {pairings[2]} as accent. "
        "Keep prints to one item if you are mixing strong tones."
    )
    return reply, "high", [
        "Create a 3-outfit capsule with these colors",
        "Add footwear suggestions",
        "Suggest accessories for this palette",
    ]


def build_occasion_advice(message: str, context: ChatContext | None) -> tuple[str, str, list[str]]:
    text = normalize_text(message)
    preferred_brands = context.preferred_brands if context else []
    brand_hint = ""
    if preferred_brands:
        shown = ", ".join(preferred_brands[:3])
        brand_hint = f" I can bias suggestions toward your preferred brands: {shown}."

    if "interview" in text or "office" in text:
        reply = (
            "Go with clean structure: solid shirt or blouse, tapered trousers, and minimal accessories. "
            "Use navy/charcoal/white for safer formal impact."
            + brand_hint
        )
    elif "wedding" in text or "festival" in text:
        reply = (
            "Pick one statement piece (embroidered kurta, festive saree, or textured jacket) and keep the rest balanced. "
            "Warm tones like saffron, rust, or emerald work well for festive occasions."
            + brand_hint
        )
    else:
        reply = (
            "Use a layered outfit formula: base + texture + accent. "
            "For casual events, prioritize comfort fit and breathable fabric."
            + brand_hint
        )

    return reply, "medium", [
        "Build a budget version of this look",
        "Suggest monsoon-friendly fabrics",
        "Give men and women variants",
    ]


def build_fabric_care_advice(message: str) -> tuple[str, str, list[str]]:
    text = normalize_text(message)

    if "linen" in text:
        reply = "Wash linen in cold water, avoid over-drying, and steam slightly damp to reduce wrinkles."
    elif "denim" in text or "jeans" in text:
        reply = "Wash denim inside out in cold water and air dry to preserve color and shape."
    elif "wool" in text:
        reply = "Use gentle wool detergent, cold water, and flat dry. Avoid hot water and direct sun."
    else:
        reply = (
            "Default care rule: cold wash, mild detergent, avoid high-heat drying, and read the care label first. "
            "This prevents most shrink and fade issues."
        )

    return reply, "high", [
        "How to remove odor without frequent washing?",
        "Best way to store seasonal clothes?",
        "How to avoid color bleeding?",
    ]


def score_review_text(message: str) -> tuple[int, list[str], list[str]]:
    text = normalize_text(message)
    positive_tokens = ["great", "nice", "clean", "sharp", "good", "balanced", "love", "perfect", "elegant"]
    negative_tokens = ["bad", "awkward", "tight", "loose", "dull", "clash", "boring", "messy", "poor"]

    positives = [token for token in positive_tokens if token in text]
    negatives = [token for token in negative_tokens if token in text]

    score = 6 + min(2, len(positives)) - min(3, len(negatives))
    score = max(1, min(10, score))
    return score, positives, negatives


def build_outfit_review(message: str, context: ChatContext | None) -> tuple[str, str, list[str]]:
    score, positives, negatives = score_review_text(message)
    colors = extract_colors_from_message(message, context)

    positives_text = ", ".join(positives[:3]) if positives else "silhouette and intent"
    negatives_text = ", ".join(negatives[:3]) if negatives else "minor balance issues"
    color_hint = f" Color focus: {', '.join(colors[:3])}." if colors else ""

    reply = (
        f"Outfit review score: {score}/10. Strong points: {positives_text}. "
        f"Potential improvements: {negatives_text}. "
        "Try one structured layer or a cleaner footwear choice to lift the look."
        + color_hint
    )

    return reply, "medium", [
        "Rewrite this look for a formal setting",
        "Make this outfit look slimmer",
        "Suggest a better color alternative",
    ]


def build_general_answer(context: ChatContext | None) -> tuple[str, str, list[str]]:
    audience = (context.audience or "all") if context else "all"
    reply = (
        "I can help with size guidance, outfit reviews, color matching, occasion styling, and clothing care. "
        f"Your current audience preference is {audience}. Ask me a specific question and I will personalize it."
    )
    return reply, "medium", [
        "Review my outfit idea",
        "What should I wear for office tomorrow?",
        "Suggest color combinations for navy pants",
    ]


def build_chat_reply(request: ChatRequest) -> dict[str, Any]:
    message = request.message.strip()
    context = request.context
    intent = detect_intent(message)

    if intent == "size_advice":
        reply, confidence, suggested = build_size_advice(message, context)
    elif intent == "color_pairing":
        reply, confidence, suggested = build_color_pairing_advice(message, context)
    elif intent == "occasion_styling":
        reply, confidence, suggested = build_occasion_advice(message, context)
    elif intent == "fabric_care":
        reply, confidence, suggested = build_fabric_care_advice(message)
    elif intent == "outfit_review":
        reply, confidence, suggested = build_outfit_review(message, context)
    else:
        reply, confidence, suggested = build_general_answer(context)

    return {
        "reply": reply,
        "intent": intent,
        "confidence": confidence,
        "suggested_questions": suggested,
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


@app.post("/chatbot")
def chatbot(request: ChatRequest) -> dict[str, Any]:
    message = str(request.message or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    return build_chat_reply(request)
