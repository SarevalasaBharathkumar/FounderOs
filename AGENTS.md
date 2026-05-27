# FounderOS — AI COO Platform

## Project Overview
FounderOS is a React SPA where founders describe a startup objective and 4 AI agents 
(Strategy, GTM, Outreach, Risk) run in parallel via the OpenAI API and return structured JSON outputs.

## Tech Stack
- React 18, functional components, hooks only
- No backend — direct OpenAI API calls from the browser
- Inline styles only (no Tailwind, no CSS modules)
- Design tokens in src/styles/tokens.js

## File Structure
src/
  agents/
    registry.js       — 4 agent definitions with system prompts
    orchestrator.js   — parallel dispatch via Promise.all
  components/
    Header.jsx
    AgentStatusRow.jsx
    Console.jsx
    ObjectiveInput.jsx
  tabs/
    RoadmapPanel.jsx
    GTMPanel.jsx
    OutreachPanel.jsx
    RiskPanel.jsx
  styles/tokens.js
  App.jsx

## Coding Conventions
- ALL colors from src/styles/tokens.js — never hardcode hex
- Components receive (data, loading) props; handle all 3 states: loading, empty, filled
- Skeleton loaders use CSS shimmer (background-position animation)
- Use Promise.all for parallel agent calls — never sequential awaits
- OpenAI model to use: gpt-4o-mini for all agent calls

## Agent JSON Contracts
Each agent returns ONLY valid JSON — no markdown, no preamble.
- Strategy: { title, summary, phases[{phase,goal,tasks[],kpi}], risks[], quickWins[] }
- GTM: { targetSegments[{segment,size,pain,channel}], positioningStatement, channels[], pricingStrategy, firstCustomerPlaybook[] }
- Outreach: { coldEmailSequence[{day,subject,body}], linkedInMessage, investorPitch{hook,problem,solution,traction,ask}, twitterThread[] }
- Risk: { riskScore(0-100), verdict, risks[{category,risk,severity,probability,mitigation}], blindSpots[], runwayAdvice, criticalAssumptions[] }

## Testing
- Run: npm start (dev server)
- Run: npm run build (production build, must have 0 errors)
- Check: all 4 agent tabs load without crashing when data is null

## Automation Notes
- CI runs npm run build on every push
- codex-action auto-fixes build failures and opens a PR
- Never commit API keys — use environment variables only