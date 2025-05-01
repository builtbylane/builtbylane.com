# builtbylane.com

Personal website for Lane Goldberg, Founder/CTO of All Gold.

## Tech Stack

- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/)
- [Three.js](https://threejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Biome](https://biomejs.dev/)
- [pnpm](https://pnpm.io/)

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Lint and format code
pnpm run lint
```

## Deployment

Hosted on [Cloudflare Pages](https://pages.cloudflare.com/) (free tier). Deployment happens automatically when pushing to the main branch.

## Project Structure

- `/src` - Source code
  - `main.tsx` - Application entry point
  - `/experiments` - ASCII art experiments
    - `AsciiMetaBalls.tsx` - Interactive metaballs simulation
    - `AsciiRipple.tsx` - Ripple effect with mouse interaction
    - `AsciiWebcam.tsx` - Webcam feed converted to ASCII

## License & Contributing

This is a personal website. Please contact Lane Goldberg for licensing information.

If you notice any issues, feel free to open an issue or PR on GitHub.