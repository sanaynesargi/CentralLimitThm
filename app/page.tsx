"use client";
import React, { useMemo } from "react";
import { Box, Heading, VStack, Text, Flex, HStack } from "@chakra-ui/react";
import { Slider, Switch } from "@chakra-ui/react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { useColorMode } from "@/components/ui/color-mode";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

// Binomial coefficient C(n, k)
function binomialCoefficient(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

// Binomial PMF: P(X = k) = C(n, k) * p^k * (1-p)^(n-k)
function binomialPMF(n: number, k: number, p: number): number {
  if (k < 0 || k > n) return 0;
  return binomialCoefficient(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

// Normal distribution PDF: f(x) = (1/(σ√(2π))) * e^(-0.5 * ((x-μ)/σ)²)
function normalPDF(x: number, mean: number, stdDev: number): number {
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
  const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
  return coefficient * Math.exp(exponent);
}

// Normal CDF approximation using error function
function normalCDF(x: number, mean: number, stdDev: number): number {
  return 0.5 * (1 + erf((x - mean) / (stdDev * Math.sqrt(2))));
}

// Error function approximation
// Approximaiton of the numerical integral in Desmos
function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

// Calculate integral of normal PDF from a to b
function normalIntegral(
  a: number,
  b: number,
  mean: number,
  stdDev: number,
): number {
  return normalCDF(b, mean, stdDev) - normalCDF(a, mean, stdDev);
}

// Calculate discrete sum of binomial PMF from a to b (inclusive)
function binomialSum(n: number, p: number, a: number, b: number): number {
  let sum = 0;
  const startK = Math.max(0, Math.floor(a));
  const endK = Math.min(n, Math.floor(b));

  for (let k = startK; k <= endK; k++) {
    sum += binomialPMF(n, k, p);
  }
  return sum;
}

// Generate binomial distribution data with normal overlay
function generateBinomialData(
  n: number,
  p: number,
  useProportions: boolean = false,
) {
  const mean = n * p;
  const stdDev = Math.sqrt(n * p * (1 - p));
  const data = [];

  // First pass: collect binomial probabilities and find max
  const binomialProbs: number[] = [];
  let maxBinomial = 0;
  for (let k = 0; k <= n; k++) {
    const prob = binomialPMF(n, k, p);
    binomialProbs.push(prob);
    if (prob > maxBinomial) maxBinomial = prob;
  }

  // Find max normal PDF value for scaling
  let maxNormal = 0;
  const meanForPDF = useProportions ? p : mean;
  const stdDevForPDF = useProportions ? Math.sqrt((p * (1 - p)) / n) : stdDev;

  for (let k = 0; k <= n; k++) {
    const x = useProportions ? k / n : k;
    const pdfVal = normalPDF(x, meanForPDF, stdDevForPDF);
    if (pdfVal > maxNormal) maxNormal = pdfVal;
  }

  // Calculate scaling factor
  const scaleFactor =
    maxNormal > 0 && maxBinomial > 0 ? maxBinomial / maxNormal : 1;

  // Second pass: generate data with scaled normal distribution
  for (let k = 0; k <= n; k++) {
    const binomialProb = binomialProbs[k];
    const x = useProportions ? k / n : k;
    const normalProb = normalPDF(x, meanForPDF, stdDevForPDF) * scaleFactor;

    data.push({
      x: useProportions ? k / n : k,
      y: binomialProb,
      normalY: normalProb,
      label: useProportions ? `p̂=${(k / n).toFixed(3)}` : `k=${k}`,
    });
  }
  return data;
}

export default function Home() {
  const { setColorMode } = useColorMode();
  const [activeView, setActiveView] = React.useState<"visualization" | "notes">("visualization");
  const [n, setN] = React.useState(50);
  const [p, setP] = React.useState(0.5);
  const [xMin, setXMin] = React.useState(20);
  const [xMax, setXMax] = React.useState(30);
  const [useProportions, setUseProportions] = React.useState(false);

  // Ensure x-values are within valid range when n changes
  React.useEffect(() => {
    if (xMin >= n) setXMin(Math.max(0, n - 1));
    if (xMax > n) setXMax(n);
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate μ and σ from n and p
  // For counts: μ = np, σ = sqrt(np(1-p))
  // For proportions: μ = p, σ = sqrt(p(1-p)/n)
  const mu = useMemo(() => {
    return useProportions ? p : n * p;
  }, [n, p, useProportions]);

  const sigma = useMemo(() => {
    return useProportions
      ? Math.sqrt((p * (1 - p)) / n)
      : Math.sqrt(n * p * (1 - p));
  }, [n, p, useProportions]);

  // Expected successes and failures
  const expectedSuccesses = useMemo(() => n * p, [n, p]);
  const expectedFailures = useMemo(() => n * (1 - p), [n, p]);

  // Calculate xMin and xMax in the appropriate scale
  const xMinScaled = useMemo(() => {
    return useProportions ? xMin / n : xMin;
  }, [xMin, n, useProportions]);

  const xMaxScaled = useMemo(() => {
    return useProportions ? xMax / n : xMax;
  }, [xMax, n, useProportions]);

  // Calculate binomial discrete sum and normal integral
  const binomialDiscreteSum = useMemo(() => {
    return binomialSum(n, p, xMin, xMax);
  }, [n, p, xMin, xMax]);

  const normalIntegralValue = useMemo(() => {
    return normalIntegral(xMinScaled, xMaxScaled, mu, sigma);
  }, [xMinScaled, xMaxScaled, mu, sigma]);

  const data = useMemo(
    () => generateBinomialData(n, p, useProportions),
    [n, p, useProportions],
  );

  return (
    <Box
      width="100vw"
      height="100vh"
      bg="gray.900"
      p={0}
      m={0}
      overflow="hidden"
    >
      <Flex
        width="100%"
        height="100%"
        direction="column"
        overflow="hidden"
      >
      {/* Navigation Bar */}
      <Box
        width="100%"
        bg="gray.800"
        borderBottom="1px solid"
        borderColor="gray.700"
        p={1.5}
      >
        <HStack gap={3} justify="flex-end" pr={4}>
          <Box
            as="button"
            onClick={() => setActiveView("visualization")}
            px={3}
            py={1}
            borderRadius="md"
            bg={activeView === "visualization" ? "blue.600" : "gray.700"}
            color={activeView === "visualization" ? "white" : "gray.300"}
            _hover={{ bg: activeView === "visualization" ? "blue.700" : "gray.600" }}
            cursor="pointer"
            transition="all 0.2s"
          >
            <Text fontSize="xs" fontWeight="medium">
              De Moivre-Laplace Visualization
            </Text>
          </Box>
          <Box
            as="button"
            onClick={() => setActiveView("notes")}
            px={3}
            py={1}
            borderRadius="md"
            bg={activeView === "notes" ? "blue.600" : "gray.700"}
            color={activeView === "notes" ? "white" : "gray.300"}
            _hover={{ bg: activeView === "notes" ? "blue.700" : "gray.600" }}
            cursor="pointer"
            transition="all 0.2s"
          >
            <Text fontSize="xs" fontWeight="medium">
              Notes on the Proof
            </Text>
          </Box>
        </HStack>
      </Box>

      {/* Main Content Area */}
      <Flex flex={1} direction="row" overflow="hidden" minHeight={0}>
        {activeView === "visualization" ? (
          <>
            {/* Sidebar */}
            <Box
              width="300px"
              height="100%"
              bg="gray.800"
              borderRight="1px solid"
              borderColor="gray.700"
              p={2}
              overflowY="auto"
            >
        <VStack align="stretch" gap={1.5}>
          <Heading size="sm" color="gray.100" mb={1}>
            Settings
          </Heading>

          <Box mb={0.5}>
            <HStack justify="space-between" align="center">
              <Text color="gray.300" fontSize="xs">
                Show Sample Proportions
              </Text>
              <Switch.Root
                checked={useProportions}
                onCheckedChange={(details) => {
                  setUseProportions(!!details.checked);
                }}
                colorPalette="blue"
                size="sm"
              >
                <Switch.Control
                  onClick={(e) => {
                    e.stopPropagation();
                    setUseProportions(!useProportions);
                  }}
                >
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
            </HStack>
          </Box>

          <Box>
            <Text color="gray.300" mb={0.5} fontSize="xs">
              Number of Trials (n): {n}
            </Text>
            <Slider.Root
              value={[n]}
              onValueChange={(details) => setN(Math.round(details.value[0]))}
              min={1}
              max={200}
              step={1}
              colorPalette="blue"
            >
              <Slider.Control>
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumb index={0} />
              </Slider.Control>
            </Slider.Root>
          </Box>

          <Box>
            <Text color="gray.300" mb={0.5} fontSize="xs">
              Probability (p): {p.toFixed(3)}
            </Text>
            <Slider.Root
              value={[p]}
              onValueChange={(details) => setP(details.value[0])}
              min={0.01}
              max={0.99}
              step={0.01}
              colorPalette="blue"
            >
              <Slider.Control>
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumb index={0} />
              </Slider.Control>
            </Slider.Root>
          </Box>

          <Box mt={1} p={1.5} bg="gray.700" borderRadius="md">
            <Text color="gray.300" fontSize="xs" mb={0.5} fontWeight="bold">
              Calculated Parameters:
            </Text>
            <Text color="gray.200" fontSize="xs" mb={0.5}>
              n (trials): {n}
            </Text>
            <Text color="gray.200" fontSize="xs" mb={0.5}>
              p (probability): {p.toFixed(3)}
            </Text>
            <Box mb={0.5}>
              <Text color="gray.200" fontSize="xs" mb={0.5}>
                μ (mean):
              </Text>
              <BlockMath
                math={
                  useProportions
                    ? `\\mu = p = ${mu.toFixed(4)}`
                    : `\\mu = np = ${mu.toFixed(2)}`
                }
              />
            </Box>
            <Box>
              <Text color="gray.200" fontSize="xs" mb={0.5}>
                σ (std dev):
              </Text>
              <BlockMath
                math={
                  useProportions
                    ? `\\sigma = \\sqrt{\\frac{p(1-p)}{n}} = ${sigma.toFixed(4)}`
                    : `\\sigma = \\sqrt{np(1-p)} = ${sigma.toFixed(2)}`
                }
              />
            </Box>
          </Box>

          <Box mt={1} p={1.5} bg="gray.700" borderRadius="md">
            <Text color="gray.300" fontSize="xs" mb={0.5} fontWeight="bold">
              Expected Values:
            </Text>
            <Box mb={0.5}>
              <Text color="gray.200" fontSize="xs" mb={0.5}>
                Expected Successes:
              </Text>
              <Box
                css={{
                  "& .katex": {
                    color: expectedSuccesses >= 10 ? "#4ade80" : "#f87171",
                  },
                }}
              >
                <BlockMath math={`E[X] = np = ${expectedSuccesses.toFixed(2)}`} />
              </Box>
            </Box>
            <Box>
              <Text color="gray.200" fontSize="xs" mb={0.5}>
                Expected Failures:
              </Text>
              <Box
                css={{
                  "& .katex": {
                    color: expectedFailures >= 10 ? "#4ade80" : "#f87171",
                  },
                }}
              >
                <BlockMath math={`E[n-X] = n(1-p) = ${expectedFailures.toFixed(2)}`} />
              </Box>
            </Box>
          </Box>

          <Box>
            <Text color="gray.300" mb={0.5} fontSize="xs">
              X Min: {xMin}
            </Text>
            <Slider.Root
              value={[xMin]}
              onValueChange={(details) => {
                const newXMin = Math.round(details.value[0]);
                setXMin(Math.min(newXMin, xMax - 1));
              }}
              min={0}
              max={n}
              step={1}
              colorPalette="green"
            >
              <Slider.Control>
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumb index={0} />
              </Slider.Control>
            </Slider.Root>
          </Box>

          <Box>
            <Text color="gray.300" mb={0.5} fontSize="xs">
              X Max: {xMax}
            </Text>
            <Slider.Root
              value={[xMax]}
              onValueChange={(details) => {
                const newXMax = Math.round(details.value[0]);
                setXMax(Math.max(newXMax, xMin + 1));
              }}
              min={0}
              max={n}
              step={1}
              colorPalette="green"
            >
              <Slider.Control>
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumb index={0} />
              </Slider.Control>
            </Slider.Root>
          </Box>

          <Box mt={1} p={1.5} bg="gray.700" borderRadius="md">
            <Text color="gray.300" fontSize="xs" mb={0.5} fontWeight="bold">
              Probability Comparison:
            </Text>
            <Text color="gray.200" fontSize="xs" mb={0.5}>
              Range:{" "}
              {useProportions
                ? `[${xMinScaled.toFixed(3)}, ${xMaxScaled.toFixed(3)}]`
                : `[${xMin}, ${xMax}]`}
            </Text>

            <Box mb={0.5}>
              <Text color="gray.200" fontSize="xs" mb={0.5}>
                Binomial (discrete sum):
              </Text>
              <BlockMath
                math={
                  useProportions
                    ? `\\sum_{\\hat{p}=${xMinScaled.toFixed(3)}}^{\\hat{p}=${xMaxScaled.toFixed(3)}} P(\\hat{p}) = ${binomialDiscreteSum.toFixed(6)}`
                    : `\\sum_{k=${xMin}}^{${xMax}} P(X=k) = ${binomialDiscreteSum.toFixed(6)}`
                }
              />
            </Box>

            <Box mb={0.5}>
              <Text color="gray.200" fontSize="xs" mb={0.5}>
                Normal (integral):
              </Text>
              <BlockMath
                math={
                  useProportions
                    ? `\\int_{${xMinScaled.toFixed(3)}}^{${xMaxScaled.toFixed(3)}} f(\\hat{p}) \\, d\\hat{p} = ${normalIntegralValue.toFixed(6)}`
                    : `\\int_{${xMin}}^{${xMax}} f(x) \\, dx = ${normalIntegralValue.toFixed(6)}`
                }
              />
            </Box>

            <Box mb={0.5}>
              <Text color="gray.200" fontSize="xs" mb={0.5}>
                Difference:
              </Text>
              <BlockMath
                math={`|\\text{Binomial} - \\text{Normal}| = ${Math.abs(
                  binomialDiscreteSum - normalIntegralValue,
                ).toFixed(6)}`}
              />
            </Box>
          </Box>
        </VStack>
      </Box>

      {/* Main content */}
      <Flex flex={1} direction="column" height="100%" minHeight={0} overflow="hidden">
        <Box p={6} borderBottom="1px solid" borderColor="gray.700" flexShrink={0}>
          <Heading size="xl" color="gray.100">
            De Moivre-Laplace Theorem
          </Heading>
          <Text color="gray.400" mt={1} fontSize="sm">
            by: Sanay Nesargi
          </Text>
          <Text color="gray.400" mt={2} fontSize="sm">
            Binomial Distribution Visualization
          </Text>
        </Box>

        <Box flex={1} p={6} minHeight={0} overflow="hidden">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#4a5568"
                opacity={0.3}
              />
              <XAxis
                dataKey="x"
                stroke="#a0aec0"
                tick={{ fill: "#a0aec0" }}
                label={{
                  value: useProportions
                    ? "p̂ (sample proportion)"
                    : "k (number of successes)",
                  position: "insideBottom",
                  offset: -5,
                  fill: "#cbd5e0",
                  style: { fontSize: "14px" },
                }}
              />
              <YAxis
                stroke="#a0aec0"
                tick={{ fill: "#a0aec0" }}
                label={{
                  value: "Probability",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#cbd5e0",
                  style: { fontSize: "14px" },
                }}
              />
              <ReferenceArea
                x1={xMinScaled}
                x2={xMaxScaled}
                fill="#22c55e"
                fillOpacity={0.2}
                stroke="none"
              />
              <ReferenceLine
                x={xMinScaled}
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  value: useProportions
                    ? `p̂=${xMinScaled.toFixed(3)}`
                    : `x=${xMin}`,
                  position: "top",
                  fill: "#22c55e",
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                x={xMaxScaled}
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  value: useProportions
                    ? `p̂=${xMaxScaled.toFixed(3)}`
                    : `x=${xMax}`,
                  position: "top",
                  fill: "#22c55e",
                  fontSize: 12,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(26, 32, 44, 0.95)",
                  border: "1px solid #4a5568",
                  borderRadius: "8px",
                  color: "#cbd5e0",
                }}
                labelStyle={{ color: "#e2e8f0" }}
                formatter={(value: number | undefined, name: string | undefined) => {
                  if (value === undefined || name === undefined) return ["", ""];
                  if (name === "normalY") {
                    return [value.toFixed(6), "Normal PMF"];
                  }
                  return [value.toFixed(6), "Binomial PMF"];
                }}
              />
              <Bar
                dataKey="y"
                fill="#60a5fa"
                name="Binomial PMF"
                opacity={0.7}
              />
              <Line
                type="monotone"
                dataKey="normalY"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={false}
                name="Normal PMF"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </Flex>
          </>
        ) : (
          /* Notes Section */
          <Flex flex={1} direction="column" height="100%" overflowY="auto">
            <Box p={6} maxWidth="1200px" mx="auto" width="100%">
              <Heading size="xl" color="gray.100" mb={4}>
                Notes on the Proof
              </Heading>
              <Text color="gray.400" mb={6} fontSize="sm">
                by: Sanay Nesargi
              </Text>
              
              {/* LaTeX content */}
              <Box
                p={6}
                bg="gray.800"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.700"
              >
                <VStack align="stretch" gap={6}>
                  {/* Introduction */}
                  <Box>
                    <Heading size="md" color="gray.100" mb={3}>
                      Introduction and Intuition
                    </Heading>
                    <Text color="gray.300" fontSize="sm" mb={3} lineHeight="tall">
                      The De Moivre--Laplace theorem provides the first rigorous connection between the discrete binomial distribution and the continuous Gaussian distribution. Intuitively, it tells us that for a large number of independent Bernoulli trials, the random fluctuations of the number of successes around the mean become Gaussian.
                    </Text>
                    <Text color="gray.300" fontSize="sm" mb={3} lineHeight="tall">
                      We standardize the sum of Bernoulli random variables so that its mean is zero and its variance is one. The reason the Gaussian emerges is that, near the mean, the logarithm of the binomial probability mass function can be approximated by a quadratic function of the deviation from the mean. Exponentiating this quadratic gives the familiar bell-shaped curve.
                    </Text>
                    <Text color="gray.300" fontSize="sm" mb={2} fontWeight="bold">
                      Mathematically, the steps are:
                    </Text>
                    <VStack align="stretch" gap={1} ml={4}>
                      <Text color="gray.300" fontSize="sm">1. Center and scale the binomial random variable.</Text>
                      <Text color="gray.300" fontSize="sm">2. Approximate factorials using Stirling's formula.</Text>
                      <Text color="gray.300" fontSize="sm">3. Expand logarithms of ratios using Taylor series.</Text>
                      <Text color="gray.300" fontSize="sm">4. Show that the exponent is quadratic, giving the Gaussian density.</Text>
                      <Text color="gray.300" fontSize="sm">5. Account for the normalization factor (prefactor asymptotics).</Text>
                      <Text color="gray.300" fontSize="sm">6. Translate local probabilities into cumulative probabilities via Riemann sums and the Fundamental Theorem of Calculus.</Text>
                    </VStack>
                  </Box>

                  {/* Step 1 */}
                  <Box>
                    <Heading size="sm" color="gray.100" mb={2}>
                      Step 1: Standardization
                    </Heading>
                    <Text color="gray.300" fontSize="sm" mb={2}>
                      Let <InlineMath math="X_1, \dots, X_n" /> be independent Bernoulli(<InlineMath math="p" />) random variables (<InlineMath math="0<p<1" />) and define
                    </Text>
                    <BlockMath math="S_n = \sum_{i=1}^n X_i." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      Then <InlineMath math="\mathbb{E}[S_n] = np" /> and <InlineMath math="\mathrm{Var}(S_n) = npq" />, with <InlineMath math="q = 1-p" />.
                    </Text>
                    <Text color="gray.300" fontSize="sm" mb={2}>
                      We define the standardized variable
                    </Text>
                    <BlockMath math="X_n := \frac{S_n - np}{\sqrt{npq}}." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      Then <InlineMath math="X_n" /> takes values
                    </Text>
                    <BlockMath math="x_{n,k} := \frac{k-np}{\sqrt{npq}}, \quad k=0,1,\dots,n," />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      with spacing
                    </Text>
                    <BlockMath math="\Delta x_n = \frac{1}{\sqrt{npq}}." />
                  </Box>

                  {/* Step 2 */}
                  <Box>
                    <Heading size="sm" color="gray.100" mb={2}>
                      Step 2: Binomial Probability
                    </Heading>
                    <Text color="gray.300" fontSize="sm" mb={2}>
                      The probability mass function of <InlineMath math="S_n" /> is
                    </Text>
                    <BlockMath math="\mathbb{P}(S_n=k) = \binom{n}{k} p^k q^{n-k}." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      We aim to approximate this for
                    </Text>
                    <BlockMath math="k = np + y\sqrt{npq}, \quad y = O(1)" />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      as <InlineMath math="n\to\infty" />.
                    </Text>
                  </Box>

                  {/* Step 3 */}
                  <Box>
                    <Heading size="sm" color="gray.100" mb={2}>
                      Step 3: Stirling's Approximation
                    </Heading>
                    <Text color="gray.300" fontSize="sm" mb={2}>
                      We use Stirling's formula:
                    </Text>
                    <BlockMath math="m! \sim \sqrt{2\pi m}\left(\frac{m}{e}\right)^m." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      Applying this to <InlineMath math="n!" />, <InlineMath math="k!" />, and <InlineMath math="(n-k)!" />, we have
                    </Text>
                    <BlockMath math="\binom{n}{k} \sim \frac{\sqrt{2\pi n}(n/e)^n}{\sqrt{2\pi k}(k/e)^k \sqrt{2\pi (n-k)}((n-k)/e)^{n-k}} = \frac{1}{\sqrt{2\pi}}\sqrt{\frac{n}{k(n-k)}} \frac{n^n}{k^k (n-k)^{n-k}}." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      Multiplying by <InlineMath math="p^k q^{n-k}" /> gives
                    </Text>
                    <BlockMath math="\mathbb{P}(S_n=k) \sim \frac{1}{\sqrt{2\pi}} \sqrt{\frac{n}{k(n-k)}} \left(\frac{np}{k}\right)^k \left(\frac{nq}{n-k}\right)^{n-k}." />
                  </Box>

                  {/* Step 4 */}
                  <Box>
                    <Heading size="sm" color="gray.100" mb={2}>
                      Step 4: Taylor Expansion of Logarithms
                    </Heading>
                    <Text color="gray.300" fontSize="sm" mb={2}>
                      Consider
                    </Text>
                    <BlockMath math="\log\left(\frac{np}{k}\right) = \log\left(1 - \frac{k-np}{k}\right) \quad\text{and}\quad \log\left(\frac{nq}{n-k}\right) = \log\left(1 + \frac{k-np}{n-k}\right)." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      We use the Taylor expansion
                    </Text>
                    <BlockMath math="\log(1+u) = u - \frac{u^2}{2} + O(u^3), \quad |u|<1." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      Substituting <InlineMath math="k = np + y\sqrt{npq}" />:
                    </Text>
                    <BlockMath math="\frac{k-np}{k} = \frac{y\sqrt{npq}}{np + y\sqrt{npq}} = O(n^{-1/2})," />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      By the <strong>law of large numbers</strong>, <InlineMath math="k/n \to p" /> as <InlineMath math="n \to \infty" />, so <InlineMath math="k \approx np" /> for large <InlineMath math="n" />. This ensures the expansion is valid.
                    </Text>
                  </Box>

                  {/* Step 5 */}
                  <Box>
                    <Heading size="sm" color="gray.100" mb={2}>
                      Step 5: Expansion of Exponential Terms
                    </Heading>
                    <Text color="gray.300" fontSize="sm" mb={2}>
                      Compute
                    </Text>
                    <BlockMath math="k \log\frac{np}{k} = k \left(-\frac{k-np}{k} - \frac{1}{2} \left(\frac{k-np}{k}\right)^2 + O(n^{-3/2}) \right) = -(k-np) - \frac{(k-np)^2}{2k} + O(n^{-1/2})," />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      and similarly
                    </Text>
                    <BlockMath math="(n-k)\log\frac{nq}{n-k} = (n-k)\left(\frac{k-np}{n-k} - \frac{1}{2}\left(\frac{k-np}{n-k}\right)^2 + O(n^{-3/2})\right) = (k-np) - \frac{(k-np)^2}{2(n-k)} + O(n^{-1/2})." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      Adding these:
                    </Text>
                    <BlockMath math="-(k-np) + (k-np) = 0 \quad \text{(linear terms cancel)}" />
                    <BlockMath math="-\frac{(k-np)^2}{2k} - \frac{(k-np)^2}{2(n-k)} = -\frac{(k-np)^2}{2 npq} \left(1 + O(n^{-1/2})\right)." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      Exponentiating gives the Gaussian factor:
                    </Text>
                    <BlockMath math="\left(\frac{np}{k}\right)^k \left(\frac{nq}{n-k}\right)^{n-k} = e^{-y^2/2}\left(1 + O(n^{-1/2})\right), \quad y = \frac{k-np}{\sqrt{npq}}." />
                  </Box>

                  {/* Step 6 */}
                  <Box>
                    <Heading size="sm" color="gray.100" mb={2}>
                      Step 6: Prefactor Asymptotics
                    </Heading>
                    <Text color="gray.300" fontSize="sm" mb={2}>
                      Recall
                    </Text>
                    <BlockMath math="\sqrt{\frac{n}{k(n-k)}}." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      With <InlineMath math="k = np + y\sqrt{npq}" />:
                    </Text>
                    <BlockMath math="k(n-k) = n^2 pq \left(1 + O(n^{-1/2})\right)," />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      By the <strong>law of large numbers</strong>, <InlineMath math="k/n \to p" /> and <InlineMath math="(n-k)/n \to q" /> as <InlineMath math="n \to \infty" />, so <InlineMath math="k(n-k) \approx n^2 pq" /> for large <InlineMath math="n" />. Therefore,
                    </Text>
                    <BlockMath math="\sqrt{\frac{n}{k(n-k)}} = \frac{1}{\sqrt{npq}}\left(1 + O(n^{-1/2})\right)." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2} fontWeight="bold">
                      This ensures correct normalization.
                    </Text>
                  </Box>

                  {/* Step 7 */}
                  <Box>
                    <Heading size="sm" color="gray.100" mb={2}>
                      Step 7: Assemble Local Limit
                    </Heading>
                    <Text color="gray.300" fontSize="sm" mb={2}>
                      Combining the prefactor and exponent:
                    </Text>
                    <BlockMath math="\binom{n}{k} p^k q^{n-k} = \frac{1}{\sqrt{2\pi npq}} e^{-y^2/2} \left(1 + O(n^{-1/2})\right)." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      Since <InlineMath math="\Delta x_n = 1/\sqrt{npq}" />, the local probability for the standardized variable <InlineMath math="X_n" /> is
                    </Text>
                    <BlockMath math="\mathbb{P}(X_n = x_{n,k}) = \frac{1}{\sqrt{2\pi}} e^{-x_{n,k}^2/2} \, \Delta x_n \left(1 + O(n^{-1/2})\right)." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2} fontWeight="bold">
                      This is the local De Moivre--Laplace theorem.
                    </Text>
                  </Box>

                  {/* Step 8 */}
                  <Box>
                    <Heading size="sm" color="gray.100" mb={2}>
                      Step 8: From Local to Global (Riemann Sums)
                    </Heading>
                    <Text color="gray.300" fontSize="sm" mb={2}>
                      For cumulative probabilities over an interval <InlineMath math="[a,b]" />:
                    </Text>
                    <BlockMath math="\mathbb{P}(a < X_n \le b) = \sum_{k: a < x_{n,k} \le b} \mathbb{P}(X_n = x_{n,k})." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      Replacing each term by its local approximation:
                    </Text>
                    <BlockMath math="\sum_{a < x_{n,k} \le b} \frac{1}{\sqrt{2\pi}} e^{-x_{n,k}^2/2} \Delta x_n \longrightarrow \int_a^b \frac{1}{\sqrt{2\pi}} e^{-x^2/2} dx \quad \text{as } n\to\infty." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      By the <strong>Fundamental Theorem of Calculus</strong>, the sum converges to the integral of the Gaussian density.
                    </Text>
                  </Box>

                  {/* Step 9 */}
                  <Box>
                    <Heading size="sm" color="gray.100" mb={2}>
                      Step 9: De Moivre--Laplace Theorem
                    </Heading>
                    <Text color="gray.300" fontSize="sm" mb={2}>
                      Hence, we have rigorously shown:
                    </Text>
                    <BlockMath math="\lim_{n \to \infty} \mathbb{P}(a < X_n \le b) = \Phi(b) - \Phi(a)," />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2}>
                      where
                    </Text>
                    <BlockMath math="\Phi(x) = \int_{-\infty}^x \frac{1}{\sqrt{2\pi}} e^{-t^2/2} dt." />
                    <Text color="gray.300" fontSize="sm" mb={2} mt={2} fontWeight="bold">
                      This completes the proof.
                    </Text>
                  </Box>
                </VStack>
              </Box>
            </Box>
          </Flex>
        )}
      </Flex>
    </Flex>
    </Box>
  );
}
