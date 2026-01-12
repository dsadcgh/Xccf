# Ambulatorio Infermieristico - PRD

## Original Problem Statement
The user wants to enhance a nursing ambulatory management application with features including:
- Patient management (PICC, MED types)
- Appointment scheduling (Agenda)
- Prescription tracking
- Statistics and reporting
- AI Assistant for natural language interactions
- PDF generation for medical forms

## User Personas
- **Domenico**: Primary nurse user with access to both PTA Centro and Villa delle Ginestre ambulatories
- **Other nurses**: Antonella, Giovanna, Oriana, G.Domenico with varying access levels

## Core Requirements
1. Multi-ambulatorio support (PTA Centro, Villa delle Ginestre)
2. Patient management with status tracking (in_cura, sospeso, dimesso)
3. PICC and MED patient types with specific forms
4. Appointment scheduling with conflict resolution
5. AI-powered assistant for natural language operations
6. Statistics with annual comparisons
7. PDF export for patient records

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Python
- **Database**: MongoDB (Motor async driver)
- **AI**: Emergent LLM integration

## Current Architecture
```
/app/
├── backend/
│   ├── server.py      # Monolithic API + AI logic (~4000 lines)
│   └── .env           # MONGO_URL, EMERGENT_LLM_KEY
├── frontend/
│   ├── src/
│   │   ├── pages/     # Dashboard, Agenda, Pazienti, etc.
│   │   └── components/ # AIAssistant, Layout, Forms
│   └── .env           # REACT_APP_BACKEND_URL
└── memory/
    └── PRD.md
```

## What's Been Implemented

### Completed Features (as of January 2026)
- ✅ Full patient CRUD operations
- ✅ Appointment scheduling with calendar
- ✅ AI Assistant with chat interface (draggable)
- ✅ Statistics page with annual comparisons
- ✅ PICC/MED forms and PDF generation
- ✅ Prescription management
- ✅ Implants tracking (Impianti section)
- ✅ Multi-ambulatorio support
- ✅ User authentication (JWT)

## Bug Fixes (January 11, 2026)
- ✅ Fixed "Errore nel caricamento dei dati" toast appearing on all pages
- ✅ Improved error handling to only show network errors
- ✅ Fixed PatientDetailPage Select component issue
- ✅ Added `/health` endpoint for Kubernetes health checks
- ✅ Improved MongoDB connection with timeout and retry for Atlas
- ✅ Dashboard now shows loading skeleton instead of "0" during data fetch
- ✅ Removed "N/A" display for missing codice_fiscale in Prescrizioni
- ✅ Added 30s timeout to API client to prevent app freezing

## AI Improvements (January 11, 2026)
- ✅ **Smart Suggestions**: Quick action buttons (Nuovo paziente, Appuntamento, etc.)
- ✅ **Guided Workflows**: Step-by-step guides for common operations
- ✅ **Contextual Memory**: Remembers last discussed patient
- ✅ **Improved Name Recognition**: Precise patient matching (cognome exact → cognome+nome → partial)
- ✅ **Copy Schede**: Can copy last PICC/MED medicazione with new date

## Prioritized Backlog

### P0 (Critical)
- [x] Fix patient name recognition in AI
- [x] Add smart suggestions to AI

### P1 (High)
- [ ] Complete AI "Undo" feature implementation
- [ ] Improve AI appointment time suggestions
- [ ] Alert for expiring prescriptions

### P2 (Medium)
- [ ] Voice input/output for AI assistant
- [ ] Refactor server.py into modules
- [ ] Automatic weekly reports

### P3 (Low/Future)
- [ ] Automated data migration for deployments
- [ ] Real-time notifications
- [ ] Mobile app optimization

## Key API Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/patients` - Fetch patients by ambulatorio/status
- `GET /api/appointments` - Fetch appointments by date
- `GET /api/statistics` - Performance statistics
- `POST /api/ai/chat` - AI assistant interaction
- `GET /api/export/patient/{id}` - PDF generation
- `GET /health` - Kubernetes health check

## Credentials
- Username: `Domenico`
- Password: `infermiere`

## Known Issues
- Server.py needs modularization (>4000 lines)
- AI appointment logic sometimes suboptimal
- Undo feature partially implemented
