import argparse
import json
import pickle
from pathlib import Path
import sys


def predict_role(model_path: Path, resume_text: str, top_k: int = 3, json_output: bool = False) -> None:
    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found: {model_path}. Train first with ml/train_resume_role_model.py"
        )

    with model_path.open("rb") as f:
        model = pickle.load(f)

    predicted_role = model.predict([resume_text])[0]
    probabilities = model.predict_proba([resume_text])[0]
    labels = model.classes_

    top_idx = probabilities.argmax()
    confidence = float(probabilities[top_idx])

    if top_k < 1:
        top_k = 1

    ranked = sorted(zip(labels, probabilities), key=lambda x: x[1], reverse=True)[:top_k]

    if json_output:
        payload = {
            "predicted_role": str(predicted_role),
            "confidence": confidence,
            "top_probabilities": [
                {"role": str(role), "probability": float(prob)} for role, prob in ranked
            ],
        }
        print(json.dumps(payload))
        return

    print(f"Predicted role: {predicted_role}")
    print(f"Confidence: {confidence:.2%}")
    print(f"\nTop {top_k} role probabilities:")
    for role, prob in ranked:
        print(f"- {role}: {prob:.2%}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict role from resume text")
    parser.add_argument(
        "--model",
        default="ml/models/resume_role_model.pkl",
        help="Path to trained model file",
    )
    parser.add_argument(
        "--text",
        help="Resume text to classify",
    )
    parser.add_argument(
        "--text-stdin",
        action="store_true",
        help="Read resume text from standard input",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=3,
        help="Number of top role probabilities to print",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Return machine-readable JSON output",
    )
    args = parser.parse_args()

    if args.text_stdin:
        resume_text = sys.stdin.read().strip()
    else:
        resume_text = (args.text or "").strip()

    if not resume_text:
        raise ValueError("Resume text is required. Use --text or --text-stdin.")

    predict_role(Path(args.model), resume_text, top_k=args.top_k, json_output=args.json)


if __name__ == "__main__":
    main()
