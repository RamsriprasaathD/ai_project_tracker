# Project-Specific Insights for Managers

## Overview
This feature allows **Managers** and **Team Leads** to get AI-powered insights about specific projects, analyzing the assigned Team Lead's performance, task completion rates, and overall project health.

## Problem Solved
**Before**: Managers could only see basic project information and couldn't easily assess:
- How well a Team Lead is managing an assigned project
- What percentage of the project is complete
- Whether the Team Lead is overloaded with other work
- Which tasks are blocking progress
- If resources need to be reallocated

**After**: Managers can click "View Insights" on any project to get:
- Detailed completion percentage analysis
- Team Lead's overall workload assessment
- Task-by-task breakdown with status
- Specific recommendations for improvement
- Identification of blockers and bottlenecks

## How It Works

### 1. Data Collection
When a Manager requests insights for a project, the system:

1. **Fetches Project Data**:
   - All tasks with their statuses
   - Task assignments to team members
   - Sub-tasks count for each task
   - Project owner and assigned Team Lead

2. **Analyzes Team Lead Performance**:
   - Total number of projects assigned to that TL
   - Total tasks across all their projects
   - Their overall completion rate
   - Current workload distribution

3. **Calculates Statistics**:
   - Overall project completion percentage
   - Tasks completed / in progress / blocked / todo
   - Unassigned tasks requiring attention
   - Timeline and progress assessment

### 2. AI Analysis
The system uses **GROQ Llama 3.1 70B** to analyze:
- Project completion trajectory
- Team Lead's capacity and workload
- Task distribution effectiveness
- Potential bottlenecks or issues
- Resource allocation needs

### 3. Structured Insights
Every project insight includes 4 sections:

```
**Project Completion Status:**
• Current completion percentage and analysis
• Progress assessment based on task status
• Timeline evaluation

**Team Lead Performance:**
• How the assigned Team Lead is managing this project
• Their overall workload impact on this project
• Task distribution and delegation effectiveness

**Task Analysis:**
• Breakdown of task statuses
• Identification of bottlenecks or blockers
• Unassigned tasks requiring attention

**Recommendations:**
• Immediate actions needed
• Resource allocation suggestions
• Timeline or priority adjustments
• Follow-up items for manager
```

## API Endpoint

### GET `/api/project-insights?projectId={id}`

**Authentication**: Required (JWT token)

**Authorization**:
- **Managers**: Can view insights for projects in their organization
- **Team Leads**: Can view insights for projects assigned to them
- **Team Members**: Cannot access (403 error)
- **Individuals**: Cannot access (403 error)

**Query Parameters**:
- `projectId` (required): The ID of the project to analyze

**Response**:
```json
{
  "insights": "**Project Completion Status:**\n• Project is 67% complete...",
  "stats": {
    "totalTasks": 15,
    "completedTasks": 10,
    "inProgressTasks": 3,
    "blockedTasks": 1,
    "todoTasks": 1,
    "completionPercentage": 67
  },
  "project": {
    "title": "E-commerce Platform",
    "assignedTo": "John Doe (Team Lead)"
  }
}
```

**Error Responses**:
- `401`: Unauthorized (no token)
- `403`: Forbidden (not owner or assigned TL)
- `404`: Project not found
- `500`: Server error

## UI Components

### ProjectInsights Component

**Location**: `/app/components/ProjectInsights.tsx`

**Features**:
- Modal overlay with project details
- Stats bar showing completion metrics
- AI-generated insights with formatted sections
- Refresh button to regenerate insights
- Team Lead information display
- Loading and error states

**Props**:
```typescript
interface Props {
  projectId: string;      // ID of the project
  projectTitle: string;   // Title for display
  onClose: () => void;    // Close modal callback
}
```

### Integration in ProjectTable

**Location**: `/app/components/ProjectTable.tsx`

**Changes**:
- Added "View Insights" button for Managers and Team Leads
- Button appears next to "Delete" button
- Opens ProjectInsights modal on click
- Purple-themed button for visual distinction

## User Flow

### For Managers:

1. **Navigate to Dashboard or Projects Page**
2. **View list of projects** in the organization
3. **Click "View Insights"** on any project
4. **Modal opens** with project title
5. **See stats bar** with completion metrics (%, Done, In Progress, Blocked, To Do)
6. **Click "Generate Insights"** button
7. **Wait 2-5 seconds** for AI analysis
8. **Review insights** in 4 structured sections
9. **Click "Refresh Insights"** to regenerate with latest data
10. **Close modal** when done

### For Team Leads:

1. **Navigate to Projects Page**
2. **View projects assigned to them**
3. **Click "View Insights"** to self-assess
4. **Review AI analysis** of their performance
5. **Identify areas for improvement**
6. **Take action** based on recommendations

## Example Insights

### High-Performing Project (80% Complete)

```
**Project Completion Status:**
• Project "E-commerce Platform" is 80% complete (12/15 tasks done)
• 2 tasks are currently being worked on
• Only 1 task remains to be started
• On track to meet deadline based on current velocity

**Team Lead Performance:**
• Assigned to Sarah Chen who is managing 3 total projects
• This Team Lead has 24 total tasks across all projects
• Their completion rate is 75% - performing well
• Task delegation is effective with clear assignments

**Task Analysis:**
• Completed: 12 tasks finished successfully
• In Progress: 2 tasks actively being worked on (Payment Integration, Checkout Flow)
• Blocked: 0 tasks - no blockers identified
• Unassigned: 1 task needs assignment (Admin Dashboard)

**Recommendations:**
• Assign the remaining "Admin Dashboard" task to a team member
• No blockers - workflow is running smoothly
• Project is making good progress - maintain momentum
• Consider completing this project before starting new initiatives
```

### Struggling Project (30% Complete)

```
**Project Completion Status:**
• Project "Mobile App Redesign" is 30% complete (3/10 tasks done)
• 2 tasks are currently in progress
• 3 tasks are blocked and require immediate attention
• Project is at risk of missing deadline

**Team Lead Performance:**
• Assigned to Mike Rodriguez who is managing 5 total projects
• This Team Lead has 42 total tasks across all projects
• Their completion rate is 45% - showing signs of overload
• May need support or workload redistribution

**Task Analysis:**
• Completed: 3 tasks finished
• In Progress: 2 tasks actively being worked on
• Blocked: 3 tasks are blocked (UI Component Library, API Integration, Testing Suite)
• Unassigned: 2 tasks need assignment

**Recommendations:**
• Urgently address 3 blocked tasks to unblock progress
• Team Lead is managing 5 projects - consider redistributing 1-2 projects to reduce load
• Assign 2 unassigned tasks immediately
• Project is less than 50% complete - needs additional resources or priority boost
• Schedule meeting with Team Lead to understand blockers and provide support
```

### Unassigned Project

```
**Project Completion Status:**
• Project "Internal Tools" is 0% complete (0/8 tasks done)
• No progress has been made yet
• All 8 tasks are in TODO status

**Team Lead Performance:**
• Project is not yet assigned to a Team Lead
• Immediate assignment recommended to begin progress
• No tasks have been created or delegated

**Task Analysis:**
• Completed: 0 tasks
• In Progress: 0 tasks
• Blocked: 0 tasks
• To Do: 8 tasks waiting to be started

**Recommendations:**
• Assign this project to a Team Lead immediately to initiate work
• Review Team Lead workloads before assigning
• Consider project priority and deadline when selecting assignee
• Once assigned, Team Lead should create detailed task breakdown and assignments
```

## Technical Implementation

### Data Flow

```
Manager clicks "View Insights"
    ↓
ProjectInsights modal opens
    ↓
User clicks "Generate Insights"
    ↓
API call: GET /api/project-insights?projectId=xxx
    ↓
Backend fetches:
  - Project with all tasks
  - Team Lead's other projects
  - Team Lead's all tasks
    ↓
Backend calculates stats:
  - Completion percentage
  - Task status distribution
  - TL workload metrics
    ↓
Backend calls GROQ AI API
  - Sends structured prompt
  - Includes all statistics
  - Requests formatted response
    ↓
AI generates insights
    ↓
Backend returns:
  - Insights text
  - Statistics object
  - Project info
    ↓
Frontend displays:
  - Stats bar
  - Formatted insights
  - Refresh button
```

### Security

1. **Authentication**: JWT token required
2. **Authorization**: Role-based access control
   - Managers can view projects in their org
   - Team Leads can view their assigned projects
   - Others get 403 Forbidden
3. **Data Filtering**: Only shows data user has access to
4. **No Cross-Org Access**: Managers can't see other org's projects

### Performance

- **Initial Load**: Stats bar displays immediately from API response
- **AI Generation**: Takes 2-5 seconds depending on data size
- **Caching**: Not cached (always fresh data)
- **Token Limit**: Uses ~1000 tokens per insight generation

## Environment Setup

Required environment variable:
```bash
GROQ_API_KEY=your_groq_api_key_here
```

## Fallback Mechanism

If AI API fails or is unavailable:
- System generates template-based insights
- Uses same structure but with basic statistics
- Provides generic recommendations based on completion rate
- Ensures users always get some insights

## Benefits

### For Managers:
✅ **Quick Project Health Check**: See completion % at a glance  
✅ **Team Lead Performance**: Understand if TL is overloaded  
✅ **Proactive Issue Detection**: Identify blockers early  
✅ **Data-Driven Decisions**: Make informed resource allocation choices  
✅ **Time Savings**: No need to manually analyze each task  

### For Team Leads:
✅ **Self-Assessment**: Review their own performance objectively  
✅ **Identify Gaps**: See which tasks need attention  
✅ **Workload Awareness**: Understand their capacity utilization  
✅ **Improvement Areas**: Get AI recommendations for better management  

### For Organization:
✅ **Better Project Success Rates**: Early intervention prevents failures  
✅ **Optimized Resource Allocation**: Data-driven assignment decisions  
✅ **Improved Team Performance**: Identify and address bottlenecks  
✅ **Enhanced Accountability**: Clear metrics for project progress  

## Testing Checklist

- [ ] Manager can view insights for projects in their org
- [ ] Manager cannot view insights for other org's projects (403 error)
- [ ] Team Lead can view insights for their assigned projects
- [ ] Team Lead cannot view insights for unassigned projects (403 error)
- [ ] Team Member gets 403 error when trying to access
- [ ] Individual gets 403 error when trying to access
- [ ] Stats bar displays correct percentages
- [ ] AI insights generate within 5 seconds
- [ ] Fallback insights work when AI fails
- [ ] Refresh button regenerates insights
- [ ] Modal closes properly
- [ ] "View Insights" button appears for Managers
- [ ] "View Insights" button appears for Team Leads
- [ ] "View Insights" button does not appear for Team Members
- [ ] Insights show Team Lead's workload data
- [ ] Insights identify blocked tasks correctly
- [ ] Recommendations are role-appropriate

## Future Enhancements

### 1. Historical Insights
- Store insights over time
- Show trend graphs (completion over weeks)
- Compare current vs previous insights

### 2. Predictive Analytics
- Predict project completion date
- Identify at-risk projects before they fail
- Suggest optimal task sequencing

### 3. Team Comparison
- Compare TL performance across projects
- Benchmark against organization averages
- Identify top performers

### 4. Export and Sharing
- Export insights as PDF
- Email weekly project summaries
- Share insights with stakeholders

### 5. Custom Queries
- Ask specific questions about project
- "Why is Task X blocked?"
- "When will this project finish?"

### 6. Integration Alerts
- Auto-notify manager when project < 30% complete
- Alert when TL is overloaded (>40 tasks)
- Flag projects with >3 blocked tasks

## Troubleshooting

### Insights Not Loading
1. Check GROQ_API_KEY is set
2. Verify user has permission (Manager or assigned TL)
3. Check project exists and user has access
4. Look for errors in browser console

### Generic Insights Appearing
- AI API may be down (fallback active)
- Check server logs for GROQ API errors
- Verify API key is valid

### 403 Forbidden Error
- User doesn't have permission
- Project not in user's organization
- Team Lead not assigned to this project

### Stats Show 0%
- Project may have no tasks
- Check if tasks exist in database
- Verify task statuses are set correctly

## Comparison with Dashboard Insights

| Feature | Dashboard Insights | Project Insights |
|---------|-------------------|------------------|
| **Scope** | All projects and tasks | Single project |
| **Audience** | All roles | Managers & Team Leads |
| **Location** | `/insights` page | Project modal |
| **Focus** | Overall performance | Project-specific analysis |
| **TL Workload** | Not included | Detailed TL workload data |
| **Use Case** | Daily overview | Deep-dive analysis |
| **Refresh** | Manual refresh | Per-project refresh |

## Conclusion

The Project Insights feature provides Managers with a powerful tool to:
- Monitor project health at a granular level
- Assess Team Lead performance and capacity
- Make data-driven resource allocation decisions
- Identify and resolve blockers proactively

By analyzing the Team Lead's complete dashboard (all their projects and tasks), Managers get a holistic view of whether the TL has the capacity to handle the project effectively, enabling better project outcomes and team performance.
