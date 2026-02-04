import sys
import json
import os
import requests
from deepface import DeepFace

# Silence TensorFlow logs completely
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

# Ensure weights directory exists
weights_dir = os.path.join(os.path.expanduser("~"), ".deepface", "weights")
arcface_path = os.path.join(weights_dir, "arcface_weights.h5")
os.makedirs(weights_dir, exist_ok=True)

# Auto-download ArcFace weights if missing
if not os.path.exists(arcface_path):
    try:
        print("ArcFace weights missing. Downloading...")
        url = "https://github.com/serengil/deepface_models/releases/download/v1.0/arcface_weights.h5"
        response = requests.get(url, stream=True)
        total = int(response.headers.get('content-length', 0))
        with open(arcface_path, "wb") as f:
            for data in response.iter_content(1024 * 1024):
                f.write(data)
        print("ArcFace weights downloaded successfully!")
    except Exception as e:
        sys.stdout.write(json.dumps({"error": f"Failed to download ArcFace weights: {str(e)}"}))
        sys.exit(1)

def find_match(img_path, db_path):
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
            payload = results[0].to_dict(orient="records")
        else:
            payload = []

        # ONLY JSON — nothing else
        sys.stdout.write(json.dumps(payload))

    except Exception as e:
        sys.stdout.write(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    find_match(sys.argv[1], sys.argv[2])
