import argparse
import pickle
from pathlib import Path


def predict_role(model_path: Path, resume_text: str) -> None:
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
    confidence = probabilities[top_idx]

    print(f"Predicted role: {predicted_role}")
    print(f"Confidence: {confidence:.2%}")
    print("\nTop 3 role probabilities:")

    ranked = sorted(zip(labels, probabilities), key=lambda x: x[1], reverse=True)[:3]
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
        required=True,
        help="Resume text to classify",
    )
    args = parser.parse_args()

    predict_role(Path(args.model), args.text)


if __name__ == "__main__":
    main()
