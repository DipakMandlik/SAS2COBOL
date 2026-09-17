#!/usr/bin/env node
/**
 * SAS2COBOL — Live Orchestration Hook for Claude Code
 * Intercepts PreToolUse and PostToolUse lifecycle events,
 * capturing real agent dispatches, skill launches, tool executions,
 * classifier blocks, and errors into the active run event stream.
 */

const fs = require('fs');
const path = require('path');
const eventBus = require('./event-bus');

function parseArgs() {
  const args = process.argv.slice(2);
  let phase = 'pre';
  let customType = null;
  let customMsg = null;
  let customActor = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phase' && args[i + 1]) {
      phase = args[i + 1].toLowerCase();
      i++;
    } else if (args[i] === '--type' && args[i + 1]) {
      customType = args[i + 1];
      i++;
    } else if (args[i] === '--msg' && args[i + 1]) {
      customMsg = args[i + 1];
      i++;
    } else if (args[i] === '--actor' && args[i + 1]) {
      customActor = args[i + 1];
      i++;
    }
  }
  return { phase, customType, customMsg, customActor };
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');

    const timeout = setTimeout(() => {
      resolve(data.trim());
    }, 150);

    process.stdin.on('data', (chunk) => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      clearTimeout(timeout);
      resolve(data.trim());
    });
  });
}

function dispatchLiveEvent(event) {
  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    const timer = setTimeout(() => {
      try {
        eventBus.emitEvent(event);
      } catch (e) {}
      safeResolve();
    }, 250);

    try {
      const http = require('http');
      const data = JSON.stringify(event);
      const req = http.request({
        hostname: '127.0.0.1',
        port: 3210,
        path: '/api/event',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 200,
      }, (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          clearTimeout(timer);
          safeResolve();
        });
      });

      req.on('error', () => {
        clearTimeout(timer);
        try {
          eventBus.emitEvent(event);
        } catch (e) {}
        safeResolve();
      });

      req.write(data);
      req.end();
    } catch (e) {
      clearTimeout(timer);
      try {
        eventBus.emitEvent(event);
      } catch (err) {}
      safeResolve();
    }
  });
}

async function main() {
  const { phase, customType, customMsg, customActor } = parseArgs();

  if (customType && customMsg) {
    await dispatchLiveEvent({
      type: customType,
      actor: customActor || 'Claude Orchestrator',
      message: customMsg,
    });
    process.exit(0);
  }

  const rawInput = await readStdin();
  if (!rawInput) {
    process.exit(0);
  }

  let payload = null;
  try {
    payload = JSON.parse(rawInput);
  } catch (e) {
    process.exit(0);
  }

  const tool = payload.tool || payload.name || '';
  const input = payload.input || payload.arguments || {};
  const result = payload.result || payload.output || null;

  if (phase === 'pre') {
    await handlePreTool(tool, input);
  } else {
    await handlePostTool(tool, input, result);
  }

  process.exit(0);
}

async function handlePreTool(tool, input) {
  if (tool === 'Agent') {
    const subagent = input.subagent_type || 'claude';
    await dispatchLiveEvent({
      type: 'agent.started',
      actor: subagent,
      agent: subagent,
      message: `Dispatched agent: ${subagent}`,
      metadata: {
        description: input.description,
        prompt: input.prompt ? input.prompt.slice(0, 150) : '',
      },
    });
  } else if (tool === 'Skill') {
    const skillName = input.skill.startsWith('/') ? input.skill : `/${input.skill}`;
    await dispatchLiveEvent({
      type: 'skill.invoked',
      actor: 'Claude Orchestrator',
      skill: skillName,
      message: `Invoked ${skillName}${input.args ? ` (args: ${input.args})` : ''}`,
      metadata: { skill: skillName, args: input.args },
    });
  } else if (tool === 'Bash') {
    const cmd = input.command || '';
    if (cmd.includes('gate-validator.js')) {
      const match = cmd.match(/--phase\s+(\w+)/i);
      const targetPhase = match ? match[1] : 'all';
      await dispatchLiveEvent({
        type: 'gate.started',
        actor: 'Gate Validator',
        message: `Executing Phase ${targetPhase} quality gate validation...`,
        metadata: { phase: targetPhase, command: cmd },
      });
    } else {
      await dispatchLiveEvent({
        type: 'tool.started',
        actor: 'Tool',
        message: input.description || `Bash: ${cmd.slice(0, 80)}`,
        metadata: { tool: 'Bash', command: cmd },
      });
    }
  } else if (tool === 'Read') {
    const rel = path.relative(process.cwd(), input.file_path || '');
    await dispatchLiveEvent({
      type: 'tool.started',
      actor: 'File System',
      message: `Reading ${rel}`,
      metadata: { tool: 'Read', file: rel },
    });
  } else if (tool === 'Write' || tool === 'Edit') {
    const rel = path.relative(process.cwd(), input.file_path || '');
    await dispatchLiveEvent({
      type: 'tool.started',
      actor: 'File System',
      message: `${tool} ${rel}`,
      metadata: { tool, file: rel },
    });
  }
}

async function handlePostTool(tool, input, result) {
  const resultStr = typeof result === 'string' ? result : JSON.stringify(result || '');

  if (tool === 'Agent') {
    const subagent = input.subagent_type || 'claude';
    if (resultStr.includes('temporarily unavailable') || resultStr.includes('cannot determine the safety of Agent')) {
      await dispatchLiveEvent({
        type: 'agent.blocked',
        actor: subagent,
        agent: subagent,
        message: `Agent ${subagent} was blocked by Claude Code safety classifier`,
        metadata: {
          error: 'Classifier unavailable in auto-mode',
          rawResult: resultStr.slice(0, 200),
        },
      });
    } else if (resultStr.includes('Agent terminated early due to an API error') || resultStr.includes('RESOURCE_EXHAUSTED') || resultStr.includes('Individual quota reached')) {
      await dispatchLiveEvent({
        type: 'activity',
        actor: 'Claude Orchestrator',
        agent: subagent,
        message: `Direct orchestration fallback engaged for ${subagent}`,
        metadata: { detail: 'Continuing via hardened in-process generator' },
      });
    } else {
      await dispatchLiveEvent({
        type: 'agent.completed',
        actor: subagent,
        agent: subagent,
        message: `Agent ${subagent} completed assigned objectives`,
      });
    }
  } else if (tool === 'Skill') {
    const skillName = input.skill.startsWith('/') ? input.skill : `/${input.skill}`;
    await dispatchLiveEvent({
      type: 'skill.completed',
      actor: 'Claude Orchestrator',
      skill: skillName,
      message: `Skill ${skillName} instructions integrated into execution context`,
    });
  } else if (tool === 'Bash') {
    const cmd = input.command || '';
    if (cmd.includes('gate-validator.js')) {
      const isPass = resultStr.includes('GATE STATUS: PASSED');
      const checksMatch = resultStr.match(/(\d+)\s+checks succeeded/i);
      const checksPassed = checksMatch ? parseInt(checksMatch[1], 10) : 0;
      const match = cmd.match(/--phase\s+(\w+)/i);
      const phaseNum = match && !isNaN(parseInt(match[1], 10)) ? parseInt(match[1], 10) : 1;

      await dispatchLiveEvent({
        type: isPass ? 'gate.passed' : 'gate.failed',
        actor: 'Gate Validator',
        message: isPass
          ? `Phase ${phaseNum} PASSED (${checksPassed} checks)`
          : `Phase ${phaseNum} FAILED`,
        metadata: {
          phase: phaseNum,
          checksPassed,
          passed: isPass,
        },
      });
    }
  }
}

main().catch(() => process.exit(0));
