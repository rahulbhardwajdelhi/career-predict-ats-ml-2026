# pyright: reportMissingImports=false, reportUnknownParameterType=false, reportUnknownArgumentType=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownLambdaType=false

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, TypedDict, cast

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline


EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_EMBEDDER_CACHE: dict[str, "Embedder"] = {}

ROLE_SKILL_PRIORS: dict[str, list[str]] = {
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

# Canonicalization helps messy resume text map to stable skill features.
SKILL_SYNONYMS: dict[str, list[str]] = {
    "rest api": ["restful api", "restful apis", "restful services", "rest services"],
    "node.js": ["nodejs", "node js"],
    "ci/cd": ["cicd", "ci cd", "continuous integration", "continuous delivery"],
    "scikit-learn": ["sklearn", "scikit learn"],
    "javascript": ["js", "ecmascript"],
    "typescript": ["ts"],
    "kubernetes": ["k8s"],
    "machine learning": ["ml"],
    "nlp": ["natural language processing"],
    "a/b testing": ["ab testing", "a b testing"],
}


class RankedRole(TypedDict):
    role: str
    hybrid_score: float
    lexical_probability: float
    semantic_role_similarity: float
    skill_coverage: float
    matched_role_skills: list[str]


class ExplainabilityPayload(TypedDict):
    top_lexical_signals: list[dict[str, float | str]]
    matched_skills: list[str]
    missing_core_role_skills: list[str]


class JobMatchPayload(TypedDict):
    similarity_to_job_description: float
    matched_job_skills: list[str]
    missing_job_skills: list[str]
    coverage_ratio: float


class PredictPayload(TypedDict):
    predicted_role: str
    confidence: float
    top_probabilities: list[dict[str, float | str]]
    top_ranked_roles: list[RankedRole]
    explainability: ExplainabilityPayload
    skill_profile: dict[str, list[str]]
    job_match: JobMatchPayload | None


@dataclass
class Embedder:
    model_name: str = EMBEDDING_MODEL_NAME

    def __post_init__(self) -> None:
        self._model: Any | None = None

    @property
    def available(self) -> bool:
        try:
            self._ensure_model()
            return True
        except Exception:
            return False

    def _ensure_model(self) -> Any:
        if self._model is not None:
            return self._model

        from sentence_transformers import SentenceTransformer

        self._model = SentenceTransformer(self.model_name)
        return self._model

    def encode(self, texts: list[str]) -> np.ndarray:
        model = self._ensure_model()
        embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return np.asarray(embeddings, dtype=np.float32)


def _get_cached_embedder(model_name: str) -> Embedder:
    cached = _EMBEDDER_CACHE.get(model_name)
    if cached is not None:
        return cached

    embedder = Embedder(model_name)
    _EMBEDDER_CACHE[model_name] = embedder
    return embedder


def normalize_resume_text(text: str) -> str:
    normalized = text.replace("\r", "\n")
    normalized = re.sub(r"[\u2022\u25cf\u25aa\u25e6\u2219]", " ", normalized)
    normalized = re.sub(r"[-–—]{2,}", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized)
    normalized = normalized.lower().strip()

    for canonical, aliases in SKILL_SYNONYMS.items():
        for alias in aliases:
            normalized = re.sub(rf"\b{re.escape(alias)}\b", canonical, normalized)

    return normalized


def extract_skills_from_text(text: str) -> list[str]:
    normalized = normalize_resume_text(text)
    vocabulary = sorted({skill for skills in ROLE_SKILL_PRIORS.values() for skill in skills})
    detected: list[str] = []
    for skill in vocabulary:
        if re.search(rf"\b{re.escape(skill)}\b", normalized):
            detected.append(skill)
    return detected


def compute_role_skill_coverage(role: str, detected_skills: set[str]) -> tuple[float, list[str], list[str]]:
    role_skills = set(ROLE_SKILL_PRIORS.get(role, []))
    if not role_skills:
        return 0.0, [], []

    matched = sorted(role_skills.intersection(detected_skills))
    missing = sorted(role_skills.difference(detected_skills))
    coverage = len(matched) / len(role_skills)
    return float(coverage), matched, missing


def _build_training_pipeline() -> tuple[Pipeline, dict[str, list[Any]]]:
    pipeline = Pipeline(
        steps=[
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    strip_accents="unicode",
                    sublinear_tf=True,
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

    param_grid: dict[str, list[Any]] = {
        "tfidf__ngram_range": [(1, 2), (1, 3)],
        "tfidf__min_df": [1, 2],
        "tfidf__max_df": [0.9, 0.98],
        "clf__C": [1.0, 2.0, 4.0],
        "clf__class_weight": [None, "balanced"],
    }

    return pipeline, param_grid


def train_hybrid_model(
    train_texts: pd.Series,
    train_labels: pd.Series,
    cv: StratifiedKFold,
) -> tuple[dict[str, Any], float, dict[str, Any]]:
    cleaned_train = train_texts.astype(str).map(normalize_resume_text).tolist()
    train_labels_list = train_labels.astype(str).tolist()

    pipeline, param_grid = _build_training_pipeline()
    grid = GridSearchCV(
        estimator=pipeline,
        param_grid=param_grid,
        scoring="f1_macro",
        n_jobs=-1,
        cv=cv,
        verbose=1,
    )

    grid.fit(cleaned_train, train_labels_list)

    best_model = grid.best_estimator_
    best_params = dict(grid.best_params_)

    embedder = Embedder()
    embedding_enabled = False
    embedding_error: str | None = None
    role_centroids: dict[str, list[float]] = {}

    try:
        train_embeddings = embedder.encode(cleaned_train)
        embedding_enabled = True
        for role in sorted(set(train_labels_list)):
            indices = [idx for idx, label in enumerate(train_labels_list) if label == role]
            if not indices:
                continue
            centroid = train_embeddings[indices].mean(axis=0)
            norm = np.linalg.norm(centroid)
            if norm > 0:
                centroid = centroid / norm
            role_centroids[role] = centroid.astype(np.float32).tolist()
    except Exception:
        embedding_enabled = False
        role_centroids = {}
        embedding_error = "embedding initialization or encoding failed"

    artifact: dict[str, Any] = {
        "version": "2.0",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "model_type": "hybrid_lexical_semantic",
        "lexical_model": best_model,
        "role_skill_priors": ROLE_SKILL_PRIORS,
        "skill_synonyms": SKILL_SYNONYMS,
        "embedding": {
            "enabled": embedding_enabled,
            "model_name": EMBEDDING_MODEL_NAME,
            "role_centroids": role_centroids,
            "error": embedding_error,
        },
    }

    return artifact, float(grid.best_score_), best_params


def _semantic_role_scores(artifact: dict[str, Any], normalized_text: str) -> dict[str, float]:
    embedding_cfg = cast(dict[str, Any], artifact.get("embedding", {}))
    if not embedding_cfg.get("enabled"):
        return {}

    role_centroids_raw = cast(dict[str, list[float]], embedding_cfg.get("role_centroids", {}))
    if not role_centroids_raw:
        return {}

    try:
        embedder = _get_cached_embedder(cast(str, embedding_cfg.get("model_name", EMBEDDING_MODEL_NAME)))
        query = embedder.encode([normalized_text])[0]
    except Exception:
        return {}

    scores: dict[str, float] = {}
    for role, centroid_list in role_centroids_raw.items():
        centroid = np.asarray(centroid_list, dtype=np.float32)
        denom = float(np.linalg.norm(centroid) * np.linalg.norm(query))
        if denom <= 0:
            score = 0.0
        else:
            score = float(np.dot(query, centroid) / denom)
        scores[role] = max(0.0, min(1.0, (score + 1.0) / 2.0))
    return scores


def _lexical_feature_contributions(
    artifact: dict[str, Any],
    normalized_text: str,
    role: str,
    top_n: int = 8,
) -> list[dict[str, float | str]]:
    lexical_model = cast(Pipeline, artifact["lexical_model"])
    tfidf = cast(TfidfVectorizer, lexical_model.named_steps["tfidf"])
    clf = cast(LogisticRegression, lexical_model.named_steps["clf"])

    if not hasattr(clf, "coef_"):
        return []

    feature_names = tfidf.get_feature_names_out()
    vector: Any = tfidf.transform([normalized_text])

    classes = list(map(str, clf.classes_))
    if role not in classes:
        return []

    class_index = classes.index(role)
    class_coef = clf.coef_[class_index]
    doc_vector = vector.toarray()[0]
    contributions = doc_vector * class_coef

    top_indices = np.argsort(contributions)[::-1][:top_n]

    output: list[dict[str, float | str]] = []
    for idx in top_indices:
        score = float(contributions[idx])
        if score <= 0:
            continue
        output.append({"term": str(feature_names[idx]), "score": score})
    return output


def predict_hybrid(
    artifact: dict[str, Any],
    resume_text: str,
    top_k: int = 3,
    job_description: str | None = None,
) -> PredictPayload:
    normalized_text = normalize_resume_text(resume_text)
    lexical_model = cast(Pipeline, artifact["lexical_model"])

    probabilities: Any = lexical_model.predict_proba([normalized_text])[0]
    labels = lexical_model.classes_

    if top_k < 1:
        top_k = 1

    lexical_pairs = sorted(
        ((str(role), float(prob)) for role, prob in zip(labels, probabilities)),
        key=lambda x: x[1],
        reverse=True,
    )

    detected_skills = set(extract_skills_from_text(normalized_text))
    semantic_scores = _semantic_role_scores(artifact, normalized_text)

    ranked_roles: list[RankedRole] = []
    for role, lexical_prob in lexical_pairs:
        semantic_score = semantic_scores.get(role, lexical_prob)
        skill_coverage, matched, _ = compute_role_skill_coverage(role, detected_skills)
        hybrid_score = (0.45 * lexical_prob) + (0.35 * semantic_score) + (0.20 * skill_coverage)

        ranked_roles.append(
            {
                "role": role,
                "hybrid_score": float(hybrid_score),
                "lexical_probability": float(lexical_prob),
                "semantic_role_similarity": float(semantic_score),
                "skill_coverage": float(skill_coverage),
                "matched_role_skills": matched,
            }
        )

    ranked_roles.sort(key=lambda item: item["hybrid_score"], reverse=True)
    top_ranked = ranked_roles[:top_k]
    best = top_ranked[0]

    _, matched_role_skills, missing_role_skills = compute_role_skill_coverage(best["role"], detected_skills)
    lexical_signals = _lexical_feature_contributions(artifact, normalized_text, best["role"])

    job_match: JobMatchPayload | None = None
    if job_description and job_description.strip():
        normalized_jd = normalize_resume_text(job_description)
        jd_skills = set(extract_skills_from_text(normalized_jd))
        matched_jd = sorted(detected_skills.intersection(jd_skills))
        missing_jd = sorted(jd_skills.difference(detected_skills))

        similarity = 0.0
        try:
            similarity = float(
                cosine_similarity(
                    lexical_model.named_steps["tfidf"].transform([normalized_text]),
                    lexical_model.named_steps["tfidf"].transform([normalized_jd]),
                )[0][0]
            )
        except Exception:
            similarity = 0.0

        coverage_ratio = (len(matched_jd) / len(jd_skills)) if jd_skills else 0.0
        job_match = {
            "similarity_to_job_description": max(0.0, min(1.0, similarity)),
            "matched_job_skills": matched_jd,
            "missing_job_skills": missing_jd,
            "coverage_ratio": float(coverage_ratio),
        }

    return {
        "predicted_role": str(best["role"]),
        "confidence": float(best["hybrid_score"]),
        "top_probabilities": [
            {"role": role, "probability": prob} for role, prob in lexical_pairs[:top_k]
        ],
        "top_ranked_roles": top_ranked,
        "explainability": {
            "top_lexical_signals": lexical_signals,
            "matched_skills": matched_role_skills,
            "missing_core_role_skills": missing_role_skills[:12],
        },
        "skill_profile": {
            "detected_skills": sorted(detected_skills),
            "normalized_tokens_preview": normalized_text.split()[:60],
        },
        "job_match": job_match,
    }


def is_hybrid_artifact(model: Any) -> bool:
    return isinstance(model, dict) and model.get("model_type") == "hybrid_lexical_semantic"


def upgrade_legacy_model(legacy_model: Any) -> dict[str, Any]:
    # Backward compatibility for already trained legacy models.
    return {
        "version": "1.legacy-upgraded",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "model_type": "hybrid_lexical_semantic",
        "lexical_model": legacy_model,
        "role_skill_priors": ROLE_SKILL_PRIORS,
        "skill_synonyms": SKILL_SYNONYMS,
        "embedding": {
            "enabled": False,
            "model_name": EMBEDDING_MODEL_NAME,
            "role_centroids": {},
            "error": "legacy model artifact has no embedding centroids",
        },
    }
