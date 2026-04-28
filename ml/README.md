# Resume Role ML Pipeline (Hybrid NLP + scikit-learn)

## Files

- `ml/data/sample_resumes.csv`: sample labeled training data
- `ml/data/complex_resumes.csv`: generated complex training data
- `ml/generate_complex_dataset.py`: creates large synthetic dataset
- `ml/train_resume_role_model.py`: trains the hybrid model artifact
- `ml/predict_resume_role.py`: predicts role from resume text with semantic ranking and explainability
- `ml/models/resume_role_model.pkl`: generated trained model output

### Generated dataset columns

`ml/generate_complex_dataset.py` now writes richer hiring data with these columns:

- `role`
- `company_name`
- `job_description`
- `resume_text`
- `resume_keywords`
- `is_selected` (0/1)
- `callbacks_from_company` (integer)

The training script remains compatible because it only requires `role` and `resume_text`, but it now builds a hybrid artifact that includes lexical, semantic, and skill-based scoring layers.

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

Train with user-inserted resume backups (if exported to `ml/data/mongodb_resumes.csv`):

```bash
python ml/train_resume_role_model.py --include-mongodb-backups
```

Train with explicit additional datasets:

```bash
python ml/train_resume_role_model.py --extra-data ml/data/mongodb_resumes.csv --extra-data ml/data/sample_resumes.csv
```

The current hybrid pipeline does not inject labels into features. Instead, it uses lexical tuning, semantic embeddings when available, and skill matching at inference time.

Legacy compatibility flag:

```bash
python ml/train_resume_role_model.py --disable-role-priors
```

The flag is retained for older automation but no longer changes the model features.

Optional custom paths:

```bash
python ml/train_resume_role_model.py --data ml/data/sample_resumes.csv --model-out ml/models/resume_role_model.pkl
```

## Predict

```bash
python ml/predict_resume_role.py --text "Built React and TypeScript dashboards, integrated REST APIs, improved UI performance"
```

You can also pass a job description to get job-specific similarity and skill gaps:

```bash
python ml/predict_resume_role.py --text "Built React and TypeScript dashboards" --job-description "Frontend role with React, TypeScript, accessibility, and REST API integration"
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

## Next.js ML API Routes

The ML scripts are now connected to Node runtime routes in the app:

- `GET /api/ml/health`
- `POST /api/ml/generate-dataset`
- `POST /api/ml/train-model`
- `POST /api/ml/predict-role`
- `POST /api/ml/ats-score`
- `POST /api/resume-backups/save`
- `POST /api/ml/build-dataset-from-backups`

Optional environment variable for Python executable path:

```env
PYTHON_EXECUTABLE=C:\\Users\\your-user\\Desktop\\career-predict\\.venv\\Scripts\\python.exe
```

MongoDB settings (required for backup + tester data collection):

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=career_predict
TESTER_ACCOUNT_ID=tester@career-predict.local
```

### Predict Role Example

```bash
curl -X POST http://localhost:3000/api/ml/predict-role \
	-H "Content-Type: application/json" \
	-d "{\"resumeText\":\"Built React dashboards and integrated REST APIs\",\"topK\":3}"
```

### Train Model Example

```bash
curl -X POST http://localhost:3000/api/ml/train-model \
	-H "Content-Type: application/json" \
	-d "{\"dataPath\":\"ml/data/complex_resumes.csv\",\"modelOut\":\"ml/models/resume_role_model.pkl\"}"
```

Train API with Mongo backup data and role priors:

```bash
curl -X POST http://localhost:3000/api/ml/train-model \
	-H "Content-Type: application/json" \
	-d "{\"dataPath\":\"ml/data/complex_resumes.csv\",\"includeMongoBackups\":true}"
```

### Build Dataset From MongoDB Backups

This route creates a trainable CSV from backed-up tester resumes.

```bash
curl -X POST http://localhost:3000/api/ml/build-dataset-from-backups \
	-H "Content-Type: application/json" \
	-d "{\"outputPath\":\"ml/data/mongodb_resumes.csv\",\"minConfidence\":0.5}"
```

Then train with that dataset:

```bash
curl -X POST http://localhost:3000/api/ml/train-model \
	-H "Content-Type: application/json" \
	-d "{\"dataPath\":\"ml/data/mongodb_resumes.csv\",\"modelOut\":\"ml/models/resume_role_model.pkl\"}"
```

## Production ML Workflow Checklist

For production-level ML, use this multi-stage pipeline:

1. Data Cleaning
	- Remove NaN values, duplicates, and corrupted rows.
2. Data Transformation
	- Convert text/audio/image into numeric representations.
	- Use dimensionality reduction (like PCA) where useful.
3. Data Pre-processing
	- Apply standardization/normalization/scaling.
	- Reuse the exact same scaler weights at inference time.
4. Data Splitting
	- Use train/validation/test splits with stratification.
	- Treat random state as a tunable parameter.
5. Hyperparameter Tuning
	- Tune on validation set, never on final test set.
6. Model Selection
	- Pick the simplest model that meets performance + latency goals.
7. Performance Evaluation
	- Track precision, recall, F1, confidence intervals.
	- Check overfitting/underfitting and monitor drift.
8. Deployment & Monitoring
	- Keep preprocessing consistent in production.
	- Monitor latency, drift, and retraining triggers.

Current project status:
- ATS score is now model-assisted online via `/api/ml/ats-score`.
- Resume backups are stored for tester account through `/api/resume-backups/save`.
- Backup data can be exported to CSV and used to retrain your model.
