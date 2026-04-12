import argparse
import csv
import random
from pathlib import Path


ROLE_PROFILES = {
    "Data Scientist": {
        "skills": ["python", "pandas", "scikit-learn", "nlp", "feature engineering", "model evaluation", "statistical analysis", "a/b testing", "time series"],
        "tools": ["jupyter", "mlflow", "airflow", "sql", "matplotlib", "seaborn", "xgboost"],
        "work": ["built predictive models", "analyzed large datasets", "designed experiments", "improved forecasting accuracy", "developed recommendation logic"],
    },
    "Data Analyst": {
        "skills": ["sql", "excel", "power bi", "tableau", "data cleaning", "dashboarding", "kpi tracking", "report automation"],
        "tools": ["power bi", "tableau", "google sheets", "bigquery", "sql server"],
        "work": ["created executive dashboards", "delivered ad hoc analysis", "tracked business metrics", "automated weekly reporting", "identified performance bottlenecks"],
    },
    "Frontend Developer": {
        "skills": ["react", "typescript", "javascript", "next.js", "html", "css", "tailwind", "redux", "accessibility"],
        "tools": ["webpack", "vite", "jest", "cypress", "storybook"],
        "work": ["built responsive interfaces", "optimized page performance", "developed reusable components", "integrated backend apis", "improved lighthouse scores"],
    },
    "Backend Developer": {
        "skills": ["node.js", "express", "python", "flask", "rest api", "postgresql", "mongodb", "redis", "microservices"],
        "tools": ["docker", "kafka", "rabbitmq", "swagger", "pytest"],
        "work": ["designed scalable apis", "optimized database queries", "implemented authentication", "built microservices", "improved service reliability"],
    },
    "DevOps Engineer": {
        "skills": ["aws", "docker", "kubernetes", "terraform", "ci/cd", "linux", "monitoring", "incident response"],
        "tools": ["prometheus", "grafana", "github actions", "jenkins", "ansible"],
        "work": ["automated deployments", "managed cloud infrastructure", "built ci pipelines", "reduced downtime", "improved release reliability"],
    },
    "Machine Learning Engineer": {
        "skills": ["python", "ml pipelines", "model serving", "feature store", "deep learning", "inference optimization", "monitoring"],
        "tools": ["pytorch", "tensorflow", "fastapi", "docker", "kubernetes", "mlflow"],
        "work": ["deployed machine learning services", "optimized inference latency", "implemented model retraining", "built data pipelines", "tracked model drift"],
    },
    "Java Developer": {
        "skills": ["java", "spring boot", "hibernate", "rest api", "microservices", "junit", "kafka", "mysql"],
        "tools": ["maven", "gradle", "jenkins", "docker", "intellij"],
        "work": ["developed enterprise services", "built spring microservices", "wrote integration tests", "improved backend performance", "handled event streams"],
    },
    "Python Developer": {
        "skills": ["python", "django", "flask", "fastapi", "sqlalchemy", "celery", "pytest", "api integration"],
        "tools": ["postgresql", "redis", "docker", "git", "linux"],
        "work": ["built backend platforms", "automated workflows", "developed api endpoints", "integrated third-party services", "wrote unit tests"],
    },
    "UI UX Designer": {
        "skills": ["figma", "wireframing", "prototyping", "user research", "design systems", "usability testing", "interaction design"],
        "tools": ["figma", "adobe xd", "illustrator", "miro", "notion"],
        "work": ["designed user journeys", "created design systems", "ran usability tests", "produced high-fidelity prototypes", "improved conversion rates"],
    },
    "QA Engineer": {
        "skills": ["test cases", "automation testing", "selenium", "cypress", "api testing", "regression testing", "defect tracking"],
        "tools": ["jira", "postman", "selenium", "cypress", "testng"],
        "work": ["automated test suites", "improved test coverage", "executed regression tests", "validated release quality", "reported production defects"],
    },
    "Product Manager": {
        "skills": ["roadmapping", "stakeholder management", "requirements gathering", "market analysis", "agile", "prioritization", "metrics"],
        "tools": ["jira", "confluence", "figma", "mixpanel", "notion"],
        "work": ["defined product strategy", "prioritized backlog", "aligned cross-functional teams", "analyzed product metrics", "drove feature delivery"],
    },
    "Cybersecurity Analyst": {
        "skills": ["siem", "incident response", "vulnerability assessment", "network security", "threat analysis", "soc operations"],
        "tools": ["splunk", "wireshark", "nmap", "burp suite", "qualys"],
        "work": ["investigated security incidents", "performed vulnerability scans", "strengthened security controls", "monitored threats", "improved compliance posture"],
    },
}

DOMAINS = [
    "fintech", "healthcare", "ecommerce", "edtech", "telecom", "logistics", "banking", "retail", "saas",
]

METRICS = [
    "improved throughput by {n}%",
    "reduced latency by {n}%",
    "increased conversion by {n}%",
    "cut incident volume by {n}%",
    "saved {n} engineering hours per month",
    "improved model accuracy by {n}%",
    "reduced cloud costs by {n}%",
]


def build_resume_text(role: str, profile: dict, profiles: dict, rng: random.Random) -> str:
    domain = rng.choice(DOMAINS)
    skills = rng.sample(profile["skills"], k=min(5, len(profile["skills"])))
    tools = rng.sample(profile["tools"], k=min(3, len(profile["tools"])))
    work_items = rng.sample(profile["work"], k=min(3, len(profile["work"])))

    # Add small cross-role noise to avoid trivial classification.
    other_role = rng.choice([r for r in profiles.keys() if r != role])
    noisy_skill = rng.choice(profiles[other_role]["skills"])

    metric_lines = [rng.choice(METRICS).format(n=rng.randint(12, 68)) for _ in range(2)]

    summary = (
        f"{role} with hands-on experience in {domain}. "
        f"Key strengths include {', '.join(skills)} and practical delivery in production systems."
    )

    body = (
        f"Experience: {work_items[0]}, {work_items[1]}, and {work_items[2]}. "
        f"Tools used: {', '.join(tools)}. "
        f"Achievements: {metric_lines[0]}; {metric_lines[1]}. "
        f"Additional exposure: {noisy_skill}."
    )

    return f"{summary} {body}"


def generate_dataset(output_path: Path, samples_per_role: int, seed: int) -> None:
    rng = random.Random(seed)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["role", "resume_text"])

        for role, profile in ROLE_PROFILES.items():
            for _ in range(samples_per_role):
                writer.writerow([role, build_resume_text(role, profile, ROLE_PROFILES, rng)])

    total = samples_per_role * len(ROLE_PROFILES)
    print(f"Generated dataset: {output_path}")
    print(f"Roles: {len(ROLE_PROFILES)}")
    print(f"Rows: {total}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate complex synthetic resume dataset")
    parser.add_argument("--out", default="ml/data/complex_resumes.csv", help="Output CSV path")
    parser.add_argument("--samples-per-role", type=int, default=350, help="Rows per role")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    generate_dataset(Path(args.out), args.samples_per_role, args.seed)


if __name__ == "__main__":
    main()
