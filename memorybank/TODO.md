# Lila Dijital Oryantasyon Programı - Roadmap & Future Work (TODO)

This document outlines planned features, improvements, and refactoring tasks for the Lila Explorer application, reflecting its current client-server architecture.

## 1. Backend Enhancements

- [ ] **Real Gemini API Integration**: Ensure the backend's interpretation and chat endpoints are fully integrated with the Google Gemini API (`gemini-2.5-flash`) for genuine, dynamic, and high-quality text generation, replacing any remaining mock logic.
- [ ] **Dockerization**: Complete the `Dockerfile` and `docker-compose.yaml` to allow for easy, containerized deployment of the backend service.
- [ ] **Scalability**: While the JSON file database is excellent for a self-contained system, consider a migration path to a more scalable database (e.g., PostgreSQL with SQLAlchemy) for larger deployments.
- [ ] **Robust Backup Strategy**: Implement a strategy for backing up the `data.json` file to prevent data loss.

## 2. Frontend Enhancements & Refactoring

- [ ] **Improve Accessibility (a11y)**: Conduct a full accessibility audit. Add necessary ARIA attributes, ensure keyboard navigability, and test for screen reader compatibility.
- [ ] **State Management Review**: For better scalability, consider if the current `Context` API is sufficient or if migrating key global state to a dedicated library (e.g., Zustand, Redux Toolkit) would be beneficial.
- [ ] **Code Cleanup**: Remove obsolete files that have been marked as `@DEPRECATED` (e.g., `RecoveryCode.tsx`, `Chatbot.tsx`). This will finalize the transition to the new architecture.
- [ ] **Testing**:
    - [ ] Implement unit tests for critical components and services using a library like Vitest or Jest.
    - [ ] Add end-to-end tests for key user flows (registration, test completion, admin actions) using a tool like Cypress or Playwright.

## 3. New Feature Development

- [ ] **Advanced Admin Analytics**: Expand the admin dashboard with more detailed charts and data filters (e.g., view test score distributions over time).
- [ ] **PDF Report Generation**: Add a "Download as PDF" feature on the results page, possibly using a library like `jsPDF` or a backend service, to allow users to save a professionally formatted report.
- [ ] **Team/Group Functionality**:
    - [ ] Introduce the concept of "Teams" or "Organizations" in the backend data model.
    - [ ] Allow an admin to invite users to a team.
    - [ ] Generate aggregated reports on a team's collective Belbin roles or Social Color distribution.
- [ ] **Internationalization (i18n)**: Refactor hardcoded strings (currently in Turkish) into a localization framework (e.g., `i18next`) to support multiple languages.
- [ ] **User Profile Page**: Create a page where users can perform actions like deleting their account and all associated data (GDPR compliance).

## 4. UI/UX Improvements

- [ ] **Animations & Transitions**: Add more subtle and meaningful animations for page transitions and component interactions to enhance the user experience.
- [ ] **Empty State Enhancements**: Improve the design of empty states (e.g., an empty History page) with better visuals and clearer calls to action.