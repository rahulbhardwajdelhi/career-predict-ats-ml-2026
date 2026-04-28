# pyright: reportUnknownParameterType=false, reportUnknownArgumentType=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownLambdaType=false

import argparse
import json
import pickle
import sys
from pathlib import Path
from typing import Any, Iterable, cast

import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import StratifiedKFold, train_test_split

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.hybrid_resume_model import predict_hybrid, train_hybrid_model


ROLE_SKILL_PRIORS = {
    "Data Scientist": ["python", "pandas", "scikit-learn", "nlp", "feature engineering", "model evaluation", "statistical analysis", "a/b testing", "time series"],
    "Data Analyst": ["sql", "excel", "power bi", "tableau", "data cleaning", "dashboarding", "kpi tracking", "report automation"],
    "Frontend Developer": ["react", "typescript", "javascript", "next.js", "html", "css", "tailwind", "redux", "accessibility"],
    "Backend Developer": ["node.js", "express", "python", "flask", "rest api", "postgresql", "mongodb", "redis", "microservices"],
    "DevOps Engineer": ["aws", "docker", "kubernetes", "terraform", "ci/cd", "linux", "monitoring", "incident response"],
    "Machine Learning Engineer": ["python", "ml pipelines", "model serving", "feature store", "deep learning", "inference optimization", "monitoring"],
    "Java Developer": ["java", "spring boot", "hibernate", "rest api", "microservices", "junit", "kafka", "mysql"],
    "Python Developer": ["python", "django", "flask", "fastapi", "sqlalchemy", "celery", "pytest", "api integration"],
    "UI UX Designer": ["figma", "wireframing", "prototyping", "user research", "design systems", "usability testing", "interaction design"],
    "QA Engineer": ["test cases", "automation testing", "selenium", "cypress", "api testing", "regression testing", "defect tracking"],
    "Product Manager": ["roadmapping", "stakeholder management", "requirements gathering", "market analysis", "agile", "prioritization", "metrics"],
    "Cybersecurity Analyst": ["siem", "incident response", "vulnerability assessment", "network security", "threat analysis", "soc operations"],
}


def load_dataset(data_path: Path) -> pd.DataFrame:
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found: {data_path}")

    df = pd.read_csv(data_path)
    required_columns = {"role", "resume_text"}
    if not required_columns.issubset(df.columns):
        raise ValueError(f"Dataset {data_path} must include columns: role, resume_text")

    return df[["role", "resume_text"]].copy()


def merge_datasets(base_data_path: Path, extra_data_paths: Iterable[Path]) -> tuple[pd.DataFrame, list[str]]:
    frames: list[pd.DataFrame] = []
    sources: list[str] = []

    base_df = load_dataset(base_data_path)
    base_df["_source"] = str(base_data_path)
    frames.append(base_df)
    sources.append(str(base_data_path))

    for path in extra_data_paths:
        if not path.exists():
            continue
        extra_df = load_dataset(path)
        extra_df["_source"] = str(path)
        frames.append(extra_df)
        sources.append(str(path))

    merged = pd.concat(frames, ignore_index=True)
    merged["role"] = merged["role"].astype(str).str.strip()
    merged["resume_text"] = merged["resume_text"].astype(str).str.strip()
    merged = merged[(merged["role"] != "") & (merged["resume_text"] != "")]
    merged = merged.drop_duplicates(subset=["role", "resume_text"], keep="first")

    return merged, sources


def inject_role_skill_priors(df: pd.DataFrame) -> pd.DataFrame:
    def augment_row(role: str, resume_text: str) -> str:
        priors = ROLE_SKILL_PRIORS.get(role, [])
        if not priors:
            return resume_text

        prior_text = ", ".join(priors)
        # Weighted priors help the model keep role anchors while still learning from real resume content.
        return f"{resume_text} Role baseline skills: {prior_text}. Priority stack: {prior_text}."

    enriched = df.copy()
    def row_to_augmented_text(row: pd.Series) -> str:
        role = str(row.get("role", ""))
        resume_text = str(row.get("resume_text", ""))
        return augment_row(role, resume_text)

    enriched["resume_text"] = enriched.apply(row_to_augmented_text, axis=1)
    return enriched


def train_model(
    data_path: Path,
    model_path: Path,
    test_size: float = 0.25,
    extra_data_paths: list[Path] | None = None,
    use_role_priors: bool = True,
) -> None:
    extra_data_paths = extra_data_paths or []
    df, dataset_sources = merge_datasets(data_path, extra_data_paths)

    x = df["resume_text"].astype(str)
    y = df["role"].astype(str)

    # Keep stratified split valid even when class count is high for a small dataset.
    class_count = y.nunique()
    min_required_test_ratio = class_count / len(df)
    effective_test_size = max(test_size, min_required_test_ratio)
    if effective_test_size >= 0.9:
        effective_test_size = 0.5

    split = train_test_split(
        x,
        y,
        test_size=effective_test_size,
        random_state=42,
        stratify=y,
    )
    x_train, x_test, y_train, y_test = cast(tuple[pd.Series, pd.Series, pd.Series, pd.Series], tuple(split))
    x_test_list = x_test.astype(str).tolist()

    min_class_count = y_train.value_counts().min()
    cv_splits = min(5, max(2, int(min_class_count)))
    cv = StratifiedKFold(n_splits=cv_splits, shuffle=True, random_state=42)

    artifact, best_cv_f1_macro, best_params = train_hybrid_model(x_train, y_train, cv)

    predictions = [
        predict_hybrid(artifact, resume_text, top_k=1)["predicted_role"]
        for resume_text in x_test_list
    ]

    accuracy = accuracy_score(y_test, predictions)
    validation_f1_macro = f1_score(y_test, predictions, average="macro", zero_division=0)
    report = cast(str, classification_report(y_test, predictions, zero_division=0))

    if not use_role_priors:
        print("Legacy role-prior feature injection is disabled; hybrid semantic scoring is used instead.")

    print(f"Best CV f1_macro: {best_cv_f1_macro:.4f}")
    print(f"Best params: {best_params}")
    print(f"Validation accuracy: {accuracy:.4f}")
    print(f"Validation f1_macro: {validation_f1_macro:.4f}")
    print(f"Training data sources: {', '.join(dataset_sources)}")
    print(f"Embedding enabled: {bool(artifact.get('embedding', {}).get('enabled'))}")
    print("\nClassification report:\n")
    print(report)

    model_path.parent.mkdir(parents=True, exist_ok=True)
    with model_path.open("wb") as f:
        pickle.dump(artifact, f)

    if model_path.name == "resume_role_model.pkl":
        metrics_path = model_path.parent / "training_metrics.json"
    else:
        metrics_path = model_path.with_name(f"{model_path.stem}_training_metrics.json")
    embedding_cfg = cast(dict[str, Any], artifact.get("embedding", {}))
    metrics_payload = {
        "model_type": str(artifact.get("model_type", "hybrid_lexical_semantic")),
        "best_cv_f1_macro": float(best_cv_f1_macro),
        "validation_accuracy": float(accuracy),
        "validation_f1_macro": float(validation_f1_macro),
        "best_params": best_params,
        "data_rows": int(len(df)),
        "class_count": int(class_count),
        "data_sources": dataset_sources,
        "embedding_enabled": bool(embedding_cfg.get("enabled")),
        "semantic_ranker_enabled": bool(embedding_cfg.get("enabled")),
        "legacy_role_priors_flag": use_role_priors,
    }
    metrics_path.write_text(json.dumps(metrics_payload, indent=2), encoding="utf-8")

    print(f"Saved trained model to: {model_path}")
    print(f"Saved training metrics to: {metrics_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Train resume role classifier")
    parser.add_argument(
        "--data",
        default="ml/data/complex_resumes.csv",
        help="Path to CSV dataset with columns role,resume_text",
    )
    parser.add_argument(
        "--model-out",
        default="ml/models/resume_role_model.pkl",
        help="Path to output trained model (.pkl)",
    )
    parser.add_argument(
        "--extra-data",
        action="append",
        default=[],
        help="Additional CSV dataset path(s) with columns role,resume_text (repeatable)",
    )
    parser.add_argument(
        "--include-mongodb-backups",
        action="store_true",
        help="Include ml/data/mongodb_resumes.csv automatically if present",
    )
    parser.add_argument(
        "--disable-role-priors",
        action="store_true",
        help="Compatibility flag retained for older automation. The hybrid scorer no longer injects labels into features.",
    )
    args = parser.parse_args()

    extra_paths = [Path(path) for path in args.extra_data]
    if args.include_mongodb_backups:
        extra_paths.append(Path("ml/data/mongodb_resumes.csv"))

    train_model(
        Path(args.data),
        Path(args.model_out),
        extra_data_paths=extra_paths,
        use_role_priors=not args.disable_role_priors,
    )


if __name__ == "__main__":
    main()
