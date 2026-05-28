"""
הורד 30 תמונות אמיתיות + 30 תמונות AI ושמור בתיקיות לתצוגה מקדימה.
הרצה: python3 preview_dataset.py
"""
from pathlib import Path
from datasets import load_dataset
from PIL import Image

PREVIEW_DIR = Path("data/preview")
N = 30


def save_images(dataset, label: str, n: int, image_key: str = "image") -> int:
    out = PREVIEW_DIR / label
    out.mkdir(parents=True, exist_ok=True)
    count = 0
    for item in dataset:
        if count >= n:
            break
        img = item.get(image_key)
        if img is None or not isinstance(img, Image.Image):
            continue
        img = img.convert("RGB")
        w, h = img.size
        scale = 512 / max(w, h)
        if scale < 1:
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        img.save(out / f"{count:03d}.jpg", "JPEG", quality=90)
        count += 1
        print(f"  [{label}] {count}/{n}", end="\r")
    print(f"  [{label}] שמרתי {count} תמונות → {out}")
    return count


def peek_schema(ds_name: str, split: str = "train") -> dict:
    """Load one item to inspect schema."""
    try:
        ds = load_dataset(ds_name, split=split, streaming=True)
        for item in ds:
            return {k: type(v).__name__ for k, v in item.items()}
    except Exception as e:
        return {"error": str(e)}


print("=" * 50)
print("Defactify Dataset — DALL-E 3, Midjourney v6, SD3")
print("=" * 50)

DS_NAME = "Rajarshi-Roy-research/Defactify_Image_Dataset"
SPLIT = "train"

print(f"\nבודק מבנה הדאטאסט {DS_NAME}...")
schema = peek_schema(DS_NAME, SPLIT)
print(f"עמודות: {schema}\n")

if "error" in schema:
    print(f"שגיאה: {schema['error']}")
    print("\nמנסה LuckyCow/Ai_vs_real_web_images במקום...")
    DS_NAME = "LuckyCow/Ai_vs_real_web_images"
    schema = peek_schema(DS_NAME, SPLIT)
    print(f"עמודות: {schema}\n")

# Find image key
image_key = "image" if "image" in schema else next((k for k, v in schema.items() if v in ("Image", "JpegImageFile")), "image")
# Find label key
label_key = next((k for k in schema if k in ("label", "is_ai", "fake", "real", "class", "category", "source")), None)

print(f"image_key={image_key}, label_key={label_key}")

ds_full = load_dataset(DS_NAME, split=SPLIT, streaming=True)

# Peek at label values
print("\nדוגמאות label:")
for i, item in enumerate(ds_full):
    if i >= 5:
        break
    lval = item.get(label_key) if label_key else "N/A"
    print(f"  item {i}: label={lval!r}")

ds_full = load_dataset(DS_NAME, split=SPLIT, streaming=True)

# Determine real/fake filter values
# Try to infer from first few items
label_values = set()
for i, item in enumerate(ds_full):
    if i >= 50:
        break
    if label_key:
        label_values.add(item.get(label_key))

print(f"\nערכי label שנמצאו: {label_values}")

# Common real values
REAL_VALS = {0, "real", "REAL", "Real", False, "0"}
FAKE_VALS = {1, "fake", "FAKE", "Fake", True, "1", "ai", "AI", "synthetic", "generated"}

real_val = next((v for v in label_values if v in REAL_VALS), None)
fake_val = next((v for v in label_values if v in FAKE_VALS), None)

print(f"real_val={real_val!r}, fake_val={fake_val!r}\n")

ds_real = load_dataset(DS_NAME, split=SPLIT, streaming=True)
ds_fake = load_dataset(DS_NAME, split=SPLIT, streaming=True)

if label_key and real_val is not None:
    ds_real = ds_real.filter(lambda x: x[label_key] == real_val)
if label_key and fake_val is not None:
    ds_fake = ds_fake.filter(lambda x: x[label_key] == fake_val)

print("מוריד תמונות...")
save_images(ds_real, "real", N, image_key)
save_images(ds_fake, "ai_generated", N, image_key)

print(f"\nסיום! פתח ב-Finder:")
print(f"  open {PREVIEW_DIR.resolve()}")
