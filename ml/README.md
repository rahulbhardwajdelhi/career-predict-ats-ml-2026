# Resume Role ML Pipeline (Python + scikit-learn)

## Files

- `ml/data/sample_resumes.csv`: sample labeled training data
- `ml/data/complex_resumes.csv`: generated complex training data
- `ml/generate_complex_dataset.py`: creates large synthetic dataset
- `ml/train_resume_role_model.py`: trains model
- `ml/predict_resume_role.py`: predicts role from resume text
- `ml/models/resume_role_model.pkl`: generated trained model output

## Install

```bash
pip install -r requirements.txt
```

## Train

Generate complex dataset first:

```bash
python ml/generate_complex_dataset.py --samples-per-role 350
```

Then train:

```bash
python ml/train_resume_role_model.py
```

Optional custom paths:

```bash
python ml/train_resume_role_model.py --data ml/data/sample_resumes.csv --model-out ml/models/resume_role_model.pkl
```

## Predict

```bash
python ml/predict_resume_role.py --text "Built React and TypeScript dashboards, integrated REST APIs, improved UI performance"
```

## Where to paste AI key

Use a local env file at project root:

- Create `.env.local` in the repository root.
- Add:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

The key is consumed server-side by `src/app/api/ats-feedback/route.ts`.
