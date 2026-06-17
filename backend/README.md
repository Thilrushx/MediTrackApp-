# MediTrack Backend

Express.js REST API with MySQL (Sequelize ORM).

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create MySQL database:
   ```sql
   CREATE DATABASE meditrack;
   ```

3. Configure `.env`:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=meditrack
   DB_USER=root
   DB_PASSWORD=yourpassword
   PORT=5000
   ```

4. Run (tables auto-created + seeded on first start):
   ```
   npm run dev
   ```

## API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/medications            | List all medications     |
| POST   | /api/medications            | Add medication           |
| DELETE | /api/medications/:id        | Delete medication        |
| GET    | /api/adherence              | List adherence logs      |
| POST   | /api/adherence/take         | Mark dose taken          |
| POST   | /api/adherence/miss         | Mark dose missed         |
| GET    | /api/alerts                 | List escalation alerts   |
| POST   | /api/alerts/resolve/:id     | Resolve alert            |
| GET    | /api/patient-notes          | List patient notes       |
| POST   | /api/patient-notes          | Add + analyze note       |
