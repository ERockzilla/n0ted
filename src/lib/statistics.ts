/**
 * ---
 * purpose: Advanced statistical analysis library for GeoForecaster
 * features:
 *   - Linear algebra primitives (matrix operations)
 *   - Regression analysis (linear, polynomial, exponential)
 *   - Correlation analysis with significance testing
 *   - Hidden correlation discovery across countries
 * dependencies: Pure TypeScript, no external libraries
 * ---
 */

// ============================================
// LINEAR ALGEBRA PRIMITIVES
// ============================================

/**
 * Transpose a matrix
 */
export function transpose(matrix: number[][]): number[][] {
    if (matrix.length === 0) return [];
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result: number[][] = [];
    for (let j = 0; j < cols; j++) {
        result[j] = [];
        for (let i = 0; i < rows; i++) {
            result[j][i] = matrix[i][j];
        }
    }
    return result;
}

/**
 * Matrix multiplication: A (m×n) × B (n×p) = C (m×p)
 */
export function matrixMultiply(A: number[][], B: number[][]): number[][] {
    const m = A.length;
    const n = A[0].length;
    const p = B[0].length;

    if (B.length !== n) {
        throw new Error(`Matrix dimensions incompatible: A is ${m}×${n}, B is ${B.length}×${p}`);
    }

    const C: number[][] = [];
    for (let i = 0; i < m; i++) {
        C[i] = [];
        for (let j = 0; j < p; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) {
                sum += A[i][k] * B[k][j];
            }
            C[i][j] = sum;
        }
    }
    return C;
}

/**
 * Solve linear system Ax = b using Gaussian elimination with partial pivoting
 */
export function solveLinear(A: number[][], b: number[]): number[] {
    const n = A.length;

    // Create augmented matrix
    const aug: number[][] = A.map((row, i) => [...row, b[i]]);

    // Forward elimination with partial pivoting
    for (let col = 0; col < n; col++) {
        // Find pivot
        let maxRow = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
                maxRow = row;
            }
        }

        // Swap rows
        [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

        // Check for singular matrix
        if (Math.abs(aug[col][col]) < 1e-10) {
            throw new Error('Matrix is singular or nearly singular');
        }

        // Eliminate column
        for (let row = col + 1; row < n; row++) {
            const factor = aug[row][col] / aug[col][col];
            for (let j = col; j <= n; j++) {
                aug[row][j] -= factor * aug[col][j];
            }
        }
    }

    // Back substitution
    const x: number[] = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
        x[i] = aug[i][n];
        for (let j = i + 1; j < n; j++) {
            x[i] -= aug[i][j] * x[j];
        }
        x[i] /= aug[i][i];
    }

    return x;
}

// ============================================
// REGRESSION ANALYSIS
// ============================================

export interface RegressionResult {
    coefficients: number[];          // [intercept, slope] or polynomial coefficients
    rSquared: number;                // Coefficient of determination (0-1)
    adjustedRSquared: number;        // Adjusted R² for degrees of freedom
    standardError: number;           // Standard error of estimate
    residuals: number[];             // Observed - Predicted
    fStatistic: number;              // F-statistic for overall significance
    pValue: number;                  // P-value for F-test
    predict: (x: number) => number;  // Prediction function
    predictWithConfidence: (x: number, level?: number) => {
        predicted: number;
        lower: number;
        upper: number;
    };
    type: 'linear' | 'polynomial' | 'exponential' | 'logarithmic';
    degree?: number;                 // For polynomial regression
}

/**
 * Calculate mean of an array
 */
function mean(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Calculate standard deviation
 */
function stdDev(arr: number[]): number {
    const m = mean(arr);
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / arr.length;
    return Math.sqrt(variance);
}

/**
 * T-distribution critical value approximation for 95% confidence
 */
function tCritical(df: number, alpha: number = 0.05): number {
    // Approximation for two-tailed critical value
    if (df <= 0) return 2;
    if (df === 1) return 12.71;
    if (df === 2) return 4.30;
    if (df <= 5) return 2.57;
    if (df <= 10) return 2.23;
    if (df <= 20) return 2.09;
    if (df <= 30) return 2.04;
    return 1.96; // Normal approximation for large df
}

/**
 * Ordinary Least Squares Linear Regression
 * y = a + bx
 */
export function linearRegression(x: number[], y: number[]): RegressionResult {
    const n = x.length;
    if (n !== y.length || n < 2) {
        throw new Error('Arrays must have same length and at least 2 points');
    }

    const xMean = mean(x);
    const yMean = mean(y);

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
        numerator += (x[i] - xMean) * (y[i] - yMean);
        denominator += (x[i] - xMean) ** 2;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Calculate predictions and residuals
    const predictions = x.map(xi => intercept + slope * xi);
    const residuals = y.map((yi, i) => yi - predictions[i]);

    // Calculate R²
    const ssTotal = y.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0);
    const ssResidual = residuals.reduce((sum, r) => sum + r ** 2, 0);
    const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

    // Adjusted R²
    const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - 2);

    // Standard error
    const standardError = Math.sqrt(ssResidual / (n - 2));

    // F-statistic
    const ssRegression = ssTotal - ssResidual;
    const fStatistic = ssResidual > 0 ? (ssRegression / 1) / (ssResidual / (n - 2)) : 0;

    // Approximate p-value (simplified)
    const pValue = fStatistic > 10 ? 0.001 : fStatistic > 4 ? 0.05 : fStatistic > 2 ? 0.1 : 0.5;

    // Standard error of slope for confidence intervals
    const slopeStdErr = denominator > 0 ? standardError / Math.sqrt(denominator) : 0;
    const t = tCritical(n - 2);

    return {
        coefficients: [intercept, slope],
        rSquared: Math.max(0, Math.min(1, rSquared)),
        adjustedRSquared: Math.max(0, Math.min(1, adjustedRSquared)),
        standardError,
        residuals,
        fStatistic,
        pValue,
        type: 'linear',
        predict: (xVal: number) => intercept + slope * xVal,
        predictWithConfidence: (xVal: number, level: number = 0.95) => {
            const predicted = intercept + slope * xVal;
            const margin = t * standardError * Math.sqrt(1 + 1 / n + ((xVal - xMean) ** 2) / denominator);
            return {
                predicted,
                lower: predicted - margin,
                upper: predicted + margin
            };
        }
    };
}

/**
 * Polynomial Regression (degree 2-4)
 * y = a0 + a1*x + a2*x² + ...
 */
export function polynomialRegression(x: number[], y: number[], degree: number = 2): RegressionResult {
    const n = x.length;
    if (n !== y.length || n < degree + 1) {
        throw new Error(`Need at least ${degree + 1} points for degree ${degree} polynomial`);
    }

    degree = Math.min(Math.max(degree, 1), 4); // Clamp to 1-4

    // Build Vandermonde matrix
    const X: number[][] = x.map(xi => {
        const row: number[] = [];
        for (let j = 0; j <= degree; j++) {
            row.push(xi ** j);
        }
        return row;
    });

    // Normal equations: (X'X)β = X'y
    const Xt = transpose(X);
    const XtX = matrixMultiply(Xt, X);
    const Xty = matrixMultiply(Xt, y.map(yi => [yi])).map(row => row[0]);

    // Solve for coefficients
    const coefficients = solveLinear(XtX, Xty);

    // Calculate predictions
    const predict = (xVal: number) => {
        return coefficients.reduce((sum, coef, j) => sum + coef * (xVal ** j), 0);
    };

    const predictions = x.map(predict);
    const residuals = y.map((yi, i) => yi - predictions[i]);

    // R² calculation
    const yMean = mean(y);
    const ssTotal = y.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0);
    const ssResidual = residuals.reduce((sum, r) => sum + r ** 2, 0);
    const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

    // Adjusted R²
    const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - degree - 1);

    const standardError = Math.sqrt(ssResidual / (n - degree - 1));
    const ssRegression = ssTotal - ssResidual;
    const fStatistic = ssResidual > 0 ? (ssRegression / degree) / (ssResidual / (n - degree - 1)) : 0;
    const pValue = fStatistic > 10 ? 0.001 : fStatistic > 4 ? 0.05 : 0.5;

    const t = tCritical(n - degree - 1);

    return {
        coefficients,
        rSquared: Math.max(0, Math.min(1, rSquared)),
        adjustedRSquared: Math.max(0, Math.min(1, adjustedRSquared)),
        standardError,
        residuals,
        fStatistic,
        pValue,
        type: 'polynomial',
        degree,
        predict,
        predictWithConfidence: (xVal: number) => {
            const predicted = predict(xVal);
            const margin = t * standardError * 1.5; // Simplified confidence band
            return { predicted, lower: predicted - margin, upper: predicted + margin };
        }
    };
}

/**
 * Exponential Regression
 * y = a * e^(bx) → ln(y) = ln(a) + bx
 */
export function exponentialRegression(x: number[], y: number[]): RegressionResult {
    // Filter positive y values (required for log)
    const filtered = x.map((xi, i) => ({ x: xi, y: y[i] }))
        .filter(p => p.y > 0);

    if (filtered.length < 2) {
        throw new Error('Need at least 2 positive y values for exponential regression');
    }

    const xFiltered = filtered.map(p => p.x);
    const lnY = filtered.map(p => Math.log(p.y));

    // Linear regression on transformed data
    const linResult = linearRegression(xFiltered, lnY);

    const a = Math.exp(linResult.coefficients[0]); // e^intercept
    const b = linResult.coefficients[1];           // slope

    const predict = (xVal: number) => a * Math.exp(b * xVal);

    // Calculate residuals on original scale
    const predictions = x.map(predict);
    const residuals = y.map((yi, i) => yi - predictions[i]);

    const yMean = mean(y);
    const ssTotal = y.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0);
    const ssResidual = residuals.reduce((sum, r) => sum + r ** 2, 0);
    const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : linResult.rSquared;

    return {
        coefficients: [a, b],
        rSquared: Math.max(0, Math.min(1, rSquared)),
        adjustedRSquared: Math.max(0, rSquared - 0.02),
        standardError: linResult.standardError,
        residuals,
        fStatistic: linResult.fStatistic,
        pValue: linResult.pValue,
        type: 'exponential',
        predict,
        predictWithConfidence: (xVal: number) => {
            const predicted = predict(xVal);
            const margin = predicted * 0.1; // 10% confidence band
            return { predicted, lower: predicted - margin, upper: predicted + margin };
        }
    };
}

// ============================================
// CORRELATION ANALYSIS
// ============================================

export interface CorrelationResult {
    coefficient: number;             // Pearson r (-1 to 1)
    rSquared: number;                // r²
    pValue: number;                  // Statistical significance
    significant: boolean;            // p < 0.05
    strength: 'negligible' | 'weak' | 'moderate' | 'strong' | 'very strong';
    direction: 'positive' | 'negative' | 'none';
    n: number;                       // Sample size
}

/**
 * Pearson correlation coefficient with significance test
 */
export function correlationCoefficient(x: number[], y: number[]): CorrelationResult {
    const n = x.length;
    if (n !== y.length || n < 3) {
        return {
            coefficient: 0,
            rSquared: 0,
            pValue: 1,
            significant: false,
            strength: 'negligible',
            direction: 'none',
            n
        };
    }

    const xMean = mean(x);
    const yMean = mean(y);

    let numerator = 0;
    let sumXSq = 0;
    let sumYSq = 0;

    for (let i = 0; i < n; i++) {
        const xDiff = x[i] - xMean;
        const yDiff = y[i] - yMean;
        numerator += xDiff * yDiff;
        sumXSq += xDiff ** 2;
        sumYSq += yDiff ** 2;
    }

    const denominator = Math.sqrt(sumXSq * sumYSq);
    const r = denominator > 0 ? numerator / denominator : 0;

    // T-test for correlation significance
    const t = Math.abs(r) * Math.sqrt((n - 2) / (1 - r ** 2 + 1e-10));

    // Approximate p-value
    let pValue: number;
    if (t > 3.5) pValue = 0.001;
    else if (t > 2.5) pValue = 0.01;
    else if (t > 2.0) pValue = 0.05;
    else if (t > 1.5) pValue = 0.1;
    else pValue = 0.5;

    // Classify strength
    const absR = Math.abs(r);
    let strength: CorrelationResult['strength'];
    if (absR < 0.1) strength = 'negligible';
    else if (absR < 0.3) strength = 'weak';
    else if (absR < 0.5) strength = 'moderate';
    else if (absR < 0.7) strength = 'strong';
    else strength = 'very strong';

    return {
        coefficient: r,
        rSquared: r ** 2,
        pValue,
        significant: pValue < 0.05,
        strength,
        direction: r > 0.05 ? 'positive' : r < -0.05 ? 'negative' : 'none',
        n
    };
}

/**
 * Calculate correlation matrix for multiple variables
 */
export function correlationMatrix(data: Record<string, number[]>): {
    variables: string[];
    matrix: number[][];
    pValues: number[][];
} {
    const variables = Object.keys(data);
    const n = variables.length;
    const matrix: number[][] = [];
    const pValues: number[][] = [];

    for (let i = 0; i < n; i++) {
        matrix[i] = [];
        pValues[i] = [];
        for (let j = 0; j < n; j++) {
            if (i === j) {
                matrix[i][j] = 1;
                pValues[i][j] = 0;
            } else if (i < j) {
                const result = correlationCoefficient(data[variables[i]], data[variables[j]]);
                matrix[i][j] = result.coefficient;
                pValues[i][j] = result.pValue;
            } else {
                matrix[i][j] = matrix[j][i];
                pValues[i][j] = pValues[j][i];
            }
        }
    }

    return { variables, matrix, pValues };
}

// ============================================
// HIDDEN CORRELATION DISCOVERY
// ============================================

export interface DiscoveredCorrelation {
    metric1: { country: string; name: string };
    metric2: { country: string; name: string };
    correlation: number;
    pValue: number;
    strength: CorrelationResult['strength'];
    interpretation: string;
    surprise: number;  // 0-1, higher = more unexpected
    sameCountry: boolean;
}

// Known/expected correlations to filter out
const EXPECTED_CORRELATIONS = new Set([
    'gdp_ppp_billions|exports_billions',
    'gdp_ppp_billions|imports_billions',
    'exports_billions|imports_billions',
    'population|gdp_ppp_billions',
    'gdp_growth_pct|unemployment_pct',
    'life_expectancy|gdp_per_capita',
]);

function isExpectedCorrelation(metric1: string, metric2: string): boolean {
    const key1 = `${metric1}|${metric2}`;
    const key2 = `${metric2}|${metric1}`;
    return EXPECTED_CORRELATIONS.has(key1) || EXPECTED_CORRELATIONS.has(key2);
}

function generateInterpretation(
    metric1: string, country1: string,
    metric2: string, country2: string,
    r: number
): string {
    const direction = r > 0 ? 'positively' : 'negatively';
    const strength = Math.abs(r) > 0.7 ? 'strongly' : Math.abs(r) > 0.5 ? 'moderately' : 'weakly';

    if (country1 === country2) {
        return `${metric1.replace(/_/g, ' ')} is ${strength} ${direction} correlated with ${metric2.replace(/_/g, ' ')} in ${country1}`;
    } else {
        return `${metric1.replace(/_/g, ' ')} in ${country1} is ${strength} ${direction} correlated with ${metric2.replace(/_/g, ' ')} in ${country2}`;
    }
}

export interface TimeSeriesData {
    [country: string]: {
        [metric: string]: Array<{ year: number; value: number }>;
    };
}

/**
 * Discover non-obvious correlations across countries and metrics
 */
export function discoverCorrelations(
    timeseries: TimeSeriesData,
    options?: {
        countries?: string[];           // Filter to specific countries
        metrics?: string[];             // Filter to specific metrics
        minCorrelation?: number;        // Minimum |r| to report (default 0.7)
        excludeExpected?: boolean;      // Exclude known relationships
        topN?: number;                  // Return only top N results (default 20)
        crossCountryOnly?: boolean;     // Only cross-country correlations
    }
): DiscoveredCorrelation[] {
    const {
        countries = Object.keys(timeseries),
        metrics,
        minCorrelation = 0.7,
        excludeExpected = true,
        topN = 20,
        crossCountryOnly = false
    } = options || {};

    const discovered: DiscoveredCorrelation[] = [];

    // Build list of all (country, metric, values) tuples
    interface DataSeries {
        country: string;
        metric: string;
        years: number[];
        values: number[];
    }

    const allSeries: DataSeries[] = [];

    for (const country of countries) {
        if (!timeseries[country]) continue;

        const countryMetrics = metrics || Object.keys(timeseries[country]);

        for (const metric of countryMetrics) {
            const series = timeseries[country][metric];
            if (!series || series.length < 5) continue; // Need enough data points

            allSeries.push({
                country,
                metric,
                years: series.map(s => s.year),
                values: series.map(s => s.value)
            });
        }
    }

    // Compare all pairs
    for (let i = 0; i < allSeries.length; i++) {
        for (let j = i + 1; j < allSeries.length; j++) {
            const s1 = allSeries[i];
            const s2 = allSeries[j];

            // Skip same metric in same country
            if (s1.country === s2.country && s1.metric === s2.metric) continue;

            // Skip cross-country if not requested
            if (crossCountryOnly && s1.country === s2.country) continue;

            // Skip expected correlations
            if (excludeExpected && isExpectedCorrelation(s1.metric, s2.metric)) continue;

            // Find overlapping years
            const commonYears = s1.years.filter(y => s2.years.includes(y));
            if (commonYears.length < 5) continue;

            // Extract values for common years
            const values1 = commonYears.map(y => {
                const idx = s1.years.indexOf(y);
                return s1.values[idx];
            });
            const values2 = commonYears.map(y => {
                const idx = s2.years.indexOf(y);
                return s2.values[idx];
            });

            // Calculate correlation
            const result = correlationCoefficient(values1, values2);

            if (Math.abs(result.coefficient) >= minCorrelation && result.significant) {
                // Calculate surprise score (cross-country + unexpected metric pairs = more surprising)
                let surprise = 0;
                if (s1.country !== s2.country) surprise += 0.3;
                if (s1.metric !== s2.metric) surprise += 0.3;
                surprise += (Math.abs(result.coefficient) - 0.7) / 0.3 * 0.4; // Higher r = more surprising

                discovered.push({
                    metric1: { country: s1.country, name: s1.metric },
                    metric2: { country: s2.country, name: s2.metric },
                    correlation: result.coefficient,
                    pValue: result.pValue,
                    strength: result.strength,
                    interpretation: generateInterpretation(
                        s1.metric, s1.country,
                        s2.metric, s2.country,
                        result.coefficient
                    ),
                    surprise: Math.min(1, surprise),
                    sameCountry: s1.country === s2.country
                });
            }
        }
    }

    // Sort by surprise score (descending), then by absolute correlation
    discovered.sort((a, b) => {
        const surpriseDiff = b.surprise - a.surprise;
        if (Math.abs(surpriseDiff) > 0.1) return surpriseDiff;
        return Math.abs(b.correlation) - Math.abs(a.correlation);
    });

    return discovered.slice(0, topN);
}

// ============================================
// TIME SERIES UTILITIES
// ============================================

/**
 * Simple Moving Average
 */
export function movingAverage(data: number[], window: number): number[] {
    if (window < 1 || window > data.length) return data;

    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - window + 1);
        const slice = data.slice(start, i + 1);
        result.push(mean(slice));
    }
    return result;
}

/**
 * Exponential Moving Average
 */
export function exponentialMovingAverage(data: number[], alpha: number = 0.3): number[] {
    if (data.length === 0) return [];

    const result: number[] = [data[0]];
    for (let i = 1; i < data.length; i++) {
        result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
    }
    return result;
}

/**
 * Detect anomalies (values > 2 std dev from trend)
 */
export function detectAnomalies(data: number[], threshold: number = 2): number[] {
    if (data.length < 3) return [];

    const m = mean(data);
    const s = stdDev(data);

    return data
        .map((val, idx) => ({ val, idx }))
        .filter(({ val }) => Math.abs(val - m) > threshold * s)
        .map(({ idx }) => idx);
}

/**
 * Forecast future values with confidence intervals
 */
export function forecast(
    data: Array<{ year: number; value: number }>,
    yearsAhead: number = 5,
    method: 'linear' | 'polynomial' | 'exponential' = 'linear'
): Array<{ year: number; predicted: number; lower95: number; upper95: number }> {
    if (data.length < 3) return [];

    const x = data.map(d => d.year);
    const y = data.map(d => d.value);

    let regression: RegressionResult;
    try {
        switch (method) {
            case 'polynomial':
                regression = polynomialRegression(x, y, 2);
                break;
            case 'exponential':
                regression = exponentialRegression(x, y);
                break;
            default:
                regression = linearRegression(x, y);
        }
    } catch {
        regression = linearRegression(x, y);
    }

    const lastYear = Math.max(...x);
    const results: Array<{ year: number; predicted: number; lower95: number; upper95: number }> = [];

    for (let i = 1; i <= yearsAhead; i++) {
        const year = lastYear + i;
        const { predicted, lower, upper } = regression.predictWithConfidence(year, 0.95);
        results.push({
            year,
            predicted,
            lower95: lower,
            upper95: upper
        });
    }

    return results;
}

// ============================================
// DEFAULT EXAMPLE FOR UI
// ============================================

/**
 * Generate a default example showing the tool's capabilities
 * Uses well-known countries with rich data
 */
export function getDefaultExample(): {
    countries: string[];
    description: string;
    expectedFindings: string[];
} {
    return {
        countries: ['united_states', 'china', 'germany', 'japan'],
        description: 'Cross-analyze major economies to discover hidden correlations between trade patterns, demographic shifts, and economic growth.',
        expectedFindings: [
            'Export growth patterns between trade partners',
            'Demographic transitions affecting GDP growth',
            'Military spending response patterns',
            'Inflation correlations in interconnected economies'
        ]
    };
}
