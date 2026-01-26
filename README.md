# De Moivre-Laplace Theorem Visualization

An interactive web application for visualizing the De Moivre-Laplace Theorem, demonstrating the convergence of the binomial distribution to the normal distribution.

**Author:** Sanay Nesargi

## Overview

This project provides an interactive visualization of the De Moivre-Laplace Theorem, which establishes the connection between the discrete binomial distribution and the continuous Gaussian (normal) distribution. The application allows users to explore how the binomial distribution approximates the normal distribution as the number of trials increases.

## Features

### Interactive Visualization
- **Real-time parameter control**: Adjust the number of trials (n) and probability (p) using sliders
- **Sample proportions mode**: Toggle between viewing counts and sample proportions
- **Range selection**: Select a range of values to compare discrete binomial sums with normal integrals
- **Overlaid distributions**: View both the binomial PMF (bars) and normal PMF (curve) simultaneously
- **Visual highlighting**: Selected range is highlighted with green vertical lines and shaded area

### Mathematical Details
- **Calculated parameters**: Automatically computes mean (μ) and standard deviation (σ) from n and p
- **Expected values**: Shows expected successes and failures with color coding (green if ≥ 10, red if < 10)
- **Probability comparison**: Compares discrete binomial sums with normal integrals over selected ranges
- **LaTeX rendering**: All formulas displayed using proper mathematical notation

### Proof Documentation
- **Complete proof**: Detailed step-by-step derivation of the De Moivre-Laplace Theorem
- **Mathematical rigor**: Includes references to Stirling's approximation, Taylor expansions, and the law of large numbers
- **LaTeX formatted**: All mathematical expressions rendered with KaTeX

## Technology Stack

- **Next.js 16.1.4**: React framework for production
- **Chakra UI v3**: Component library with dark theme support
- **Recharts**: Charting library for data visualization
- **KaTeX**: LaTeX math rendering
- **TypeScript**: Type-safe development

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd central-limit-thm-visuals
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Usage

### Visualization Mode

1. **Adjust Parameters**:
   - Use the "Number of Trials (n)" slider to set the number of Bernoulli trials
   - Use the "Probability (p)" slider to set the success probability

2. **Toggle Sample Proportions**:
   - Enable "Show Sample Proportions" to view the distribution in terms of proportions (p̂ = k/n) instead of counts

3. **Select Range**:
   - Use the "X Min" and "X Max" sliders to select a range of values
   - The selected range is highlighted in green on the graph
   - Compare the discrete binomial sum with the normal integral for this range

4. **View Calculations**:
   - See calculated mean (μ) and standard deviation (σ) with LaTeX formulas
   - Check expected successes and failures (color-coded)
   - Compare binomial discrete sum vs. normal integral for selected range

### Notes Mode

Switch to "Notes on the Proof" to view the complete mathematical derivation of the De Moivre-Laplace Theorem, including:
- Standardization of the binomial random variable
- Stirling's approximation
- Taylor expansions
- Law of large numbers applications
- Convergence to the normal distribution

## Mathematical Background

The De Moivre-Laplace Theorem states that for a binomial random variable S_n with parameters n and p:

\[
\lim_{n \to \infty} \mathbb{P}\left(a < \frac{S_n - np}{\sqrt{np(1-p)}} \le b\right) = \Phi(b) - \Phi(a)
\]

where Φ(x) is the standard normal cumulative distribution function.

This theorem provides the foundation for using the normal distribution as an approximation to the binomial distribution when n is large.

## Project Structure

```
├── app/
│   ├── page.tsx          # Main application component
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   └── ui/               # UI components (theme, toaster, etc.)
└── public/               # Static assets
```

## License

This project is private and for educational purposes.

## Acknowledgments

Built with Next.js, Chakra UI, Recharts, and KaTeX.
