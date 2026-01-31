# Copilot Instructions for Sanctum

## Project Overview

Sanctum is a room layout planner web app that allows users to visually and mathematically plan spaces with precision and ease. The app provides an intuitive interface to design room layouts with mathematically accurate proportions.

## Tech Stack

- **React** (v19.2.0): Component-based UI framework
- **TypeScript** (v5.9.3): Type-safe development
- **Vite** (v7.2.4): Build tool and development server
- **Node.js** (v20.20.0): Runtime environment (specified in `.nvmrc` and `.node-version`)
- **ESLint** (v9.39.1): Code linting with TypeScript ESLint configuration

## Development Environment

### Prerequisites
- Node.js v20.20.0 (use `.nvmrc` or `.node-version` for version management)
- npm package manager

### Key Commands
- `npm ci` - Install dependencies (preferred for clean installs)
- `npm run dev` - Start development server (runs on http://localhost:5173)
- `npm run build` - TypeScript compilation and production build
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

## Code Style and Conventions

### TypeScript
- Use TypeScript for all new files (`.tsx` for React components, `.ts` for utilities)
- Define explicit interfaces for component props (e.g., `interface RoomCanvasProps`)
- Prefer type safety over `any` types
- Use proper type annotations for function parameters and return values

### React
- Use functional components with hooks (no class components)
- Use React hooks (`useState`, `useEffect`, `useRef`) for state and side effects
- Export components as default exports
- Import React hooks from 'react'

### Component Structure
- Place component-specific CSS in separate files (e.g., `RoomCanvas.css`)
- Import CSS files in the component file
- Use semantic HTML elements with proper accessibility attributes (e.g., `htmlFor` on labels)

### Naming Conventions
- Components: PascalCase (e.g., `RoomCanvas`, `App`)
- Component files: PascalCase with `.tsx` extension
- CSS files: PascalCase matching component name with `.css` extension
- Variables and functions: camelCase (e.g., `roomWidth`, `setRoomLength`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `CANVAS_WIDTH`, `CANVAS_HEIGHT`)
- Interfaces: PascalCase with descriptive names (e.g., `RoomCanvasProps`)

### Code Organization
- Store React components in `src/components/`
- Keep component-specific styles with components
- Main app component in `src/App.tsx`
- Application entry point in `src/main.tsx`

## Mathematical Accuracy

This project emphasizes mathematical precision in layout planning:
- Use a **single scale factor** for all axes to maintain accurate proportions
- All measurements in inches are converted to pixels using consistent scaling
- Grid spacing: minor lines every 2 inches, major lines every 12 inches (1 foot)
- Calculate scale factors carefully to fit room dimensions in canvas with padding

## ESLint Configuration

The project uses ESLint with:
- JavaScript recommended rules (`@eslint/js`)
- TypeScript ESLint recommended configuration
- React Hooks plugin for proper hook usage
- React Refresh plugin for Vite integration

Always run `npm run lint` before committing code changes.

## Best Practices

### When Adding Features
1. Maintain the mathematical accuracy of the room planner
2. Ensure all measurements use the same scale factor
3. Add proper TypeScript types for new props and state
4. Follow existing component patterns
5. Keep UI controls accessible with proper labels and IDs
6. Validate numeric inputs (check for NaN, negative values, etc.)

### When Modifying Existing Code
1. Preserve the single scale factor approach for proportional accuracy
2. Maintain consistency with existing naming conventions
3. Don't remove or modify working functionality without good reason
4. Run linter after changes to ensure code quality
5. Test changes in the browser using `npm run dev`

### Canvas and Graphics
- Use Canvas API for rendering room layouts and items
- Clear canvas before redrawing with `ctx.clearRect()`
- Calculate dimensions and positions mathematically, not hardcoded
- Use proper canvas context types (`HTMLCanvasElement`, `CanvasRenderingContext2D`)
- Implement proper null checks for canvas refs

### State Management
- Use React hooks for state management
- Validate input values before setting state (check for valid numbers)
- Use controlled components for form inputs
- Handle edge cases (e.g., empty values, invalid numbers)

## Testing Changes

Before committing:
1. Run `npm run lint` to check for linting errors
2. Run `npm run build` to ensure TypeScript compilation succeeds
3. Test the app manually with `npm run dev`
4. Verify mathematical accuracy of layouts at different room sizes
5. Check responsive behavior and edge cases

## Project-Specific Notes

### Current Scope (MVP)
- Room dimensions input (width × length in inches)
- Proportionally accurate canvas with grid system
- Custom item creation with dimensions and labels
- Item manipulation (drag, rotate, delete)
- Dimension labels on items
- Session-only data (no persistence yet)

### Future Enhancements (Not Yet Implemented)
- Save/load functionality
- Export layouts
- Additional item shapes beyond rectangles
- Multi-room layouts

When adding new features, ensure they align with the MVP scope and maintain the core principles of mathematical accuracy and ease of use.
