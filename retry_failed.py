#!/usr/bin/env python3
"""Retry failed images with longer delays and retry logic."""

import os
import time
import json
import urllib.request
import urllib.error
from PIL import Image

OUTPUT_DIR = "/tmp/pixcraftx/public/seo-samples/"
API_KEY = "sk-axmsiequayhtinoizdzrcvskztjvpcomyyglhrhkcsjnelum"
ENDPOINT = "https://api.siliconflow.cn/v1/images/generations"
FALLBACK_MODEL = "Kwai-Kolors/Kolors"
NEGATIVE_PROMPT = "color, colored, shading, gradient, photograph, realistic, blurry, messy lines, thin lines, watermark, text, signature"

FAILED_TASKS = [
    ("koi-fish-2", "Black and white coloring page line art of a koi fish leaping over a traditional Chinese waterfall gate, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("koi-fish-3", "Black and white coloring page line art of a serene koi pond with fish, water lilies, and ornate stone bridge, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("pagoda-1", "Black and white coloring page line art of a multi-tiered Chinese pagoda on a misty mountainside with pine trees, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("pagoda-3", "Black and white coloring page line art of a moonlit pagoda beside a zen rock garden with raked sand patterns, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("lantern-1", "Black and white coloring page line art of ornate Chinese red lanterns with tassels hanging from a decorative archway, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("lantern-2", "Black and white coloring page line art of floating sky lanterns rising above a tranquil lake with mountain reflections, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("lantern-3", "Black and white coloring page line art of a Mid-Autumn Festival scene with jade rabbit and mooncakes under full moon, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("crane-1", "Black and white coloring page line art of a red-crowned crane standing gracefully in misty wetlands with reeds, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("crane-2", "Black and white coloring page line art of a crane in flight beneath a large full moon with clouds, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("qilin-1", "Black and white coloring page line art of a Qilin Chinese unicorn with deer body dragon scales and flaming mane, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("qilin-2", "Black and white coloring page line art of a foo dog guardian lion with curly mane and fierce expression, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("qilin-3", "Black and white coloring page line art of a mythical Eastern beast with antlers and fish scales walking on clouds, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("landscape-1", "Black and white coloring page line art of towering misty mountains with cascading waterfall and small boat, Chinese shanshui style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("landscape-2", "Black and white coloring page line art of a peaceful pavilion beside a winding river with willow trees, Chinese shanshui style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("landscape-3", "Black and white coloring page line art of a bamboo forest emerging from morning mist with stone path, Chinese shanshui style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("hanfu-1", "Black and white coloring page line art of an elegant woman in flowing Tang dynasty Hanfu robes with wide sleeves and ornate hairpiece, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("hanfu-3", "Black and white coloring page line art of a graceful figure in Hanfu dress with flowing ribbons and jade accessories under cherry blossoms, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("fan-1", "Black and white coloring page line art of an ornate folding fan with painted mountain landscape and bamboo, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("fan-2", "Black and white coloring page line art of a round silk fan with peony flowers and butterfly motifs, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
    ("fan-3", "Black and white coloring page line art of a decorative fan with phoenix pattern and Chinese cloud motifs border, traditional Eastern style, bold clean outlines, no shading, no color, suitable for coloring"),
]

MAX_RETRIES = 3
BASE_DELAY = 8  # seconds between requests

success_list = []
still_failed = []


def call_api(name, prompt, model, retry=0):
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
        print(f"  [HTTP {e.code}] {name} (retry {retry}): {body[:200]}")
        if e.code == 429:
            return "RATE_LIMITED"
        return "HTTP_ERROR"
    except Exception as e:
        print(f"  [ERROR] {name} (retry {retry}): {e}")
        return "CONNECTION_ERROR"


def download_image(url, save_path):
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
    try:
        img = Image.open(img_path).convert("L")
        img = img.resize((480, 640), Image.LANCZOS)
        threshold = 200
        img = img.point(lambda x: 255 if x > threshold else 0, "1")
        img.save(img_path, "PNG")
        return True
    except Exception as e:
        print(f"  [POST-PROCESS ERROR] {img_path}: {e}")
        return False


print(f"Retrying {len(FAILED_TASKS)} failed images with longer delays...")
print(f"Delay between requests: {BASE_DELAY}s, max retries: {MAX_RETRIES}")
print("=" * 60)

for i, (name, prompt) in enumerate(FAILED_TASKS, 1):
    print(f"\n[{i}/{len(FAILED_TASKS)}] Generating: {name}")
    save_path = os.path.join(OUTPUT_DIR, f"{name}.png")

    generated = False
    for attempt in range(MAX_RETRIES):
        if attempt > 0:
            wait = BASE_DELAY * (2 ** (attempt - 1))
            print(f"  Retry {attempt}/{MAX_RETRIES}, waiting {wait}s...")
            time.sleep(wait)

        result = call_api(name, prompt, FALLBACK_MODEL, retry=attempt)

        if result == "RATE_LIMITED":
            wait = 30 * (attempt + 1)
            print(f"  Rate limited, waiting {wait}s before retry...")
            time.sleep(wait)
            continue

        if result in ("HTTP_ERROR", "CONNECTION_ERROR", None):
            continue

        # Download
        print(f"  Downloading...")
        if not download_image(result, save_path):
            continue

        # Post-process
        print(f"  Post-processing...")
        if post_process(save_path):
            success_list.append(name)
            fsize = os.path.getsize(save_path)
            print(f"  OK Saved: {save_path} ({fsize:,} bytes)")
            generated = True
            break
        else:
            continue

    if not generated:
        still_failed.append(name)
        print(f"  x STILL FAILED after {MAX_RETRIES} retries")

    # Always wait between requests
    if i < len(FAILED_TASKS):
        time.sleep(BASE_DELAY)

print("\n" + "=" * 60)
print("RETRY COMPLETE")
print("=" * 60)
print(f"Retry successes: {len(success_list)}/{len(FAILED_TASKS)}")
print(f"Still failed:    {len(still_failed)}/{len(FAILED_TASKS)}")

if success_list:
    print(f"\nNewly successful:")
    for name in success_list:
        fpath = os.path.join(OUTPUT_DIR, f"{name}.png")
        size = os.path.getsize(fpath) if os.path.exists(fpath) else 0
        print(f"  + {name}.png ({size:,} bytes)")

if still_failed:
    print(f"\nStill failed:")
    for name in still_failed:
        print(f"  - {name}")
