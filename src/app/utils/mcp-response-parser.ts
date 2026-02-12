import { MessageMetadata, AgenticStep } from '../models/message.model';

export interface ParsedMcpResponse {
  content: string;
  metadata: MessageMetadata;
}

/**
 * Parse MCP agentic response text (markdown) into structured content + metadata.
 *
 * Extracts Technical Details and Debug Information into MessageMetadata,
 * converts the JSON data block into a markdown table, and returns only the
 * clean result as the content string.
 */
export function parseMcpResponseText(text: string): ParsedMcpResponse {
  if (!text || !text.includes('## ')) {
    return { content: text || '', metadata: {} };
  }

  const metadata: MessageMetadata = {};

  // 1. Extract goal status from first line
  const statusMatch = text.match(/Query Execution\s*-\s*(SUCCESS|FAILED|ERROR)/i);
  if (statusMatch) {
    metadata.goalAchieved = statusMatch[1].toUpperCase() === 'SUCCESS';
  }

  // 2. Split into sections by ## headings
  const sections = splitIntoSections(text);

  // 3. Parse Technical Details
  const techSection = sections.get('Technical Details');
  if (techSection) {
    metadata.executionPath = 'MCP_SUBPROCESS';

    const totalTimeMatch = techSection.match(/Total Time:\s*([\d,]+)\s*ms/i);
    if (totalTimeMatch) {
      metadata.executionTime = parseInt(totalTimeMatch[1].replace(/,/g, ''), 10);
    }

    const iterationsMatch = techSection.match(/Iterations:\s*(\d+)\s*\/\s*(\d+)/i);
    if (iterationsMatch) {
      metadata.iterationCount = parseInt(iterationsMatch[1], 10);
      metadata.maxIterations = parseInt(iterationsMatch[2], 10);
    }

    const strategyMatch = techSection.match(/Strategy:\s*(.+)/i);
    if (strategyMatch) {
      metadata.agentStrategy = strategyMatch[1].trim();
    }

    const tablesMatch = techSection.match(/Tables:\s*(.+)/i);
    if (tablesMatch) {
      metadata.tablesUsed = tablesMatch[1].split(',').map(t => t.trim()).filter(Boolean);
    }
  }

  // 4. Parse Debug Information into AgenticStep[]
  const debugSection = sections.get('Debug Information');
  if (debugSection) {
    metadata.executionSteps = parseExecutionTrace(debugSection);
  }

  // 5. Parse Result section — convert JSON data to markdown table
  const resultSection = sections.get('Result');
  let cleanContent = '';

  if (resultSection) {
    const recordsMatch = resultSection.match(/Records Found:\s*(\d+)/i);
    const recordCount = recordsMatch ? parseInt(recordsMatch[1], 10) : null;

    // Extract JSON code block
    const jsonBlockRegex = /```json\s*\n?([\s\S]*?)```/;
    const jsonMatch = resultSection.match(jsonBlockRegex);

    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1].trim());
        cleanContent = buildMarkdownTable(jsonData, recordCount);
      } catch {
        cleanContent = buildFallbackContent(resultSection, recordCount);
      }
    } else {
      cleanContent = buildFallbackContent(resultSection, recordCount);
    }
  } else {
    // No Result section — strip technical sections and use the rest
    cleanContent = stripTechnicalSections(text);
  }

  if (!cleanContent.trim()) {
    cleanContent = metadata.goalAchieved === false
      ? 'Query execution failed.'
      : 'Query executed successfully.';
  }

  if (!metadata.executionPath && (metadata.goalAchieved !== undefined || metadata.executionSteps)) {
    metadata.executionPath = 'MCP_SUBPROCESS';
  }

  return { content: cleanContent, metadata };
}

// ── Helpers ──────────────────────────────────────────────────────

function splitIntoSections(text: string): Map<string, string> {
  const sections = new Map<string, string>();
  const sectionRegex = /^## (.+)$/gm;
  let match: RegExpExecArray | null;
  const headings: { name: string; startIndex: number; lineEnd: number }[] = [];

  while ((match = sectionRegex.exec(text)) !== null) {
    headings.push({
      name: match[1].trim(),
      startIndex: match.index,
      lineEnd: match.index + match[0].length
    });
  }

  for (let i = 0; i < headings.length; i++) {
    const bodyStart = headings[i].lineEnd;
    const bodyEnd = i + 1 < headings.length ? headings[i + 1].startIndex : text.length;
    sections.set(headings[i].name, text.substring(bodyStart, bodyEnd).trim());
  }

  return sections;
}

function parseExecutionTrace(debugText: string): AgenticStep[] {
  const steps: AgenticStep[] = [];
  const stepRegex = /(\d+)\.\s*\[Iteration\s+(\d+)\]\s*(\S+)/g;
  let stepMatch: RegExpExecArray | null;
  const stepPositions: { num: string; iter: string; tool: string; index: number }[] = [];

  while ((stepMatch = stepRegex.exec(debugText)) !== null) {
    stepPositions.push({
      num: stepMatch[1],
      iter: stepMatch[2],
      tool: stepMatch[3],
      index: stepMatch.index
    });
  }

  for (let i = 0; i < stepPositions.length; i++) {
    const start = stepPositions[i].index;
    const end = i + 1 < stepPositions.length ? stepPositions[i + 1].index : debugText.length;
    const block = debugText.substring(start, end);

    const successMatch = block.match(/Success:\s*([✓✗]|true|false)/i);
    const timeMatch = block.match(/Time:\s*([\d,]+)\s*ms/i);
    const rowsMatch = block.match(/Rows:\s*(\d+)/i);

    let success: boolean | undefined;
    if (successMatch) {
      const val = successMatch[1].toLowerCase();
      success = val === '✓' || val === 'true';
    }

    steps.push({
      attemptNumber: parseInt(stepPositions[i].iter, 10),
      toolUsed: stepPositions[i].tool,
      success,
      executionTimeMs: timeMatch ? parseInt(timeMatch[1].replace(/,/g, ''), 10) : undefined,
      rowCount: rowsMatch ? parseInt(rowsMatch[1], 10) : undefined
    });
  }

  return steps;
}

function buildMarkdownTable(jsonData: any, recordCount: number | null): string {
  let columns: string[] = [];
  let rows: Record<string, any>[] = [];

  if (jsonData.columns && Array.isArray(jsonData.columns) && Array.isArray(jsonData.rows)) {
    columns = jsonData.columns;
    rows = jsonData.rows;
  } else if (Array.isArray(jsonData) && jsonData.length > 0) {
    columns = Object.keys(jsonData[0]);
    rows = jsonData;
  } else if (jsonData.data && Array.isArray(jsonData.data) && jsonData.data.length > 0) {
    columns = jsonData.columns || Object.keys(jsonData.data[0]);
    rows = jsonData.data;
  } else {
    return '```json\n' + JSON.stringify(jsonData, null, 2) + '\n```';
  }

  if (columns.length === 0 || rows.length === 0) {
    return `**${recordCount ?? 0} records found** *(no data rows)*`;
  }

  const count = recordCount ?? jsonData.rowCount ?? rows.length;
  const header = '| ' + columns.join(' | ') + ' |';
  const separator = '| ' + columns.map(() => '---').join(' | ') + ' |';

  const maxDisplay = 50;
  const displayRows = rows.slice(0, maxDisplay);
  const dataLines = displayRows.map(row =>
    '| ' + columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return '';
      if (typeof val === 'number') return val.toLocaleString('en-US');
      return String(val);
    }).join(' | ') + ' |'
  );

  const parts = [`**${count} records found**`, '', header, separator, ...dataLines];

  if (rows.length > maxDisplay) {
    parts.push('', `*... and ${rows.length - maxDisplay} more rows.*`);
  }

  return parts.join('\n');
}

function buildFallbackContent(resultSection: string, recordCount: number | null): string {
  let content = resultSection.replace(/^Data:\s*/m, '').trim();
  if (recordCount !== null) {
    content = `**${recordCount} records found**\n\n${content}`;
  }
  return content;
}

function stripTechnicalSections(text: string): string {
  let cleaned = text.replace(/## Technical Details[\s\S]*?(?=\n## |\s*$)/gi, '');
  cleaned = cleaned.replace(/## Debug Information[\s\S]*?(?=\n## |\s*$)/gi, '');
  return cleaned.trim();
}
