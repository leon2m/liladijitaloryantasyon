# Lila Dijital Oryantasyon Programı - Roadmap & Future Work (TODO)

This document outlines planned features, improvements, and refactoring tasks for the Lila Explorer application, reflecting its current client-server architecture.

## 1. Backend Enhancements

- [ ] **Real Gemini API Integration**: Ensure the backend's interpretation and chat endpoints are fully integrated with the Google Gemini API (`gemini-2.5-flash`) for genuine, dynamic, and high-quality text generation, replacing any remaining mock logic.
- [ ] **Dockerization**: Complete a `Dockerfile` and `docker-compose.yaml` to allow for easy, containerized deployment of the backend service.
- [ ] **Scalability**: While the JSON file database is excellent for a self-contained system, consider a migration path to a more scalable database (e.g., PostgreSQL with SQLAlchemy) for larger deployments.
- [ ] **Robust Backup Strategy**: Implement a strategy for backing up the `data.json` file to prevent data loss.
- [ ] **API Documentation**: Generate OpenAPI (Swagger/ReDoc) documentation for the FastAPI backend to improve developer experience.

## 2. Frontend Enhancements & Refactoring

- [ ] **State Management Review**: For better scalability, consider if the current `Context` API is sufficient or if migrating key global state to a dedicated library (e.g., Zustand, Redux Toolkit) would be beneficial.
- [ ] **Testing**:
    - [ ] Implement unit tests for critical components and services using a library like Vitest or Jest.
    - [ ] Add end-to-end tests for key user flows (registration, test completion, admin actions) using a tool like Cypress or Playwright.
- [ ] **Performance Optimization**: Profile the application for performance bottlenecks, especially with large amounts of data in the admin panel. Implement virtualization (e.g., `react-window`) for long lists if necessary.

## 3. New Feature Development

- [ ] **Advanced Admin Analytics**: Expand the admin dashboard with more detailed charts and data filters (e.g., view test score distributions over time, filter by date range).
- [ ] **PDF Report Generation**: Add a "Download as PDF" feature on the results page, possibly using a library like `jsPDF` or a backend service, to allow users to save a professionally formatted report.
- [ ] **Team/Group Functionality**:
    - [ ] Introduce the concept of "Teams" or "Organizations" in the backend data model.
    - [ ] Allow an admin to invite users to a team.
    - [ ] Generate aggregated reports on a team's collective Belbin roles or Social Color distribution.
- [ ] **Internationalization (i18n)**: Refactor hardcoded strings (currently in Turkish) into a localization framework (e.g., `i18next`) to support multiple languages.
- [ ] **User Profile Page**: Create a page where users can perform actions like deleting their account and all associated data (GDPR compliance).

---
## Recently Completed ✅

- [x] **Improve Accessibility (a11y)**: Conducted an accessibility pass, adding ARIA attributes, labels, and roles to key components.
- [x] **Code Cleanup**: Removed obsolete files from the `/data` directory, as all data is now fetched from `/public/data` via the mock service.
- [x] **Error Handling**: Implemented a global, non-intrusive toast notification system for user-facing API errors.
- [x] **Animations & Transitions**: Added subtle 'fade-in-up' animations to cards for a more polished feel.
- [x] **Empty State Enhancements**: Designed and implemented a reusable `EmptyState` component with illustrations for pages with no data (History, Admin Panels).