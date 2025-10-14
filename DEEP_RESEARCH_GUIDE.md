# Deep Agentic Research Guide

Your AI chatbot now supports **deep agentic research** - it can autonomously conduct multi-step research by making multiple tool calls, gathering information from different angles, and synthesizing comprehensive answers.

## What's Been Enhanced

### 1. **Increased Step Limit**

- Changed from 5 steps to **20 steps**
- Allows the agent to make multiple searches and tool calls
- Enough for thorough research on complex topics

### 2. **Research-Focused Prompts**

The agent now understands it should:

- Make MULTIPLE search calls for different aspects
- Follow up on interesting findings
- Cross-reference information
- Search for examples, case studies, and real-world data
- Gather both recent and foundational information

### 3. **Automatic Research Process**

The agent follows this flow:

1. **Broad Search** - Understand the topic overview
2. **Identify Subtopics** - Find key areas to explore
3. **Targeted Searches** - Deep dive into each area
4. **Comparisons** - Look for pros/cons, alternatives
5. **Recent Developments** - Find latest news/updates
6. **Synthesis** - Combine all findings into a comprehensive answer

## How to Use Deep Research

### Trigger Words

Use these phrases to activate deep research mode:

- "Research..."
- "Investigate..."
- "Deep dive into..."
- "Explore comprehensively..."
- "Tell me everything about..."
- "Do a thorough analysis of..."

### Example Queries

#### Simple Query (1-2 searches):

```
"What's the latest AI news?"
```

→ Agent makes 1 search and summarizes

#### Deep Research (5-10 searches):

```
"Research the benefits and drawbacks of TypeScript"
```

→ Agent makes multiple searches:

- "TypeScript benefits"
- "TypeScript drawbacks"
- "TypeScript vs JavaScript"
- "TypeScript adoption trends"
- "TypeScript real-world examples"

#### Comprehensive Investigation (10-20 searches):

```
"Do a deep dive into React Server Components - how they work, benefits, drawbacks, and best practices"
```

→ Agent makes extensive searches:

- "React Server Components overview"
- "React Server Components how they work"
- "React Server Components benefits"
- "React Server Components limitations"
- "React Server Components vs Client Components"
- "React Server Components best practices"
- "React Server Components examples"
- "React Server Components performance"
- "React Server Components adoption"
- "React Server Components tutorials"

## Example Research Queries to Try

### Technology Research

```
"Research Next.js 14 App Router - architecture, benefits, and migration guide"
"Investigate Bun vs Node.js - performance, compatibility, and real-world usage"
"Deep dive into Rust programming language - use cases, learning curve, and ecosystem"
```

### Market Research

```
"Research the state of AI coding assistants in 2024"
"Investigate remote work trends and future predictions"
"Explore the blockchain industry - current state and future outlook"
```

### Comparison Research

```
"Compare React, Vue, and Svelte - performance, ecosystem, and developer experience"
"Research cloud providers: AWS vs Azure vs Google Cloud"
"Investigate SQL vs NoSQL databases for modern applications"
```

### Learning Research

```
"Research how to learn machine learning as a beginner"
"Investigate the best practices for API design"
"Deep dive into microservices architecture patterns"
```

## What You'll See in the UI

When the agent conducts deep research, you'll see:

1. **Multiple Tool Call Cards** - Each search appears as an expandable card
2. **Progressive Discovery** - Watch as the agent finds information step by step
3. **Search Results** - Clickable links to sources for each search
4. **Synthesis** - Final comprehensive answer combining all findings

### Example UI Flow:

```
🔧 Tool: webSearch
   Query: "TypeScript benefits"
   ✅ Results: 5 sources

🔧 Tool: webSearch
   Query: "TypeScript drawbacks"
   ✅ Results: 5 sources

🔧 Tool: webSearch
   Query: "TypeScript vs JavaScript comparison"
   ✅ Results: 5 sources

🔧 Tool: webSearch
   Query: "TypeScript adoption 2024"
   ✅ Results: 5 sources

📝 Agent Response:
   [Comprehensive synthesis of all findings...]
```

## Advanced Tips

### 1. Be Specific About What You Want

```
❌ "Tell me about React"
✅ "Research React hooks - how they work, common patterns, and best practices"
```

### 2. Ask for Comparisons

```
"Compare X vs Y - features, performance, pricing, and use cases"
```

### 3. Request Multiple Perspectives

```
"Research the pros and cons of remote work from both employer and employee perspectives"
```

### 4. Ask for Evidence

```
"Research electric vehicles - include market data, adoption trends, and case studies"
```

### 5. Combine Multiple Tools

```
"Research cloud computing costs and calculate monthly estimates for a startup"
```

→ Agent will use both webSearch AND calculator tools

## Configuration

### Adjust Step Limit (if needed)

In `app/(chat)/api/chat/route.ts`:

```typescript
stopWhen: stepCountIs(20), // Change this number
```

- **10 steps** - Light research (3-5 searches)
- **20 steps** - Deep research (5-10 searches)
- **30 steps** - Comprehensive research (10-20 searches)
- **Note:** Higher limits = longer response times

### Customize Research Behavior

Edit `lib/ai/prompts.ts` to change how the agent conducts research:

- Add more specific instructions
- Define research frameworks
- Add domain-specific guidelines

## Limitations

1. **API Rate Limits** - Brave Search API has rate limits
2. **Response Time** - More searches = longer wait times
3. **Cost** - More API calls = higher costs (LLM + search)
4. **Quality** - Depends on search result quality

## Best Practices

### ✅ Do:

- Use specific, focused research queries
- Ask for comparisons and multiple perspectives
- Request evidence and examples
- Combine multiple tools for comprehensive analysis

### ❌ Don't:

- Make overly broad requests without focus
- Expect instant results (research takes time)
- Ask for extremely niche topics (limited search results)

## Monitoring Research

Watch the tool calls in real-time to see:

- What the agent is searching for
- How it's breaking down the problem
- What sources it's finding
- How it's building knowledge progressively

## Examples of Agent Reasoning

### Query: "Research TypeScript benefits"

**Agent's Plan (automatic):**

1. Search: "TypeScript benefits overview"
2. Search: "TypeScript static typing advantages"
3. Search: "TypeScript IDE support"
4. Search: "TypeScript code quality improvements"
5. Search: "TypeScript team productivity"
6. Synthesize findings into comprehensive answer

### Query: "Compare React and Vue"

**Agent's Plan (automatic):**

1. Search: "React vs Vue comparison 2024"
2. Search: "React performance benchmarks"
3. Search: "Vue performance benchmarks"
4. Search: "React ecosystem and libraries"
5. Search: "Vue ecosystem and libraries"
6. Search: "React developer experience"
7. Search: "Vue developer experience"
8. Synthesize comparative analysis

## Troubleshooting

### Agent Only Makes One Search

**Solution:** Use trigger words like "research", "investigate", "deep dive"

### Agent Stops Early

**Solution:** Increase step limit in route configuration

### Search Results Are Poor

**Solution:** Try more specific search queries in your prompt

### Too Slow

**Solution:** Reduce step limit or ask more focused questions

## Future Enhancements

Potential improvements:

- Add more search engines (Google, Bing, etc.)
- Implement result caching
- Add citation tracking
- Create research summaries with sources
- Enable PDF/document analysis
- Add image search capabilities

## Get Started!

Try this research query right now:

```
"Research the latest developments in AI agents - what they can do, popular frameworks, and real-world applications"
```

Watch as your agent autonomously conducts multi-step research and provides a comprehensive, well-sourced answer!
