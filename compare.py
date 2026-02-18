import sys
import json
import os
import requests

# Silence TensorFlow logs completely
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import warnings
warnings.filterwarnings("ignore")

from deepface import DeepFace

# Ensure weights directory exists
weights_dir = os.path.join(os.path.expanduser("~"), ".deepface", "weights")
arcface_path = os.path.join(weights_dir, "arcface_weights.h5")
os.makedirs(weights_dir, exist_ok=True)

# Auto-download ArcFace weights if missing
if not os.path.exists(arcface_path):
    try:
        sys.stderr.write("ArcFace weights missing. Downloading...\n")
        url = "https://github.com/serengil/deepface_models/releases/download/v1.0/arcface_weights.h5"
        response = requests.get(url, stream=True)
        with open(arcface_path, "wb") as f:
            for data in response.iter_content(1024 * 1024):
                f.write(data)
        sys.stderr.write("ArcFace weights downloaded successfully!\n")
    except Exception as e:
        sys.stdout.write(json.dumps({"error": f"Failed to download ArcFace weights: {str(e)}"}))
        sys.exit(1)


def find_match(img_path, db_path):
    # Check if image exists
    if not os.path.exists(img_path):
        sys.stdout.write(json.dumps({"error": f"Image not found: {img_path}"}))
        sys.exit(1)

    # Check if folder exists
    if not os.path.isdir(db_path):
        sys.stdout.write(json.dumps({"error": f"Database folder not found: {db_path}"}))
        sys.exit(1)

    # Check folder is not empty
    valid_extensions = (".jpg", ".jpeg", ".png", ".webp")
    images_in_db = [
        f for f in os.listdir(db_path)
        if f.lower().endswith(valid_extensions)
    ]

    if not images_in_db:
        sys.stdout.write(json.dumps([]))
        sys.exit(0)

    try:
        results = DeepFace.find(
            img_path=img_path,
            db_path=db_path,
            model_name="ArcFace",
            detector_backend="retinaface",
            enforce_detection=False,
            silent=True
        )

        if len(results) > 0 and not results[0].empty:
            df = results[0]

            payload = []
            for _, row in df.iterrows():
                payload.append({
                    "identity": row["identity"],
                    "distance": round(float(row["distance"]), 4),
                    "threshold": float(row.get("threshold", 0.68)),
                    "confidence": round((1 - float(row["distance"])) * 100, 2)
                })
        else:
            payload = []

        sys.stdout.write(json.dumps(payload))

    except Exception as e:
        sys.stdout.write(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.stdout.write(json.dumps({
            "error": "Usage: python compare.py <image_path> <db_folder_path>"
        }))
        sys.exit(1)

    find_match(sys.argv[1], sys.argv[2])
