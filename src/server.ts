import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ============================================
// BMI MCP Server - stdio Transport (for OpenCode)
// ============================================

const SERVER_NAME = 'bmi-mcp-server';
const SERVER_VERSION = '1.0.0';

// Initialize MCP Server
const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});

// ============================================
// Helper Functions
// ============================================

function getBmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  if (bmi < 35) return 'Obesity Class I';
  if (bmi < 40) return 'Obesity Class II';
  return 'Obesity Class III';
}

function getRecommendations(category: string): string[] {
  const recommendations: Record<string, string[]> = {
    'Underweight': [
      'Consider consulting a nutritionist for a healthy weight gain plan',
      'Focus on nutrient-dense foods with adequate protein',
      'Include strength training exercises to build muscle mass',
      'Rule out underlying health conditions with a healthcare provider',
    ],
    'Normal weight': [
      'Maintain current healthy lifestyle habits',
      'Continue regular physical activity (150+ minutes/week)',
      'Focus on balanced nutrition with variety',
      'Regular health check-ups for preventive care',
    ],
    'Overweight': [
      'Aim for gradual weight loss (0.5-1 kg per week)',
      'Increase physical activity to 200+ minutes per week',
      'Focus on whole foods, reduce processed food intake',
      'Monitor portion sizes and practice mindful eating',
    ],
    'Obesity Class I': [
      'Consult a healthcare provider for personalized plan',
      'Consider working with a dietitian and fitness professional',
      'Focus on sustainable lifestyle changes, not crash diets',
      'Monitor for obesity-related conditions (diabetes, hypertension)',
    ],
    'Obesity Class II': [
      'Seek medical guidance for comprehensive weight management',
      'May benefit from structured intervention programs',
      'Regular monitoring of cardiovascular health markers',
      'Consider mental health support for sustainable changes',
    ],
    'Obesity Class III': [
      'Priority: consultation with obesity medicine specialist',
      'Discuss all options including medical and surgical interventions',
      'Regular screening for metabolic and cardiovascular conditions',
      'Build support network for long-term management',
    ],
  };
  return recommendations[category] || [];
}

// ============================================
// Tools
// ============================================

// Tool 1: Calculate BMI
server.tool(
  'calculate-bmi',
  'Calculate Body Mass Index from weight (kg) and height (m). Returns BMI value and category.',
  { weightKg: z.number(), heightM: z.number() },
  async (args: { weightKg: number; heightM: number }) => {
    const bmi = args.weightKg / (args.heightM * args.heightM);
    const roundedBmi = Math.round(bmi * 100) / 100;
    const category = getBmiCategory(roundedBmi);
    return {
      content: [{ type: 'text', text: JSON.stringify({ bmi: roundedBmi, category }, null, 2) }],
    };
  }
);

// Tool 2: Convert Weight
server.tool(
  'convert-weight',
  'Convert weight between kilograms and pounds.',
  { value: z.number(), fromUnit: z.string(), toUnit: z.string() },
  async (args: { value: number; fromUnit: string; toUnit: string }) => {
    let convertedValue: number;
    if (args.fromUnit === args.toUnit) {
      convertedValue = args.value;
    } else if (args.fromUnit === 'kg' && args.toUnit === 'lb') {
      convertedValue = args.value * 2.20462;
    } else {
      convertedValue = args.value / 2.20462;
    }
    const result = {
      originalValue: args.value,
      originalUnit: args.fromUnit,
      convertedValue: Math.round(convertedValue * 100) / 100,
      convertedUnit: args.toUnit,
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Tool 3: Get BMI Recommendations
server.tool(
  'get-bmi-recommendations',
  'Get health recommendations based on BMI value.',
  { bmi: z.number() },
  async (args: { bmi: number }) => {
    const category = getBmiCategory(args.bmi);
    const recommendations = getRecommendations(category);
    return {
      content: [{ type: 'text', text: JSON.stringify({ category, recommendations }, null, 2) }],
    };
  }
);

// ============================================
// Resources
// ============================================

server.resource(
  'bmi-categories',
  'bmi://categories',
  async () => ({
    contents: [
      {
        uri: 'bmi://categories',
        mimeType: 'application/json',
        text: JSON.stringify({
          categories: [
            { name: 'Underweight', range: '< 18.5' },
            { name: 'Normal weight', range: '18.5 - 24.9' },
            { name: 'Overweight', range: '25 - 29.9' },
            { name: 'Obesity Class I', range: '30 - 34.9' },
            { name: 'Obesity Class II', range: '35 - 39.9' },
            { name: 'Obesity Class III', range: '>= 40' },
          ],
        }, null, 2),
      },
    ],
  })
);

// ============================================
// Prompts
// ============================================

server.prompt(
  'analyze-bmi',
  'Generate a prompt for analyzing BMI results with health context',
  async () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: 'Analyze the BMI calculation results and provide a health assessment.',
        },
      },
    ],
  })
);

// ============================================
// Server Startup
// ============================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[${SERVER_NAME}] Server started on stdio`);
}

main().catch((error) => {
  console.error(`[${SERVER_NAME}] Fatal error:`, error);
  process.exit(1);
});
