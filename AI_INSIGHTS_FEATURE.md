# AI-Powered Dashboard Insights

## Overview
The AI Insights feature provides personalized, role-based analysis of each user's dashboard, offering actionable recommendations based on their projects, tasks, and responsibilities.

## How It Works

### 1. Dashboard Analysis
The system analyzes:
- **All user's projects** (based on role permissions)
- **All user's tasks** (based on role permissions)
- **Task status distribution** (TODO, IN_PROGRESS, DONE, BLOCKED)
- **Completion rates and trends**
- **Project assignments and deadlines**

### 2. Role-Based Context
Insights are tailored to each role:

#### **MANAGER**
- **Focus**: Organization-wide overview, team performance, resource allocation
- **Data Analyzed**: All projects in organization, all tasks across teams
- **Insights Include**:
  - Overall organizational progress
  - Team workload distribution
  - Blocked items requiring management intervention
  - Strategic resource allocation recommendations

#### **TEAM_LEAD**
- **Focus**: Team coordination, task assignment, bottleneck identification
- **Data Analyzed**: Assigned projects, team member tasks, created tasks
- **Insights Include**:
  - Team task completion rates
  - Individual team member workload
  - Tasks requiring follow-up
  - Efficiency improvement suggestions

#### **TEAM_MEMBER**
- **Focus**: Personal productivity, deadline management, task organization
- **Data Analyzed**: Assigned tasks, sub-tasks, project involvement
- **Insights Include**:
  - Personal task progress
  - Upcoming deadlines
  - Sub-task utilization effectiveness
  - Time management tips

#### **INDIVIDUAL**
- **Focus**: Personal project management, self-organization
- **Data Analyzed**: Owned projects, personal tasks
- **Insights Include**:
  - Personal productivity metrics
  - Task prioritization suggestions
  - Project completion trajectory
  - Self-management best practices

### 3. AI Generation
The system uses **GROQ API with Llama 3.1 70B** to generate insights:
- Analyzes dashboard statistics
- Reviews recent projects and tasks
- Identifies patterns and trends
- Generates structured, actionable recommendations

### 4. Insight Structure
Every insight includes 4 sections:

```
📊 Dashboard Overview:
• High-level status summary
• Completion rate analysis
• Current workload assessment

✅ What's Going Well:
• Positive achievements
• Successful patterns
• Strong performance areas

⚠️ Areas Needing Attention:
• Blockers and issues
• Delayed tasks
• Resource constraints

🎯 Recommendations:
• Actionable next steps
• Role-specific suggestions
• Strategic improvements
```

## API Endpoint

### GET `/api/dashboard-insights`

**Authentication**: Required (JWT token)

**Response**:
```json
{
  "insights": "📊 Dashboard Overview:\n• You have 3 active projects...",
  "stats": {
    "totalProjects": 3,
    "totalTasks": 15,
    "completedTasks": 8,
    "inProgressTasks": 5,
    "blockedTasks": 1,
    "todoTasks": 1
  }
}
```

**Role-Based Filtering**:
- Data is automatically filtered based on user's role
- Only shows projects/tasks user has access to
- Respects all role-based access control rules

## UI Component

### DashboardInsights Component

**Location**: `/app/components/DashboardInsights.tsx`

**Features**:
- Auto-generates insights on dashboard load
- Refresh button for on-demand updates
- Loading states with animation
- Error handling with retry option
- Formatted display with sections and bullet points
- Responsive design

**Props**:
```typescript
interface Props {
  currentUser: any; // Current logged-in user object
}
```

## Example Insights

### For Manager
```
📊 Dashboard Overview:
• You have 5 active projects with 42 total tasks across your organization
• Current completion rate: 67% (28/42 tasks done)
• 8 tasks are currently in progress across 3 team leads

✅ What's Going Well:
• High completion rate indicates strong team performance
• No blocked tasks - workflow is running smoothly
• 3 projects are ahead of schedule

⚠️ Areas Needing Attention:
• 6 tasks are still in TODO status and not yet assigned
• Team Lead TL-002 has 15 tasks while TL-001 has only 5 - consider rebalancing

🎯 Recommendations:
• Review blocked tasks and allocate resources to unblock them
• Monitor team progress and provide support where needed
• Consider workload distribution across team leads
• Schedule check-ins with team leads managing high-priority projects
```

### For Team Lead
```
📊 Dashboard Overview:
• You have 2 assigned projects with 12 total tasks for your team
• Current completion rate: 58% (7/12 tasks done)
• 4 tasks are currently in progress by team members

✅ What's Going Well:
• 7 tasks successfully completed by your team
• Team members are actively working on assigned tasks
• No overdue tasks in your queue

⚠️ Areas Needing Attention:
• 1 task has been blocked for 3 days - requires your attention
• TM-003 has 6 tasks while TM-001 has only 2 - workload imbalance

🎯 Recommendations:
• Check in with team members on in-progress tasks
• Address the blocked task with TM-002 to unblock progress
• Redistribute tasks more evenly among team members
• Set up daily standup to track task progress
```

### For Team Member
```
📊 Dashboard Overview:
• You have 8 assigned tasks across 2 projects
• Current completion rate: 50% (4/8 tasks done)
• 3 tasks are currently in progress

✅ What's Going Well:
• 4 tasks successfully completed this week
• You're using sub-tasks effectively to break down complex work
• Good progress on "Feature Implementation" task

⚠️ Areas Needing Attention:
• 1 task is approaching deadline in 2 days
• "Bug Fix" task has been in progress for 5 days

🎯 Recommendations:
• Break down complex tasks into sub-tasks for better tracking
• Focus on completing the deadline-approaching task first
• Update task status regularly to keep team informed
• Consider marking "Bug Fix" as blocked if you need help
```

### For Individual
```
📊 Dashboard Overview:
• You have 3 personal projects with 10 total tasks
• Current completion rate: 60% (6/10 tasks done)
• 2 tasks are currently in progress

✅ What's Going Well:
• 6 tasks successfully completed
• All systems running smoothly
• Consistent progress on "Personal Website" project

⚠️ Areas Needing Attention:
• 2 tasks are waiting to be started
• "Mobile App" project has no recent activity

🎯 Recommendations:
• Prioritize tasks based on deadlines and importance
• Start working on TODO tasks to maintain momentum
• Review completed tasks for lessons learned
• Set daily goals to keep projects moving forward
```

## Fallback Mechanism

If the AI API is unavailable or fails, the system generates basic insights using template-based logic:
- Calculates completion percentages
- Identifies basic statistics
- Provides role-appropriate generic recommendations
- Ensures users always get some insights

## Performance Considerations

### Caching
- Insights are generated on-demand (not cached)
- Each refresh triggers new analysis for latest data
- Response time: 2-5 seconds depending on data volume

### Rate Limiting
- No built-in rate limiting currently
- Consider adding if API costs become significant
- Refresh button prevents accidental spam

### Data Volume
- API processes up to 5 projects and 10 tasks in detail
- Larger datasets are summarized statistically
- Prevents prompt from becoming too large

## Environment Setup

Required environment variable:
```bash
GROQ_API_KEY=your_groq_api_key_here
```

Get your API key from: https://console.groq.com/

## Error Handling

### API Errors
- Network errors: Shows retry button
- Authentication errors: Redirects to login
- AI generation errors: Falls back to template insights
- Invalid response: Falls back to template insights

### User Feedback
- Loading state: "🤖 Analyzing your dashboard..."
- Error state: Red banner with retry option
- Success state: Formatted insights display
- Empty state: Prompt to refresh

## Testing

### Test Cases

1. **Manager with Active Organization**
   - Should show all org projects and tasks
   - Should provide strategic recommendations
   - Should mention team leads by name

2. **Team Lead with Assigned Projects**
   - Should show assigned projects only
   - Should analyze team member workload
   - Should identify blockers

3. **Team Member with Tasks**
   - Should show only their assigned tasks
   - Should encourage sub-task usage
   - Should remind about deadlines

4. **Individual User**
   - Should show personal projects only
   - Should provide self-management tips
   - Should encourage task prioritization

5. **Empty Dashboard**
   - Should handle zero projects/tasks gracefully
   - Should encourage getting started
   - Should not error out

6. **API Failure**
   - Should show fallback insights
   - Should provide retry option
   - Should not break dashboard

## Future Enhancements

1. **Insight History**
   - Store historical insights
   - Show trend over time
   - Compare week-over-week progress

2. **Custom Refresh Intervals**
   - Auto-refresh every N hours
   - Notification on significant changes
   - Background refresh without user action

3. **Insight Categories**
   - Filter by category (progress, risks, recommendations)
   - Toggle sections on/off
   - Export insights as PDF

4. **Team Comparison**
   - For managers: Compare team lead performance
   - For team leads: Compare team member productivity
   - Benchmark against averages

5. **Predictive Analytics**
   - Predict project completion dates
   - Identify tasks at risk of delay
   - Suggest optimal task assignments

6. **Natural Language Queries**
   - Ask specific questions about dashboard
   - "Which team member needs help?"
   - "What's blocking Project X?"

## Troubleshooting

### Insights Not Loading
1. Check GROQ_API_KEY is set in environment
2. Verify user is authenticated
3. Check browser console for errors
4. Try the refresh button

### Generic Insights Appearing
- AI API may be down (fallback active)
- API key may be invalid
- Network issues preventing AI call
- Check server logs for details

### Insights Not Relevant
- Data may be out of date (refresh page)
- Role permissions may have changed (re-login)
- Projects/tasks may need status updates

## Integration Points

The AI Insights feature integrates with:
- **Authentication System**: Uses JWT for user identification
- **Role-Based Access Control**: Respects all permission rules
- **Projects API**: Fetches project data
- **Tasks API**: Fetches task data
- **Dashboard Page**: Displays insights prominently

## Security

- Insights are user-specific (no cross-user data leakage)
- API key is server-side only (never exposed to client)
- Data is filtered by role before AI analysis
- No sensitive information logged or cached
- Respects all existing access control rules
