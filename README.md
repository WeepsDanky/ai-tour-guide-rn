# AI Tour Guide - React Native App

An intelligent, AI-powered tour guide application built with React Native and Expo. Discover, create, and experience personalized audio tours on the go.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/--typescript?style=social&logo=typescript)](https://www.typescriptlang.org/)

---

## 📋 Table of Contents

- [AI Tour Guide - React Native App](#ai-tour-guide---react-native-app)
  - [📋 Table of Contents](#-table-of-contents)
  - [✨ Features](#-features)
  - [🛠️ Tech Stack](#️-tech-stack)
  - [🏗️ Project Architecture](#️-project-architecture)
  - [🚀 Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Configuration](#configuration)
    - [Running the App](#running-the-app)
  - [📜 Available Scripts](#-available-scripts)
  - [🎯 TODO \& Future Work](#-todo--future-work)
  - [🤝 Contributing](#-contributing)

## ✨ Features

Based on the current implementation, the app supports the following features:

-   **🤖 AI Tour Generation**: Users can create personalized tours by specifying a location. The app simulates a multi-step AI generation process (research, planning, audio generation).
-   **🖼️ Photo-Enhanced Personalization**: Add photos during tour creation to help the AI better tailor the experience.
-   **📍 Interactive Tour Player**: Follow a tour on an interactive map, view points of interest (POIs), and see your progress.
-   **🎧 Audio Guide Simulation**: The architecture is set up to support audio playback for each POI.
-   **🧭 Tour Discovery**: The home screen allows users to discover tours, with sections for "Nearby" and "Recommended" tours.
-   **🔍 In-App Search**: Search for tours based on titles, descriptions, or points of interest.
-   **👤 User Profile**: A dedicated profile screen showing user stats like tours created and completed.
-   **📜 Tour History**: View a list of completed tours with statistics like duration and POIs visited.
-   **⚙️ App Settings**: A comprehensive settings screen to manage notifications, preferences, and privacy.
-   **📱 Responsive & Modern UI**: Built with NativeWind (Tailwind CSS) and a custom design system of reusable components.
-   **🗺️ File-Based Routing**: Clean and intuitive navigation powered by Expo Router.

## 🛠️ Tech Stack

-   **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
-   **Styling**: [NativeWind](https://www.nativewind.dev/) & [Tailwind CSS](https://tailwindcss.com/)

-   **Device APIs**: Expo SDK (`expo-location`, `expo-image-picker`, `expo-audio`)
-   **Linting & Formatting**: ESLint & Prettier

## 🏗️ Project Architecture

The project follows a feature-based, scalable architecture designed for clarity and maintainability.

```
ai-tour-guide-rn/
├── app/                  # File-based routing (Expo Router). Screens and layouts.
│   ├── (tabs)/           # Layout and screens for the main tab bar.
│   └── ...               # Top-level screens (map, settings, tour details).
├── assets/               # Static assets like images, fonts, icons.
├── src/                  # Core application source code.
│   ├── features/         # Business logic grouped by feature (home, create-tour, tour-player).
│   ├── ui/               # Reusable UI components (Design System).
│   │   ├── atoms/        # Basic UI primitives (Button, Icon, etc.).
│   │   ├── molecules/    # Composite components (Card, Modal, etc.).
│   │   └── layout/       # Screen structure components (AppHeader, ScreenLayout).
│   ├── services/         # API clients, external service integrations (audio, data fetching).
│   ├── lib/              # Framework-agnostic utilities (map helpers, geofencing, mock data).
│   ├── navigation/       # Custom navigation components (e.g., CustomTabBar).
│   ├── hooks/            # Shared, cross-feature custom React hooks.
│   ├── types/            # Global TypeScript type definitions.
│   └── styles/           # Global styles and Tailwind configurations.
├── .env                  # Environment variables (ignored by git).
└── package.json          # Project dependencies and scripts.
```

-   **`app/`**: This directory uses **Expo Router's** file-based routing. The `(tabs)` directory creates a nested navigator with a shared layout.
-   **`src/`**: This is the heart of the application, organized by domain to keep concerns separated.
    -   **`features/`**: Each feature folder contains components and logic specific to that feature, promoting modularity.
    -   **`ui/`**: Our internal Design System, following an Atomic Design approach. `atoms` are the smallest building blocks, `molecules` combine atoms, and `layout` components structure screens.
    -   **`services/` vs `lib/`**: `services` are for integrating with external systems (like a backend API or audio service), while `lib` contains pure, reusable utility functions (like math calculations or data transformation).
-   **Path Aliases**: The `tsconfig.json` is configured with path aliases (`@/`, `~/`, `@/ui`) for cleaner, non-relative imports.

## 🚀 Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (LTS version recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   [Expo Go](https://expo.dev/go) app on your iOS or Android device.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ai-tour-guide-rn.git
    cd ai-tour-guide-rn
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Configuration

The app requires environment variables for API keys and backend URLs.

1.  Create a `.env` file in the root of the project:
    ```bash
    touch .env
    ```

2.  Add the following environment variables to your `.env` file. These are placeholders; you will need to provide your own keys.

    ```env
    # .env
    EXPO_PUBLIC_AMAP_JS_KEY="YOUR_AMAP_JS_API_KEY"
    EXPO_PUBLIC_AMAP_SECURITY_CODE="YOUR_AMAP_SECURITY_CODE"
    EXPO_PUBLIC_BACKEND_URL="http://localhost:3000" # Your backend server URL
    ```
    *Note: The app currently uses mock data, but these variables are in place for future backend integration.*

### Running the App

1.  **Start the development server:**
    ```bash
    npm start
    ```

2.  This will open the Expo Dev Tools in your browser. You can then:
    -   Scan the QR code with the **Expo Go** app on your mobile device.
    -   Press `a` to run on an Android emulator.
    -   Press `i` to run on an iOS simulator.
    -   Press `w` to run in a web browser.

## 📜 Available Scripts

-   `npm start`: Starts the Expo development server.
-   `npm run android`: Starts the app on a connected Android device or emulator.
-   `npm run ios`: Starts the app on the iOS simulator.
-   `npm run web`: Runs the app in a web browser.
-   `npm run lint`: Lints the entire project using ESLint.
-   `npm run format`: Formats all files with Prettier.
-   `npm run typecheck`: Checks for TypeScript errors without compiling.
-   `npm run check`: Runs all checks (lint, format, typecheck) simultaneously.

## 🎯 TODO & Future Work

This project has a solid foundation, but there are many opportunities for improvement and new features:

-   [ ] **Backend Integration**: Replace `mock-data.ts` and `mockTourGeneration` with actual API calls to a live backend.
-   [ ] **User Authentication**: Implement a full authentication flow (Sign Up, Sign In, Sign Out).
-   [ ] **State Management**: Integrate a global state management library like [Zustand](https://github.com/pmndrs/zustand) or Redux for managing complex state (e.g., user session, tour progress).
-   [ ] **Real Audio Playback**: Implement the `TourAudioPlayer` service to stream and control audio for POIs.
-   [ ] **Geofencing**: Implement the `GeoFencer` service to automatically trigger POI events as the user moves.
-   [ ] **Tour Rating & Feedback**: Allow users to rate completed tours and provide feedback.
-   [ ] **Offline Mode**: Enable downloading tours for offline use.
-   [ ] **Unit & Integration Testing**: Add tests using Jest and React Native Testing Library.
-   [ ] **CI/CD Pipeline**: Set up automated builds and deployments using EAS Build and GitHub Actions.
-   [ ] **Internationalization (i18n)**: Add support for multiple languages.

## 🤝 Contributing

Contributions are welcome! If you have suggestions or want to add a new feature, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.
