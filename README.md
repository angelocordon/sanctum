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

- **Room Dimensions Input**: Users provide width × length in feet
- **Proportionally Accurate Canvas with Grid**: Items and spacing are mathematically accurate based on real measurements; a single scale factor is used for all axes
- **Add Custom Items**: Users can add new items by providing width × depth (in feet) and a label
- **Item Manipulation**: 
  - Drag items to reposition them within the room
  - Rotate items using handles or by entering specific angles
  - Delete items as needed
- **Dimension Labels**: Each item displays its dimensions for quick real-world reference
- **Session-Only Data**: No save/load functionality yet; data persists only during the current session

### Future Enhancements

- Furniture presets library
- Save and load layouts
- Export to various formats
- Multi-room planning
- Collaborative features

## Tech Stack

Sanctum is built with modern web technologies optimized for performance and extensibility:

- **React**: Component-based UI framework for building interactive interfaces
- **Vite**: Next-generation frontend tooling for fast development and optimized production builds
- **JavaScript/JSX**: For application logic and component development

## Getting Started

### Prerequisites

- Node.js (version 16 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/angelocordon/sanctum.git
   cd sanctum
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173` (default Vite port).

### Building for Production

Create an optimized production build:

```bash
npm run build
# or
yarn build
```

Preview the production build locally:

```bash
npm run preview
# or
yarn preview
```

## Usage

1. **Set Room Dimensions**: Enter the width and length of your room in feet
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

- **Proportional Scaling**: A single scale factor converts real-world measurements (in feet) to canvas pixels, ensuring mathematical accuracy
- **Grid System**: Visual grid helps with alignment and provides spatial reference
- **Real-Time Updates**: All changes are reflected immediately on the canvas

### Project Structure

```
sanctum/
├── src/              # Source code
├── public/           # Static assets
├── package.json      # Project dependencies and scripts
├── vite.config.js    # Vite configuration
└── README.md         # This file
```

## Contributing

We welcome contributions to Sanctum! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write clear, descriptive commit messages
- Test your changes thoroughly before submitting
- Update documentation as needed

### Areas for Future Expansion

- Furniture preset library with common items
- Save/load functionality with browser storage or cloud sync
- Export features (PDF, PNG, blueprint formats)
- Multi-room planning capabilities
- Real-time collaboration features
- Mobile responsive design improvements
- Accessibility enhancements

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Built with ❤️ for better space planning