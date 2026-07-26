# APIPoints Marketing Calendar

## Pre-Launch (Now → Tuesday Jul 29)

### Today (Sat Jul 26)
- [ ] Create GitHub repo: `gh repo create Loadcircle/apioints --public`
- [ ] Push all code to GitHub
- [ ] `npm login` and publish MCP server: `cd mcp-server && npm publish --access public`
- [ ] Update MCP server README with GitHub link

### Sunday Jul 27
- [ ] Post Show HN draft to HN (schedule for Monday morning 9-10am ET for max visibility)
- [ ] Prepare Product Hunt assets:
  - Tagline: "Real-time LLM pricing, benchmarks & cost optimization for AI agents"
  - Description (260 chars max)
  - First comment (founder story)
  - 5 bullet points
  - Topics: Developer Tools, Artificial Intelligence, API

### Monday Jul 28
- [ ] Final PH asset prep
- [ ] Schedule social media posts for Tuesday
- [ ] Brief friends/colleagues to upvote on launch day

### Tuesday Jul 29 — PRODUCT HUNT LAUNCH DAY
- [ ] Submit PH listing early (midnight PT / 8am BST)
- [ ] Post first comment immediately with founder story
- [ ] Share on Twitter/X with PH link
- [ ] Post to Hacker News (Show HN)
- [ ] Post to Dev.to (blog post goes live)
- [ ] Post to Hashnode (cross-post)
- [ ] Share in relevant Discord/Slack communities
- [ ] Monitor and respond to all comments within 1 hour
- [ ] Post Reddit r/LocalLLaMA (afternoon)
- [ ] Post Reddit r/MachineLearning (afternoon)
- [ ] Post Reddit r/SaaS (evening)

### Wednesday Jul 30
- [ ] Follow up on all PH comments
- [ ] Post Reddit r/ChatGPT (if relevant)
- [ ] Share on LinkedIn
- [ ] Email any press contacts

### Thursday Jul 31
- [ ] Post Reddit r/artificial (if not already done)
- [ ] Write follow-up Twitter thread with launch results
- [ ] Update landing page with "Featured on Product Hunt" badge

### Friday Aug 1
- [ ] Analyze first week metrics (D1 query for new signups)
- [ ] Send thank-you to all supporters
- [ ] Plan next week's content

## Week 1 Post-Launch (Aug 2-8)

- [ ] Write "Launch Results" blog post (traffic, signups, feedback)
- [ ] Publish to LinkedIn
- [ ] Follow up with anyone who commented but didn't sign up
- [ ] Start SEO content: "GPT-4o vs Claude Sonnet cost comparison"
- [ ] Add "Featured on Product Hunt" badge to site

## Week 2-4

- [ ] Cold outreach to AI startups (10/day)
- [ ] Guest post on AI newsletters
- [ ] Submit to Awesome Lists (awesome-mcp-servers, awesome-llm)
- [ ] Build relationships with AI community influencers
- [ ] Consider paid promotion on AI-focused newsletters ($200-500)

## Key Metrics to Track
- D1: `SELECT DATE(created_at) as day, COUNT(*) as signups FROM users GROUP BY day ORDER BY day DESC`
- API usage: `SELECT DATE(created_at) as day, COUNT(*) as calls FROM api_usage GROUP BY day ORDER BY day DESC`
- Revenue: Stripe dashboard

## Channels Summary
| Channel | Timing | Expected Impact |
|---------|--------|----------------|
| Product Hunt | Tue Jul 29 | High (50-200 signups day 1) |
| Hacker News | Tue Jul 29 | High (if it hits front page) |
| Dev.to / Hashnode | Tue Jul 29 | Medium (SEO, long-tail) |
| r/LocalLLaMA | Tue Jul 29 | Medium (target audience) |
| r/MachineLearning | Tue Jul 29 | Medium (technical audience) |
| r/SaaS | Tue Jul 29 | Low-Medium (founder community) |
| Twitter/X | Tue Jul 29 | Medium (viral potential) |
| LinkedIn | Wed Jul 30 | Low-Medium (professional) |
| Cold outreach | Week 2+ | Medium (direct conversion) |
