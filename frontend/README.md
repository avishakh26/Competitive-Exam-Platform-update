# React Frontend

## Run in development

1. Start Flask backend from project root:

```powershell
python app.py
```

2. Start React frontend from this folder:

```powershell
npm install
npm run dev
```

The frontend runs on `http://127.0.0.1:5173` and calls backend API at `http://127.0.0.1:5000/api`.

## Environment variable

Copy `.env.example` to `.env` if you need to point at a different backend.
