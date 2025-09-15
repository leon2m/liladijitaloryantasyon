# Lila Dijital Oryantasyon Programı - Design & Architecture

This document outlines the design principles, architecture, and core functionality of the Lila Dijital Oryantasyon Programı application.

## 1. Project Goal

Lila Dijital Oryantasyon Programı is a comprehensive digital assessment platform designed for recruitment and professional development. It provides users with a suite of psychometric tests, delivers detailed, AI-enhanced reports, and guides them through a structured orientation process.

## 2. Core Features

- **Psychometric Assessments**: Three distinct tests:
    1.  **Belbin Team Roles**: Identifies an individual's natural roles within a team.
    2.  **Social Color Personality**: Reveals communication styles and core motivations.
    3.  **Learning Styles**: Determines if a user learns best visually, audibly, or kinesthetically.
- **AI-Powered Reporting**: After each test, a personalized interpretation of the user's results is generated via a secure backend call to an AI service.
- **Guided Orientation**: A multi-step onboarding module to introduce users to the company culture and prepare them for assessments.
- **Device-Based Authentication**: A secure, password-less login system using a unique device token.
- **Results Archive**: A history page where users can review all previously completed test results.
- **AI-Powered Chat**: An integrated chat feature that connects to a backend service for helpful, contextual responses.
- **Admin Panel**: A secure area for administrators to manage users, tests, and view aggregated results.

## 3. Technology Stack & Architecture

- **Frontend Framework**: React 19 with TypeScript.
- **Routing**: `react-router-dom` for client-side navigation.
- **Styling**: Tailwind CSS for utility-first styling, supplemented with global custom styles for theme consistency (e.g., animated gradient background, glassmorphism cards).
- **Data Visualization**: `recharts` for rendering dynamic charts on the results page.
- **Dependencies**: Managed via an `importmap` in `index.html` to load ES modules directly from a CDN (esm.sh), simplifying the build process.

### Backend Architecture

The application is powered by a lightweight, local-first backend built with **FastAPI**. This design choice ensures the system can run independently without external service dependencies.

- **API Server**: A RESTful API built with Python and FastAPI provides all necessary endpoints for user management, test administration, and results processing.
- **Database**: Instead of a traditional database, the backend uses a simple **JSON file (`data.json`)** for all data persistence. This includes user profiles, test answers, results, and admin data, aligning with the goal of a lightweight, self-contained system.
- **Authentication**: The system uses a dual-token security model:
    - **User Authentication**: Standard users are identified via a device-specific **UUID token** (`X-Device-Token` header). This token is generated upon first use and stored in the browser's `localStorage`, providing a seamless, password-less experience for returning users on the same device.
    - **Admin Authentication**: Administrators log in via a separate `/admin/login` interface, receiving a **JWT (JSON Web Token)**. This token is passed in the `Authorization: Bearer` header for all subsequent admin-only API requests, securing access to sensitive data and management functions.
- **AI Integration**: AI-powered features, such as chat responses and result interpretations, are handled by the backend. The frontend sends requests to a backend endpoint (e.g., `/chat`), which then securely communicates with the Google Gemini API. This keeps API keys off the client-side.

## 4. Application Structure

The project is organized into logical directories to promote separation of concerns:

- **/components**: Reusable React components used across multiple pages (e.g., `Sidebar`, `LoadingSkeletons`).
- **/public/data**: Static JSON files that serve as the content database for the backend.
- **/pages**: Top-level components that correspond to specific routes/views (e.g., `Welcome`, `TestRunner`, `Results`, `admin/AdminDashboard`).
- **/services**: Modules responsible for business logic and data fetching (`apiService`, `testService`).
- **/types.ts**: A central file for all TypeScript type definitions.

## 5. Key UI/UX Concepts

- **Aesthetic**: Modern, clean, and professional. The "glassmorphism" effect (`glass-card`) on main containers creates a sense of depth over the animated gradient background.
- **Primary Call-to-Action**: A vibrant green (`btn-primary`) is used for all primary buttons, ensuring a clear and consistent user journey.
- **Layout**:
    - **Unauthenticated**: Centered, single-column layout focusing on the task at hand (registration).
    - **Authenticated**: A two-column layout with a fixed navigation `Sidebar` on the left and a main content area on the right. This provides persistent navigation and a stable user experience.
- **User Feedback**: Loading spinners and disabled button states are used during asynchronous operations to provide clear feedback to the user, preventing duplicate actions and reducing uncertainty.

## 6. Authentication Flow (Device-Based)

The application uses a simple and effective password-less system based on device tokens.

1.  **Bootstrap**: A new user provides their name on the `Welcome` page.
    - The frontend calls the `/api/bootstrap` endpoint.
    - The backend generates a new `user_id` and a unique `device_token` (UUID).
    - The backend associates the `device_token` with the new user in its JSON database.
    - The backend responds with the `user` object and the `device_token`.
2.  **Session Creation**: The frontend receives the `device_token` and stores it in the browser's `localStorage`. This action effectively "logs the user in" on the current device.
3.  **Authenticated Requests**: For all subsequent requests (e.g., fetching tests, submitting results), the frontend includes the `device_token` in the `X-Device-Token` HTTP header. The backend uses this token to identify and authenticate the user.
4.  **Session Persistence**: As long as the `device_token` exists in `localStorage`, the user remains authenticated on that device. Clearing browser data will log the user out, and they would need to start as a new user.