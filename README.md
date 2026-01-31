# Sanctum

A room layout planner web app designed to allow users to visually and mathematically plan spaces with precision and ease.

## Overview

Sanctum is a modern web application that helps users design and visualize room layouts with mathematically accurate proportions. Whether you're planning furniture placement, organizing a workspace, or designing a new room, Sanctum provides an intuitive interface to experiment with different arrangements before making real-world changes.

### Key Features

- **Visual Room Planning**: Define room dimensions and see your space come to life on a proportionally accurate canvas
- **Custom Item Creation**: Add rectangular items with custom dimensions and labels
- **Interactive Manipulation**: Drag items to move them and rotate them using handles or precise angle inputs
- **Real-World Accuracy**: All measurements are mathematically accurate with a single scale factor applied consistently across all axes
- **Grid-Based Layout**: Visual grid system helps align items and maintain spatial awareness
- **Dimension Labels**: Each item displays its dimensions for quick real-world reference

## MVP Scope

The current version focuses on core functionality:

- **Room Dimensions Input**: Users provide width × length in inches
- **Proportionally Accurate Canvas with Grid**: Items and spacing are mathematically accurate based on real measurements; a single scale factor is used for all axes
- **Add Custom Items**: Users can add new items by providing width × depth (in inches) and a label
- **Item Manipulation**: 
  - Drag items to reposition them within the room
  - Rotate items using handles or by entering specific angles
  - Delete items as needed
- **Dimension Labels**: Each item displays its dimensions for quick real-world reference
- **Session-Only Data**: No save/load functionality yet; data persists only during the current session


## Tech Stack

Sanctum is built with modern web technologies optimized for performance and extensibility:

- **React**: Component-based UI framework for building interactive interfaces
- **Vite**: Next-generation frontend tooling for fast development and optimized production builds
- **Node.js**: Runtime environment (v20.20.0)
- **npm**: Package manager for dependency management
- **TypeScript**: For type-safe development and better IDE support

## Getting Started

### Prerequisites

- Node.js v20.20.0 (use `.nvmrc` or `.node-version` to set the correct version)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/angelocordon/sanctum.git
   cd sanctum
   ```

2. Install dependencies:
   ```bash
   npm ci
   ```

### Development

Run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

### Building for Production

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Usage

1. **Set Room Dimensions**: Enter the width and length of your room in inches
2. **Add Items**: Create new items by specifying their dimensions (width × depth) and a descriptive label
3. **Arrange Layout**: 
   - Drag items to move them around the room
   - Use rotation handles or enter specific angles to rotate items
   - Delete items you no longer need
4. **Visualize**: The grid-based canvas shows your layout with accurate proportions and dimensions

## Technical Overview

### Architecture

The application follows a component-based architecture using React, with state management handled through React hooks. The canvas rendering uses mathematical calculations to ensure accurate scaling and positioning of all elements.

### Key Concepts

- **Proportional Scaling**: A single scale factor converts real-world measurements (in inches) to canvas pixels, ensuring mathematical accuracy
- **Grid System**: Visual grid helps with alignment and provides spatial reference
- **Real-Time Updates**: All changes are reflected immediately on the canvas

### Project Structure

```
sanctum/
├── src/
│   ├── components/   # React components
│   ├── App.tsx       # Main App component
│   ├── main.tsx      # Application entry point
│   └── ...
├── public/           # Static assets
├── package.json      # Project dependencies and scripts
├── vite.config.ts    # Vite configuration
├── .nvmrc            # Node version for nvm
├── .node-version     # Node version for asdf/nodenv
└── README.md         # This file
```

## Deployment

### Vercel Preview Deployments via GitHub Actions

This project uses GitHub Actions to deploy preview environments on Vercel for pull requests. Previews are only deployed when there are code or build-configuration changes that affect the Vite build output (e.g., changes to `src/`, `package.json`, `vite.config.ts`, etc.). This avoids unnecessary deployments for docs-only changes or empty commits.

#### Setting Up GitHub Actions Deployment

To enable preview deployments via GitHub Actions, you need to configure the following repository secrets:

1. **VERCEL_TOKEN**: Your Vercel authentication token
   - Go to [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
   - Create a new token with appropriate scope
   - Add it as a repository secret named `VERCEL_TOKEN`

2. **VERCEL_ORG_ID**: Your Vercel organization/team ID
   - Run `vercel link` in your local project directory
   - Find the org ID in `.vercel/project.json` under `orgId`
   - Add it as a repository secret named `VERCEL_ORG_ID`

3. **VERCEL_PROJECT_ID**: Your Vercel project ID
   - Run `vercel link` in your local project directory (if not already done)
   - Find the project ID in `.vercel/project.json` under `projectId`
   - Add it as a repository secret named `VERCEL_PROJECT_ID`

#### Disabling Vercel GitHub App Integration

To prevent duplicate deployments, you should disable the Vercel GitHub App integration for this repository:

1. Go to your Vercel dashboard
2. Navigate to **Settings → Git** for the Sanctum project
3. Under **Git Integration**, find the GitHub connection
4. Click **Disconnect** or adjust the settings to disable automatic deployments
5. Alternatively, you can adjust the Vercel GitHub App settings at the GitHub organization level to exclude this repository

With these settings configured, every pull request with code changes will automatically receive a Vercel Preview deployment, and the deployment URL will be posted as a PR comment and visible in the GitHub deployment status.
