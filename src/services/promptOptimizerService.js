/**
 * PromptKeeper 2.0 - Local-First AI Prompt Optimization Engine
 * Transforms casual or rough prompt drafts into high-performing, structured, production-ready prompts.
 * Adheres to Anthropic & OpenAI Prompt Engineering best practices:
 * 1. Role / Persona Definition
 * 2. Clear Context & Explicit Goals
 * 3. Step-by-Step Instructions & Chain of Thought
 * 4. Strict Negative Constraints & Edge Case Safeguards
 * 5. Structured Output Format Specifications
 * 6. Preserves existing variables {{var}} or intelligently injects parameters.
 */

import { extractVars } from '../data.js';

/**
 * Detects domain intent of prompt draft
 * @param {string} text 
 * @returns {'coding' | 'writing' | 'analysis' | 'general'}
 */
export function detectPromptDomain(text) {
  const lower = (text || '').toLowerCase();
  
  if (/\b(code|react|python|javascript|typescript|api|sql|bug|debug|function|css|html|backend|frontend|algo|refactor|test)\b/.test(lower)) {
    return 'coding';
  }
  if (/\b(write|blog|article|email|copy|tone|story|creative|script|marketing|newsletter|headline|essay)\b/.test(lower)) {
    return 'writing';
  }
  if (/\b(analyze|data|review|metrics|compare|summary|summarize|evaluate|report|insights|research|audit)\b/.test(lower)) {
    return 'analysis';
  }
  return 'general';
}

/**
 * Optimizes a prompt text based on chosen preset.
 * 
 * @param {string} originalText
 * @param {'production' | 'concise' | 'chain_of_thought'} [preset='production']
 * @param {Object} [options={}]
 * @returns {{
 *   optimized: string,
 *   domain: string,
 *   preset: string,
 *   variables: Array<string>,
 *   improvements: Array<string>,
 *   scoreBoost: number
 * }}
 */
export function optimizePrompt(originalText, preset = 'production', options = {}) {
  const trimmed = (originalText || '').trim();
  if (!trimmed) {
    return {
      optimized: '',
      domain: 'general',
      preset,
      variables: [],
      improvements: [],
      scoreBoost: 0
    };
  }

  const domain = detectPromptDomain(trimmed);
  const detectedVarObjects = extractVars(trimmed);
  const detectedVars = detectedVarObjects.map(v => typeof v === 'string' ? v : v.name);
  const improvements = [];

  // Extract core task goal by stripping conversational introductory fluff:
  // e.g. "Can you please write a...", "I need you to help me..."
  const cleanTask = trimmed
    .replace(/^(can you (please )?|i need you to |please |could you |act as if you are |i want you to )+/i, '')
    .trim();

  const taskSentence = cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1);

  let optimized = '';

  if (preset === 'concise') {
    // High-density, zero fluff, token-efficient imperative
    improvements.push('Removed conversational filler words');
    improvements.push('Enforced direct imperative instructions');
    improvements.push('Optimized token density for fast inference');

    if (domain === 'coding') {
      optimized = [
        `You are an expert software engineer.`,
        ``,
        `Task: ${taskSentence}`,
        ``,
        `Requirements:`,
        `- Write idiomatic, modern, production-grade code.`,
        `- Include type hints and handle edge cases/null guards.`,
        `- Return only clean, commented code with a brief implementation summary. No unnecessary conversational filler.`
      ].join('\n');
    } else if (domain === 'writing') {
      optimized = [
        `You are a senior professional copywriter and editor.`,
        ``,
        `Task: ${taskSentence}`,
        ``,
        `Guidelines:`,
        `- Adopt an authentic, compelling, human-sounding tone.`,
        `- Avoid generic AI clichés, robotic buzzwords, and repetitive sentence structures.`,
        `- Deliver structured, publish-ready copy immediately.`
      ].join('\n');
    } else {
      optimized = [
        `Role: Senior domain specialist.`,
        ``,
        `Objective: ${taskSentence}`,
        ``,
        `Execution:`,
        `- Provide a direct, high-signal response with zero filler.`,
        `- Prioritize accuracy, conciseness, and actionable insights.`,
        `- Format response in structured Markdown with bulleted highlights.`
      ].join('\n');
    }

  } else if (preset === 'chain_of_thought') {
    // Deep reasoning, scratchpad thinking, rigorous verification
    improvements.push('Added internal reasoning & verification step');
    improvements.push('Explicit problem decomposition');
    improvements.push('Rigorous edge-case & failure mode analysis');

    optimized = [
      `### Role & Persona`,
      `You are a distinguished principal architect and deep critical thinker known for meticulous attention to detail and rigorous verification.`,
      ``,
      `### Primary Objective`,
      `${taskSentence}`,
      ``,
      `### Thinking & Reasoning Protocol`,
      `Before providing your final deliverable, reason through the problem step-by-step:`,
      `1. **Problem Analysis**: Identify implicit constraints, edge cases, and potential ambiguities.`,
      `2. **Solution Architecture**: Evaluate alternative approaches and select the optimal strategy.`,
      `3. **Step-by-Step Draft**: Construct the complete solution methodically.`,
      `4. **Self-Verification**: Critically review against constraints, security considerations, and failure modes.`,
      ``,
      `### Output Format`,
      `- Begin with a concise \`### Rationale\` outlining your architectural decisions.`,
      `- Present the definitive, complete \`### Solution\`.`,
      `- Conclude with \`### Edge Cases & Considerations\` detailing how boundaries are handled.`
    ].join('\n');

  } else {
    // 'production' (Default): Comprehensive, professional, production-grade template
    improvements.push('Injected senior domain specialist persona');
    improvements.push('Added structured sections: Objective, Constraints, Steps, Output Schema');
    improvements.push('Defined strict negative guardrails (Anti-slop / No hallucination)');
    improvements.push('Standardized Markdown presentation format');

    if (domain === 'coding') {
      optimized = [
        `### Role`,
        `You are a Senior Principal Software Engineer with deep architectural mastery, adhering strictly to clean code, defensive programming, and modern industry standards.`,
        ``,
        `### Objective`,
        `${taskSentence}`,
        ``,
        `### Technical Guidelines & Requirements`,
        `- **Language Standards**: Write modern, clean, and idiomatic code with clear type definitions.`,
        `- **Defensive Architecture**: Validate all inputs, include null/undefined guards, and handle error boundaries gracefully.`,
        `- **Performance**: Prioritize optimal time/space complexity without premature over-engineering.`,
        `- **Documentation**: Include concise, purposeful comments for non-obvious business logic.`,
        ``,
        `### Negative Constraints (Strict)`,
        `- Do not omit code using placeholder comments (e.g. \`// ... implement here\`). Provide complete, runnable solutions.`,
        `- Do not introduce unnecessary external dependencies when native or standard libraries suffice.`,
        ``,
        `### Output Structure`,
        `1. **Implementation**: The complete, tested code block.`,
        `2. **Key Decisions**: Bullet points explaining crucial patterns or trade-offs.`,
        `3. **Usage Example**: A minimal, runnable snippet demonstrating expected usage.`
      ].join('\n');

    } else if (domain === 'writing') {
      optimized = [
        `### Role`,
        `You are a World-Class Technical Writer and Editor specializing in punchy, articulate, and memorable communication.`,
        ``,
        `### Objective`,
        `${taskSentence}`,
        ``,
        `### Style & Editorial Standards`,
        `- **Tone**: Authoritative, engaging, human, and tailored to the target audience.`,
        `- **Clarity**: Favor active voice, varied rhythm, and concrete examples over abstract prose.`,
        `- **Structure**: Use scannable formatting with descriptive headings, bullet points, and key takeaways.`,
        ``,
        `### Negative Constraints`,
        `- Strictly avoid AI clichés, repetitive adverbs, and superficial introductory fluff (e.g. "In today's fast-paced digital world...").`,
        `- Do not summarize unless explicitly requested.`,
        ``,
        `### Deliverable Format`,
        `- Return the finalized copy directly, polished and ready for publication.`
      ].join('\n');

    } else if (domain === 'analysis') {
      optimized = [
        `### Role`,
        `You are an Executive Strategic Analyst with deep quantitative reasoning and critical analytical rigor.`,
        ``,
        `### Objective`,
        `${taskSentence}`,
        ``,
        `### Methodology`,
        `- **Synthesis**: Distill complex data points into high-impact, actionable insights.`,
        `- **Trade-off Evaluation**: Explicitly weigh pros, cons, costs, and second-order consequences.`,
        `- **Actionability**: Formulate clear, ranked recommendations with operational feasibility.`,
        ``,
        `### Structure of Output`,
        `1. **Executive Summary** (1–2 sentences summarizing the core takeaway)`,
        `2. **Key Findings & Evidence**`,
        `3. **Comparative Analysis / Trade-offs**`,
        `4. **Actionable Recommendations** (Ranked by impact vs effort)`
      ].join('\n');

    } else {
      optimized = [
        `### Role & Identity`,
        `You are a distinguished domain expert and precise assistant committed to excellence, accuracy, and thoroughness.`,
        ``,
        `### Objective`,
        `${taskSentence}`,
        ``,
        `### Instructions`,
        `- Carefully address all explicit and implicit requirements of the task.`,
        `- Structure your explanation logically from foundational concepts to nuanced applications.`,
        `- Ensure all statements are factually sound, grounded in first principles, and directly applicable.`,
        ``,
        `### Output Specifications`,
        `- Format using clear GitHub-flavored Markdown with headers, bold emphasis, and bulleted lists.`,
        `- Keep the output dense with high signal-to-noise ratio.`
      ].join('\n');
    }
  }

  // Preserve any dynamic variables originally in the text if they weren't in the template
  const missingVars = detectedVars.filter(v => !optimized.includes(`{{${v}}}`) && !optimized.includes(`{${v}}`) && !optimized.includes(`[${v}]`));
  if (missingVars.length > 0) {
    optimized += `\n\n### Parameters & Variables\n` + missingVars.map(v => `- \`{{${v}}}\`: Specify target value`).join('\n');
    improvements.push(`Preserved ${missingVars.length} dynamic variable placeholders`);
  }

  const scoreBoost = preset === 'production' ? 45 : preset === 'chain_of_thought' ? 55 : 30;

  return {
    optimized,
    domain,
    preset,
    variables: detectedVars,
    improvements,
    scoreBoost
  };
}

/**
 * Resolves a prompt template with provided variable values.
 * 
 * @param {string} template 
 * @param {Record<string, string>} values 
 * @returns {string} Assembled prompt
 */
export function resolvePromptVariables(template, values = {}) {
  if (!template) return '';
  let result = template;

  Object.entries(values).forEach(([key, val]) => {
    if (val === undefined || val === null) return;
    const cleanVal = String(val);

    // Replace {{var}}
    const reHandlebars = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(reHandlebars, cleanVal);

    // Replace {var}
    const reBrace = new RegExp(`(?<!\\{)\\{${key}\\}(?!\\})`, 'g');
    result = result.replace(reBrace, cleanVal);

    // Replace [var]
    const reBracket = new RegExp(`\\[${key}\\]`, 'g');
    result = result.replace(reBracket, cleanVal);

    // Replace %var%
    const rePercent = new RegExp(`%${key}%`, 'g');
    result = result.replace(rePercent, cleanVal);
  });

  return result;
}
