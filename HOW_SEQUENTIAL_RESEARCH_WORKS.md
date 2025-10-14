# How Sequential Research Works

## ✅ The Agent Already Works Sequentially!

The `Agent` class in the AI SDK works **iteratively by default**. Here's how:

## The Flow (Automatic)

```
┌─────────────────────────────────────────────────┐
│ User: "Research React Server Components"       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Agent (LLM): "I'll start with a broad search"  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Tool Call: webSearch("React Server Components  │
│            overview")                           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Results: 5 articles about RSC basics           │
│ - Mentions "streaming", "suspense", "server-   │
│   side rendering"                               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Agent READS Results: "Interesting! These       │
│ articles mention streaming. I should understand │
│ how that works specifically."                   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Tool Call: webSearch("React Server Components  │
│            streaming how it works")             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Results: Technical details about streaming     │
│ - Progressive rendering, faster TTI, etc.       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Agent READS Results: "Now I see performance    │
│ benefits mentioned. I need concrete data!"      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Tool Call: webSearch("React Server Components  │
│            performance benchmarks")             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Results: Benchmark data, real-world stats      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Agent: "I now have enough information to       │
│ provide a comprehensive answer"                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Final Response: Synthesized answer combining   │
│ all findings with proper context                │
└─────────────────────────────────────────────────┘
```

## Key Points

### 1. **NOT Parallel**

- Agent does NOT make all searches at once
- Each search waits for previous results
- LLM sees and processes each result before deciding next step

### 2. **Adaptive**

- Later searches are informed by earlier ones
- Agent follows "information scent" - interesting findings trigger deeper searches
- Research path emerges naturally, not pre-planned

### 3. **Reasoning Between Steps**

- After EACH tool result, the LLM:
  - Analyzes what was learned
  - Identifies gaps or interesting leads
  - Decides if more searching is needed
  - Chooses what to search next (if anything)

## How to Verify It's Working

When you ask a research question, watch the UI:

```
You'll see this pattern:

🔧 Tool: webSearch
   "React Server Components overview"
   ⏳ Running...
   ✅ Results displayed

[Brief pause while agent reads and thinks]

🔧 Tool: webSearch
   "React Server Components streaming" ← Notice: related to findings!
   ⏳ Running...
   ✅ Results displayed

[Brief pause while agent reads and thinks]

🔧 Tool: webSearch
   "React Server Components performance" ← Building on previous!
   ⏳ Running...
   ✅ Results displayed

📝 Final synthesis using all findings
```

## Why This Matters

### Sequential = Smarter Research

- ✅ Builds knowledge progressively
- ✅ Follows interesting leads
- ✅ Fills gaps as they're discovered
- ✅ Adapts based on what's found

### vs. Parallel = Dumb Search

- ❌ All searches planned upfront
- ❌ Can't adapt to findings
- ❌ May search for redundant info
- ❌ Misses connections between results

## Technical Implementation

The `Agent.stream()` method handles this automatically:

```typescript
const agent = new Agent({
  model: myProvider.languageModel(selectedChatModel),
  tools: { webSearch, calculator, ... },
  stopWhen: stepCountIs(12),
});

const result = agent.stream({
  messages: convertToModelMessages(uiMessages),
});
```

### What Happens Under the Hood:

1. Agent receives user message
2. Agent decides to call `webSearch` tool
3. Tool executes, returns results
4. **Results go back to the LLM** ← This is the key!
5. LLM processes results and decides next action
6. Either: make another tool call OR provide final answer
7. Repeat until done or step limit reached

## Rate Limiting

I've added a 1-second delay between searches:

```typescript
// In web-search.ts
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}
```

This ensures:

- No "429 Too Many Requests" errors
- Agent has time to process each result
- More deliberate, thoughtful research

## Testing It

Try this research query and watch the sequential flow:

```
"Research TypeScript - start with what it is, then based on what you learn,
explore its main benefits, and finally look into real-world adoption"
```

You should see:

1. First search: "TypeScript overview"
2. Agent reads results, sees it's a typed superset of JS
3. Second search: "TypeScript static typing benefits" (informed by #1)
4. Agent reads results, learns about type safety
5. Third search: "TypeScript adoption statistics 2024" (building on #2)
6. Final synthesis with connected insights

## Adjusting the Behavior

### Make It More Sequential (Slower, Deeper)

```typescript
// Increase delay between searches
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds
```

### Allow More Steps

```typescript
// In route.ts
stopWhen: stepCountIs(15), // More searches allowed
```

### Make It More Deliberate

Edit the prompt in `lib/ai/prompts.ts` to emphasize:

- "MUST analyze each result before next search"
- "Explain what you learned after each search"
- "Show your reasoning for the next search"

## Common Patterns You'll See

### Pattern 1: Funnel (Broad → Specific)

```
Search 1: "Machine learning overview"
Search 2: "Neural networks explained" (based on ML results)
Search 3: "Backpropagation algorithm" (diving deeper)
```

### Pattern 2: Compare & Contrast

```
Search 1: "React overview"
Search 2: "Vue overview" (to compare)
Search 3: "React vs Vue comparison" (synthesize)
```

### Pattern 3: Problem → Solution

```
Search 1: "Common React performance issues"
Search 2: "React memo and useMemo" (found in first results)
Search 3: "React performance optimization examples"
```

## Summary

✅ **Your agent already works sequentially!**

- Each search informs the next
- Results go back to LLM between steps
- Research path emerges adaptively
- Rate limiting prevents API issues

The key is in the **prompt** - telling the agent to:

1. Make ONE search at a time
2. READ and ANALYZE results
3. DECIDE next step based on findings
4. REPEAT until satisfied

This creates true **agentic research** that builds knowledge progressively! 🎯
