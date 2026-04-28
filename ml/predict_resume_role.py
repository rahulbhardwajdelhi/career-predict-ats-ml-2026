import argparse
import json
import pickle
import sys
from pathlib import Path
from typing import Any, cast

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.hybrid_resume_model import is_hybrid_artifact, predict_hybrid, upgrade_legacy_model


def load_model_artifact(model_path: Path) -> dict[str, Any]:
    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found: {model_path}. Train first with ml/train_resume_role_model.py"
        )

    with model_path.open("rb") as f:
        model = pickle.load(f)

    if is_hybrid_artifact(model):
        return cast(dict[str, Any], model)

    return upgrade_legacy_model(model)


def predict_role(
    model_path: Path,
    resume_text: str,
    top_k: int = 3,
    json_output: bool = False,
    job_description: str | None = None,
) -> None:
    if top_k < 1:
        top_k = 1

    artifact = load_model_artifact(model_path)
    prediction = predict_hybrid(artifact, resume_text, top_k=top_k, job_description=job_description)

    if json_output:
        print(json.dumps(prediction))
        return

    print(f"Predicted role: {prediction['predicted_role']}")
    print(f"Confidence: {prediction['confidence']:.2%}")
    print(f"\nTop {top_k} role probabilities:")
    for item in prediction["top_probabilities"]:
        print(f"- {item['role']}: {float(item['probability']):.2%}")

    print("\nTop ranked roles:")
    for item in prediction["top_ranked_roles"]:
        print(
            f"- {item['role']}: hybrid={float(item['hybrid_score']):.3f}, "
            f"lexical={float(item['lexical_probability']):.3f}, "
            f"semantic={float(item['semantic_role_similarity']):.3f}, "
            f"skills={float(item['skill_coverage']):.3f}"
        )

    explainability = prediction.get("explainability", {})
    matched_skills = explainability.get("matched_skills", [])
    missing_skills = explainability.get("missing_core_role_skills", [])
    lexical_signals = explainability.get("top_lexical_signals", [])

    if matched_skills:
        print("\nMatched skills:")
        for skill in matched_skills:
            print(f"- {skill}")

    if missing_skills:
        print("\nMissing core skills:")
        for skill in missing_skills:
            print(f"- {skill}")

    if lexical_signals:
        print("\nTop lexical signals:")
        for signal in lexical_signals:
            print(f"- {signal['term']}: {float(signal['score']):.4f}")

    job_match = prediction.get("job_match")
    if job_match:
        print("\nJob description match:")
        print(f"- Similarity: {float(job_match['similarity_to_job_description']):.2%}")
        print(f"- Coverage: {float(job_match['coverage_ratio']):.2%}")
        if job_match.get("matched_job_skills"):
            print(f"- Matched job skills: {', '.join(job_match['matched_job_skills'])}")
        if job_match.get("missing_job_skills"):
            print(f"- Missing job skills: {', '.join(job_match['missing_job_skills'])}")


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
    parser.add_argument(
        "--job-description",
        help="Optional job description for semantic matching and explainability",
    )
    args = parser.parse_args()

    if args.text_stdin:
        resume_text = sys.stdin.read().strip()
    else:
        resume_text = (args.text or "").strip()

    if not resume_text:
        raise ValueError("Resume text is required. Use --text or --text-stdin.")

    predict_role(
        Path(args.model),
        resume_text,
        top_k=args.top_k,
        json_output=args.json,
        job_description=(args.job_description or None),
    )


if __name__ == "__main__":
    main()
