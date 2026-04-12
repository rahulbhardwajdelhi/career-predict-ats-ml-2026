import argparse
import json
import pickle
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline


def train_model(data_path: Path, model_path: Path, test_size: float = 0.25) -> None:
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found: {data_path}")

    df = pd.read_csv(data_path)
    required_columns = {"role", "resume_text"}
    if not required_columns.issubset(df.columns):
        raise ValueError("Dataset must include columns: role, resume_text")

    x = df["resume_text"].astype(str)
    y = df["role"].astype(str)

    # Keep stratified split valid even when class count is high for a small dataset.
    class_count = y.nunique()
    min_required_test_ratio = class_count / len(df)
    effective_test_size = max(test_size, min_required_test_ratio)
    if effective_test_size >= 0.9:
        effective_test_size = 0.5

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=effective_test_size,
        random_state=42,
        stratify=y,
    )

    pipeline = Pipeline(
        steps=[
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    strip_accents="unicode",
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    max_iter=3000,
                    solver="lbfgs",
                ),
            ),
        ]
    )

    min_class_count = y_train.value_counts().min()
    cv_splits = min(5, max(2, int(min_class_count)))
    cv = StratifiedKFold(n_splits=cv_splits, shuffle=True, random_state=42)

    param_grid = {
        "tfidf__ngram_range": [(1, 2), (1, 3)],
        "tfidf__min_df": [1, 2],
        "tfidf__max_df": [0.9, 0.98],
        "tfidf__sublinear_tf": [True],
        "clf__C": [1.0, 2.0, 4.0],
        "clf__class_weight": [None, "balanced"],
    }

    grid = GridSearchCV(
        estimator=pipeline,
        param_grid=param_grid,
        scoring="f1_macro",
        n_jobs=-1,
        cv=cv,
        verbose=1,
    )

    grid.fit(x_train, y_train)
    best_model = grid.best_estimator_

    predictions = best_model.predict(x_test)

    accuracy = accuracy_score(y_test, predictions)
    report = classification_report(y_test, predictions, zero_division=0)

    print(f"Best CV f1_macro: {grid.best_score_:.4f}")
    print(f"Best params: {grid.best_params_}")
    print(f"Validation accuracy: {accuracy:.4f}")
    print("\nClassification report:\n")
    print(report)

    model_path.parent.mkdir(parents=True, exist_ok=True)
    with model_path.open("wb") as f:
        pickle.dump(best_model, f)

    metrics_path = model_path.parent / "training_metrics.json"
    metrics_payload = {
        "best_cv_f1_macro": float(grid.best_score_),
        "validation_accuracy": float(accuracy),
        "best_params": grid.best_params_,
        "data_rows": int(len(df)),
        "class_count": int(class_count),
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
    args = parser.parse_args()

    train_model(Path(args.data), Path(args.model_out))


if __name__ == "__main__":
    main()
