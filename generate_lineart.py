#!/usr/bin/env python3
"""Batch generate 30 Eastern-theme line art images via SiliconFlow API."""

import os
import time
import json
import urllib.request
import urllib.error
from PIL import Image

OUTPUT_DIR = "/tmp/pixcraftx/public/seo-samples/"
API_KEY = "sk-axmsiequayhtinoizdzrcvskztjvpcomyyglhrhkcsjnelum"
ENDPOINT = "https://api.siliconflow.cn/v1/images/generations"
PRIMARY_MODEL = "stabilityai/stable-diffusion-3-5-large-turbo"
FALLBACK_MODEL = "Kwai-Kolors/Kolors"
NEGATIVE_PROMPT = "color, colored, shading, gradient, photograph, realistic, blurry, messy lines, thin lines, watermark, text, signature"

TASKS = [
    ("chinese-dragon-1", "Black and white coloring page line art of a majestic Chinese dragon soaring through swirling clouds, holding a flaming pearl, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("chinese-dragon-2", "Black and white coloring page line art of a Chinese dragon coiled around a temple pillar with whiskers and flowing mane, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("chinese-dragon-3", "Black and white coloring page line art of a baby Chinese dragon hatching from an ornate egg with cloud patterns, cute style, traditional Eastern, bold clean outlines, no shading, no color, suitable for coloring"),
    ("phoenix-1", "Black and white coloring page line art of a Chinese fenghuang phoenix with magnificent flowing tail feathers and crest, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("phoenix-2", "Black and white coloring page line art of a blazing phoenix surrounded by stylized flames and peony flowers, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("phoenix-3", "Black and white coloring page line art of a regal phoenix perched on a blooming cherry blossom branch, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("koi-fish-1", "Black and white coloring page line art of two graceful koi fish swimming among lotus flowers and lily pads, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("koi-fish-2", "Black and white coloring page line art of a koi fish leaping over a traditional Chinese waterfall gate, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("koi-fish-3", "Black and white coloring page line art of a serene koi pond with fish, water lilies, and ornate stone bridge, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("pagoda-1", "Black and white coloring page line art of a multi-tiered Chinese pagoda on a misty mountainside with pine trees, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("pagoda-2", "Black and white coloring page line art of a Japanese torii gate pathway leading to a temple, with cherry blossoms, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("pagoda-3", "Black and white coloring page line art of a moonlit pagoda beside a zen rock garden with raked sand patterns, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("lantern-1", "Black and white coloring page line art of ornate Chinese red lanterns with tassels hanging from a decorative archway, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("lantern-2", "Black and white coloring page line art of floating sky lanterns rising above a tranquil lake with mountain reflections, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("lantern-3", "Black and white coloring page line art of a Mid-Autumn Festival scene with jade rabbit and mooncakes under full moon, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("crane-1", "Black and white coloring page line art of a red-crowned crane standing gracefully in misty wetlands with reeds, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("crane-2", "Black and white coloring page line art of a crane in flight beneath a large full moon with clouds, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("crane-3", "Black and white coloring page line art of a crane perched on an ancient pine tree branch with mountains in background, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("qilin-1", "Black and white coloring page line art of a Qilin Chinese unicorn with deer body dragon scales and flaming mane, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("qilin-2", "Black and white coloring page line art of a foo dog guardian lion with curly mane and fierce expression, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("qilin-3", "Black and white coloring page line art of a mythical Eastern beast with antlers and fish scales walking on clouds, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("landscape-1", "Black and white coloring page line art of towering misty mountains with cascading waterfall and small boat, Chinese shanshui style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("landscape-2", "Black and white coloring page line art of a peaceful pavilion beside a winding river with willow trees, Chinese shanshui style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("landscape-3", "Black and white coloring page line art of a bamboo forest emerging from morning mist with stone path, Chinese shanshui style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("hanfu-1", "Black and white coloring page line art of an elegant woman in flowing Tang dynasty Hanfu robes with wide sleeves and ornate hairpiece, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("hanfu-2", "Black and white coloring page line art of a noble scholar in Ming dynasty Hanfu with jade belt and fan, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("hanfu-3", "Black and white coloring page line art of a graceful figure in Hanfu dress with flowing ribbons and jade accessories under cherry blossoms, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("fan-1", "Black and white coloring page line art of an ornate folding fan with painted mountain landscape and bamboo, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("fan-2", "Black and white coloring page line art of a round silk fan with peony flowers and butterfly motifs, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("fan-3", "Black and white coloring page line art of a decorative fan with phoenix pattern and Chinese cloud motifs border, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
]

os.makedirs(OUTPUT_DIR, exist_ok=True)

success_list = []
failed_list = []
used_model = {}


def call_api(name, prompt, model):
    """Call SiliconFlow image generation API."""
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "image_size": "768x1024",
        "num_inference_steps": 30,
        "negative_prompt": NEGATIVE_PROMPT,
    }).encode("utf-8")

    req = urllib.request.Request(
        ENDPOINT,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if "images" in data and len(data["images"]) > 0:
                return data["images"][0].get("url", None)
            elif "data" in data and len(data["data"]) > 0:
                return data["data"][0].get("url", None)
            else:
                print(f"  [WARN] Unexpected response for {name}: {json.dumps(data)[:200]}")
                return None
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"  [HTTP {e.code}] {name} model={model}: {body[:300]}")
        return "HTTP_ERROR"
    except Exception as e:
        print(f"  [ERROR] {name} model={model}: {e}")
        return "CONNECTION_ERROR"


def download_image(url, save_path):
    """Download image from URL to local path."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            with open(save_path, "wb") as f:
                f.write(resp.read())
        return True
    except Exception as e:
        print(f"  [DOWNLOAD ERROR] {save_path}: {e}")
        return False


def post_process(img_path):
    """Resize to 480x640 and convert to high-contrast pure B&W line art."""
    try:
        img = Image.open(img_path).convert("L")
        img = img.resize((480, 640), Image.LANCZOS)
        # Threshold: pixels > 200 become white (255), else black (0)
        threshold = 200
        img = img.point(lambda x: 255 if x > threshold else 0, "1")
        img.save(img_path, "PNG")
        return True
    except Exception as e:
        print(f"  [POST-PROCESS ERROR] {img_path}: {e}")
        return False


print(f"Starting batch generation of {len(TASKS)} images...")
print(f"Output directory: {OUTPUT_DIR}")
print("=" * 60)

for i, (name, prompt) in enumerate(TASKS, 1):
    print(f"\n[{i}/{len(TASKS)}] Generating: {name}")
    save_path = os.path.join(OUTPUT_DIR, f"{name}.png")

    # Try primary model first
    image_url = call_api(name, prompt, PRIMARY_MODEL)

    if image_url == "HTTP_ERROR" or image_url == "CONNECTION_ERROR":
        # Try fallback model
        print(f"  Primary model failed, trying fallback: {FALLBACK_MODEL}")
        time.sleep(1)
        image_url = call_api(name, prompt, FALLBACK_MODEL)
        if image_url and image_url not in ("HTTP_ERROR", "CONNECTION_ERROR"):
            used_model[name] = FALLBACK_MODEL
        else:
            used_model[name] = "FAILED"
    else:
        used_model[name] = PRIMARY_MODEL

    if not image_url or image_url in ("HTTP_ERROR", "CONNECTION_ERROR", None):
        print(f"  x FAILED - Could not generate image")
        failed_list.append(name)
        time.sleep(2)
        continue

    # Download
    print(f"  Downloading...")
    if not download_image(image_url, save_path):
        failed_list.append(name)
        time.sleep(2)
        continue

    # Post-process
    print(f"  Post-processing (resize 480x640 + threshold B&W)...")
    if post_process(save_path):
        success_list.append(name)
        fsize = os.path.getsize(save_path)
        print(f"  OK Saved: {save_path} ({fsize:,} bytes)")
    else:
        failed_list.append(name)

    # Rate limit
    if i < len(TASKS):
        time.sleep(2)

print("\n" + "=" * 60)
print("GENERATION COMPLETE")
print("=" * 60)
print(f"Success: {len(success_list)}/{len(TASKS)}")
print(f"Failed:  {len(failed_list)}/{len(TASKS)}")

if failed_list:
    print(f"\nFailed list:")
    for name in failed_list:
        model_used = used_model.get(name, "N/A")
        print(f"  - {name} (last model: {model_used})")

if success_list:
    print(f"\nSuccessful files:")
    for name in success_list:
        fpath = os.path.join(OUTPUT_DIR, f"{name}.png")
        size = os.path.getsize(fpath) if os.path.exists(fpath) else 0
        print(f"  + {name}.png ({size:,} bytes)")

primary_count = sum(1 for v in used_model.values() if v == PRIMARY_MODEL)
fallback_count = sum(1 for v in used_model.values() if v == FALLBACK_MODEL)
print(f"\nModel usage: Primary={primary_count}, Fallback={fallback_count}")
