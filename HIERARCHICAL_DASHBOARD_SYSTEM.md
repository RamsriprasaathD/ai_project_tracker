# Hierarchical Dashboard System - Complete Implementation

## Overview
This document describes the complete hierarchical project and task management system with role-based dashboards, privacy controls, and bi-directional status flow.

## System Architecture

### Hierarchy Flow
```
Manager
  ↓ Creates Project
  ↓ Assigns to Team Lead
Team Lead (TL-002)
  ↓ Views Project
  ↓ Creates Tasks
  ↓ Assigns to Team Members
Team Member (TM-001)
  ↓ Completes Tasks
  ↓ Status updates flow back up
Team Lead sees updated task status
  ↓
Manager sees project completion % increase
```

## Role-Based Dashboards

### 1. Manager Dashboard

**What They See**:
- All projects in their organization
- All tasks across their organization
- Overall statistics

**Key Features**:
- Create new projects
- Assign projects to Team Leads
- View project insights (AI-powered)
- Manage tasks button for each project
- Delete projects
- See project completion status
- See creator and assignee information

**Dashboard Sections**:
```typescript
- Stats Cards: Total Projects, Total Tasks, In Progress, Completed
- Quick Actions: Create Project, Create Task
- Recent Projects (last 5)
- Recent Tasks (last 5)
```

**Project View**:
```
Project: E-commerce Platform
Created by: Manager Name
Assigned to: TL-002

Buttons:
[Manage Tasks] [AI Insights] [Delete]
```

### 2. Team Lead Dashboard

**What They See**:
- **Section 1**: Projects assigned by Manager (cyan header)
- **Section 2**: Projects created by themselves (purple header)
- All tasks (assigned to them or created by them)

**Key Features**:
- Click "Manage Tasks" to enter project detail page
- Create tasks within manager-assigned projects
- Create own projects
- View AI insights for any project
- See task completion status in real-time
- Separate workflow for manager vs own work

**Dashboard Sections**:
```typescript
// Separated Sections
1. "Projects Assigned by Manager" (count)
   - Projects where assignedToId === TL.id && ownerId !== TL.id
   - These are manager-delegated projects
   
2. "My Projects" (count)
   - Projects where ownerId === TL.id
   - These are self-created projects

3. "Recent Tasks" (10 tasks)
   - All tasks visible to TL
```

**Why This Matters**:
- TL can prioritize manager-assigned work
- TL can manage personal projects separately
- Clear accountability for delegated work
- Manager can track TL performance on assigned projects only

### 3. Team Member Dashboard

**What They See**:
- **ONLY** their assigned tasks
- **NO** project hierarchy information
- **NO** creator information
- **NO** manager/TL relationship details

**Key Features**:
- Simple task list with status updates
- Create private sub-tasks
- Focus message about completing work
- Update task status
- View due dates

**Dashboard Sections**:
```typescript
- Stats Cards: (same as others)
- Info Message: "Focus on completing your assigned tasks..."
- "My Assigned Tasks" (all tasks)
  - Task title
  - Description
  - Due date
  - Status (can update)
  - Sub-tasks (private, only visible to them)
```

**Privacy Features**:
- ❌ Project name hidden
- ❌ Creator name hidden
- ❌ Manager information hidden
- ✅ Only see task details and assignee
- ✅ Sub-tasks are private

**Why This Matters**:
- Team members focus on execution
- No distraction from organizational hierarchy
- Privacy maintained
- Clear scope of work

### 4. Individual User Dashboard

**What They See**:
- Their own projects
- Their own tasks
- Standard layout (no hierarchy concerns)

**Key Features**:
- Full control over projects and tasks
- Create projects
- Create tasks
- Self-manage workflow

## Project Detail Page

### URL Structure
```
/project/[projectId]
```

### Access Control
- **Manager**: Can view any project in their organization
- **Team Lead**: Can view assigned projects or own projects
- **Team Member**: Cannot access (tasks are shown in dashboard)
- **Individual**: Can view own projects

### Features

**Header Section**:
```typescript
<Project Title>
<Description>
Created by: <Manager Name>
Assigned to: <Team Lead Name>

[Create Task Button] (for TL/Manager only)
```

**Statistics Bar**:
```
[67% Complete] [3 Total] [2 Done] [1 In Progress] [0 Blocked] [0 To Do]
```

**Task Management**:
- Full TaskTable with all project tasks
- Create tasks directly linked to this project
- Update task statuses
- Assign tasks to team members
- View sub-tasks (if TL views TM's task)

**Use Cases**:

1. **Manager assigns project to TL-002**:
   - Manager creates "E-commerce Platform"
   - Manager assigns to TL-002
   - TL-002 sees it in "Projects Assigned by Manager"

2. **TL-002 clicks "Manage Tasks"**:
   - Navigates to `/project/[id]`
   - Sees project details and stats
   - Clicks "Create Task"

3. **TL-002 creates tasks**:
   - Modal opens with project pre-selected
   - TL-002 enters task details
   - Selects team member (TM-001)
   - Task is created with projectId
   - Task appears in project task list

4. **TM-001 completes task**:
   - TM-001 sees task in dashboard
   - Updates status to DONE
   - Status change visible immediately

5. **TL-002 sees update**:
   - Returns to project detail page
   - Stats show: 1 Done, completion 33%
   - Can create more tasks as needed

6. **Manager checks progress**:
   - Manager clicks "AI Insights" on project
   - Sees: "Project is 33% complete (1/3 tasks done)"
   - AI analyzes TL-002's workload
   - Gets recommendations

## Task Completion Status Flow

### Forward Flow (Top-Down)
```
1. Manager creates Project A
   ↓
2. Manager assigns Project A to TL-002
   ↓
3. TL-002 opens Project A detail page
   ↓
4. TL-002 creates Task 1 for Project A
   ↓
5. TL-002 assigns Task 1 to TM-001
   ↓
6. Task 1 appears in TM-001's dashboard
```

### Backward Flow (Bottom-Up)
```
1. TM-001 sees Task 1 in dashboard
   ↓
2. TM-001 changes status: TODO → IN_PROGRESS
   ↓
3. Database updated: task.status = 'IN_PROGRESS'
   ↓
4. TL-002 refreshes Project A detail page
   ↓
5. Stats update: 0% → 0% (1 in progress, 0 done)
   ↓
6. TM-001 changes status: IN_PROGRESS → DONE
   ↓
7. Database updated: task.status = 'DONE'
   ↓
8. TL-002 refreshes Project A detail page
   ↓
9. Stats update: 0% → 100% (1 done, 0 in progress)
   ↓
10. Manager clicks "View Insights" on Project A
   ↓
11. API calculates completion: 100% (1/1 tasks done)
   ↓
12. Manager sees accurate project status
```

### Real-Time Updates

**Without Page Refresh** (Current Implementation):
- Changes save to database immediately
- Next page load/refresh shows updated data
- Stats recalculate on data fetch

**With Future Websockets** (Enhancement):
- Real-time updates without refresh
- Live completion percentage updates
- Instant notification of status changes

## Data Flow Verification

### Test Scenario 1: Complete Task Flow

**Setup**:
- Manager: m@test.com
- Team Lead: tl2@test.com (TL-002)
- Team Member: tm1@test.com (TM-001)
- Project: "Mobile App"
- Task: "Design UI"

**Steps**:

1. **Manager creates project**:
   ```typescript
   POST /api/projects
   {
     title: "Mobile App",
     assignedToId: <TL-002 ID>,
     organizationId: <org ID>
   }
   // Result: project.assignedToId = TL-002 ID
   ```

2. **TL-002 views dashboard**:
   ```typescript
   GET /api/projects
   // Filters: assignedToId === TL-002 && ownerId !== TL-002
   // Shows: "Mobile App" in "Projects Assigned by Manager"
   ```

3. **TL-002 navigates to project**:
   ```typescript
   router.push('/project/mobile-app-id')
   // Shows: Project detail page with 0 tasks
   ```

4. **TL-002 creates task**:
   ```typescript
   POST /api/tasks
   {
     title: "Design UI",
     projectId: "mobile-app-id", // ✅ Linked!
     assigneeId: <TM-001 ID>
   }
   // Result: task created with projectId
   ```

5. **TM-001 views dashboard**:
   ```typescript
   GET /api/tasks
   // Filters: assigneeId === TM-001
   // Shows: "Design UI" (status: TODO)
   // Hides: projectId, creator info
   ```

6. **TM-001 updates status**:
   ```typescript
   PUT /api/tasks
   {
     id: "design-ui-task-id",
     status: "IN_PROGRESS"
   }
   // Result: task.status = 'IN_PROGRESS'
   ```

7. **TL-002 refreshes project page**:
   ```typescript
   GET /api/tasks
   // Gets all tasks with projectId = "mobile-app-id"
   // Shows: "Design UI" (status: IN_PROGRESS) ✅
   // Stats: 0% complete, 1 in progress
   ```

8. **TM-001 completes task**:
   ```typescript
   PUT /api/tasks
   {
     id: "design-ui-task-id",
     status: "DONE"
   }
   // Result: task.status = 'DONE'
   ```

9. **Manager checks insights**:
   ```typescript
   GET /api/project-insights?projectId=mobile-app-id
   // Calculates:
   // - Total tasks: 1
   // - Completed: 1
   // - Completion: 100%
   // - TL-002 workload: all their projects/tasks
   // Returns: "Project is 100% complete (1/1 tasks done)"
   ```

### Test Scenario 2: Multiple Tasks Flow

**Setup**:
- 3 tasks in "Mobile App" project
- All assigned to different team members

**Expected Results**:

| Task | Assignee | Status | Project Completion |
|------|----------|--------|-------------------|
| Design UI | TM-001 | TODO | 0% (0/3) |
| API Integration | TM-002 | TODO | 0% (0/3) |
| Testing | TM-003 | TODO | 0% (0/3) |

**After TM-001 completes**:

| Task | Assignee | Status | Project Completion |
|------|----------|--------|-------------------|
| Design UI | TM-001 | DONE | 33% (1/3) ✅ |
| API Integration | TM-002 | TODO | 33% (1/3) |
| Testing | TM-003 | TODO | 33% (1/3) |

**After TM-002 completes**:

| Task | Assignee | Status | Project Completion |
|------|----------|--------|-------------------|
| Design UI | TM-001 | DONE | 67% (2/3) ✅ |
| API Integration | TM-002 | DONE | 67% (2/3) ✅ |
| Testing | TM-003 | TODO | 67% (2/3) |

**After TM-003 completes**:

| Task | Assignee | Status | Project Completion |
|------|----------|--------|-------------------|
| Design UI | TM-001 | DONE | 100% (3/3) ✅✅✅ |
| API Integration | TM-002 | DONE | 100% (3/3) ✅✅✅ |
| Testing | TM-003 | DONE | 100% (3/3) ✅✅✅ |

## Privacy and Information Hiding

### What Team Members DON'T See

1. **Project Information**:
   - ❌ Project name
   - ❌ Project description
   - ❌ Project assigned to (TL name)
   - ❌ Project creator (Manager name)

2. **Organizational Hierarchy**:
   - ❌ Who created the task (TL name)
   - ❌ Relationship between Manager and TL
   - ❌ Other team members' tasks
   - ❌ Project completion percentage

3. **Business Context**:
   - ❌ Why task was created
   - ❌ Project deadlines
   - ❌ Priority compared to other projects
   - ❌ Manager's strategic goals

### What Team Members DO See

1. **Task Information**:
   - ✅ Task title
   - ✅ Task description
   - ✅ Due date
   - ✅ Current status
   - ✅ Who it's assigned to (themselves)

2. **Action Items**:
   - ✅ Update task status
   - ✅ Create private sub-tasks
   - ✅ View their own sub-tasks
   - ✅ Manage their workload

### Why This Privacy Matters

**For Team Members**:
- Focus on execution, not politics
- Reduced cognitive load
- Clear scope of responsibility
- Protection from organizational complexity

**For Team Leads**:
- Can delegate without exposing manager relationships
- Team members don't bypass TL to contact manager
- Maintains authority and chain of command
- Professional boundaries respected

**For Managers**:
- Team Leads handle team communication
- Can strategize without team member visibility
- Proper delegation hierarchy
- Organizational structure maintained

## AI Insights Integration

### Dashboard Insights (All Roles)

**Endpoint**: `/api/dashboard-insights`

**For Team Leads**:
- Analyzes both manager-assigned and own projects
- Considers total workload
- Provides role-specific recommendations
- Understands delegated responsibilities

**For Team Members**:
- Focuses on assigned tasks only
- Suggests prioritization
- Identifies overdue items
- Encourages sub-task creation

**For Managers**:
- Overview of entire organization
- Highlights struggling Team Leads
- Identifies blocked projects
- Resource allocation suggestions

### Project Insights (Manager/TL Only)

**Endpoint**: `/api/project-insights?projectId={id}`

**For Managers viewing TL's project**:
```
GET /api/project-insights?projectId=mobile-app-id

Analysis includes:
- Project completion: 67% (2/3 tasks done)
- TL-002 workload: 5 projects, 42 tasks total
- TL-002 completion rate: 45% (showing overload)
- Recommendations:
  • Consider redistributing 1-2 projects from TL-002
  • Project on track but TL needs support
  • Assign additional resources if timeline is critical
```

**For Team Leads viewing own project**:
```
GET /api/project-insights?projectId=my-project-id

Analysis includes:
- Project completion: 80%
- Your overall workload: 3 projects, 18 tasks
- Self-assessment of performance
- Recommendations:
  • 1 blocked task needs attention
  • On track to complete on time
  • Consider delegating more to team members
```

## File Structure

### New Files Created

```
/app/project/[id]/page.tsx
- Project detail page
- Task management interface
- Statistics display
- TL/Manager access only

/PROJECT_TASK_LINKING_FIX.md
- Documents projectId linking fix
- Explains 0% completion issue
- Migration guide

/HIERARCHICAL_DASHBOARD_SYSTEM.md (this file)
- Complete system documentation
- Role-based access explanation
- Data flow verification
```

### Modified Files

```
/app/dashboard/page.tsx
- Separated TL view into two sections
- Added assignedProjects and ownProjects state
- Customized Team Member view
- Removed project info for TM

/app/components/ProjectTable.tsx
- Added "Manage Tasks" button
- Navigation to project detail page
- Renamed "View Insights" to "AI Insights"

/app/components/TaskTable.tsx
- Hidden project name from Team Members
- Hidden creator name from Team Members
- Privacy-preserving display

/app/components/modals/CreateTaskModal.tsx
- Added project selector dropdown
- Required project selection for TL/Manager
- Validation for project assignment
```

## User Journeys

### Journey 1: Manager Delegates Project

1. Manager logs in
2. Dashboard shows organization stats
3. Clicks "Create New Project"
4. Fills form: "Website Redesign"
5. Selects TL-002 from dropdown
6. Project created and assigned
7. TL-002 receives project in "Projects Assigned by Manager"

### Journey 2: Team Lead Manages Project

1. TL-002 logs in
2. Dashboard shows two sections:
   - "Projects Assigned by Manager" (1 project)
   - "My Projects" (2 projects)
3. Clicks "Manage Tasks" on "Website Redesign"
4. Navigates to project detail page
5. Sees: 0 tasks, 0% complete
6. Clicks "Create Task"
7. Modal opens with project pre-selected
8. Enters: "Homepage Design"
9. Selects TM-001 as assignee
10. Task created successfully
11. Page refreshes, shows 1 task
12. Stats: 0% complete, 1 TODO

### Journey 3: Team Member Completes Work

1. TM-001 logs in
2. Dashboard shows "My Assigned Tasks"
3. Sees: "Homepage Design" (no project name)
4. Reads description and due date
5. Updates status: TODO → IN_PROGRESS
6. Works on task
7. Updates status: IN_PROGRESS → DONE
8. Task completion reflects in TL and Manager views

### Journey 4: Manager Checks Progress

1. Manager logs in
2. Dashboard shows all projects
3. Finds "Website Redesign"
4. Sees: "1 task" indicator
5. Clicks "AI Insights"
6. Modal shows:
   - 100% complete (1/1 task done)
   - TL-002 managing 5 projects total
   - TL-002 has 42 tasks (45% complete)
   - Recommendation: "Project complete, consider assigning new project"
7. Manager satisfied with progress

## API Endpoints Summary

| Endpoint | Method | Access | Purpose |
|----------|--------|--------|---------|
| `/api/projects` | GET | All | Fetch role-based projects |
| `/api/projects` | POST | Manager, TL, Individual | Create project |
| `/api/projects?id={id}` | GET | All | Fetch specific project |
| `/api/projects?id={id}` | DELETE | Manager, Owner | Delete project |
| `/api/tasks` | GET | All | Fetch role-based tasks |
| `/api/tasks` | POST | Manager, TL, Individual | Create task (with projectId) |
| `/api/tasks` | PUT | Assignee, Creator, Manager, TL | Update task status |
| `/api/dashboard-insights` | GET | All | Role-based AI insights |
| `/api/project-insights?projectId={id}` | GET | Manager, TL | Project-specific AI insights |
| `/api/assignable-users` | GET | Manager, TL | Fetch users to assign to |

## Key Implementation Details

### Team Lead Project Separation

```typescript
// In dashboard loadData()
if (currentUser?.role === "TEAM_LEAD") {
  const assigned = fetchedProjects.filter((p: any) => 
    p.assignedToId === currentUser.id && p.ownerId !== currentUser.id
  );
  const own = fetchedProjects.filter((p: any) => 
    p.ownerId === currentUser.id
  );
  setAssignedProjects(assigned);
  setOwnProjects(own);
}
```

**Logic**:
- `assignedProjects`: Projects where TL is assigned but didn't create
  - These came from Manager
  - TL is responsible for completing these
- `ownProjects`: Projects where TL is the creator
  - Self-initiated work
  - Separate accountability

### Team Member Privacy

```typescript
// In TaskTable.tsx
{/* Hide project details from Team Members */}
{t.project?.title && currentUser?.role !== "TEAM_MEMBER" && (
  <div>📁 Project: {t.project.title}</div>
)}

{/* Hide creator info from Team Members */}
{t.creator && currentUser?.role !== "TEAM_MEMBER" && (
  <div>📋 Created by: {t.creator.name}</div>
)}
```

**Result**: Team Members see clean task list without organizational context.

### Project Task Linking

```typescript
// In CreateTaskModal.tsx
// Project selector for TL/Manager
{!projectId && (currentUser?.role === "MANAGER" || currentUser?.role === "TEAM_LEAD") && (
  <select value={selectedProject} onChange={...}>
    <option value="">Select Project</option>
    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
  </select>
)}

// Validation
if ((currentUser?.role === "MANAGER" || currentUser?.role === "TEAM_LEAD") && !selectedProject) {
  setError("Please select a project for this task");
  return;
}
```

**Result**: All tasks created by TL/Manager are linked to a project, ensuring accurate completion tracking.

## Testing Checklist

### Dashboard Tests

- [ ] Manager sees all organization projects
- [ ] Manager can create projects
- [ ] TL sees two separate sections on dashboard
- [ ] TL's "Projects Assigned by Manager" shows correct projects
- [ ] TL's "My Projects" shows correct projects
- [ ] Team Member sees only "My Assigned Tasks"
- [ ] Team Member doesn't see project names
- [ ] Team Member doesn't see creator names
- [ ] Stats cards show correct numbers for each role

### Project Detail Page Tests

- [ ] TL can access manager-assigned projects
- [ ] TL can access own projects
- [ ] Team Member cannot access project detail page
- [ ] "Manage Tasks" button navigates correctly
- [ ] Project stats calculate correctly
- [ ] Tasks filter by projectId correctly
- [ ] Create task button works
- [ ] Tasks created have correct projectId

### Task Flow Tests

- [ ] Manager creates project → TL sees it
- [ ] TL creates task → projectId is set
- [ ] TL assigns task → Team Member sees it
- [ ] Team Member updates status → TL sees update
- [ ] TL refreshes project page → stats update
- [ ] Manager views insights → correct completion %
- [ ] Multiple tasks calculate % correctly
- [ ] Blocked/In Progress states work

### Privacy Tests

- [ ] Team Member cannot see project names
- [ ] Team Member cannot see creator names
- [ ] Team Member cannot access /project/[id]
- [ ] Sub-tasks remain private to team member
- [ ] TL cannot see TM's sub-tasks
- [ ] Manager cannot see TM's sub-tasks

### AI Insights Tests

- [ ] Dashboard insights work for all roles
- [ ] Project insights show correct completion %
- [ ] TL workload data is accurate
- [ ] Recommendations are role-appropriate
- [ ] Insights refresh when status changes

## Benefits of This System

### For Organizations
- ✅ Clear chain of command
- ✅ Proper delegation hierarchy
- ✅ Accountability at each level
- ✅ Accurate project tracking
- ✅ Data-driven decision making

### For Managers
- ✅ Delegate projects to Team Leads
- ✅ Track project completion easily
- ✅ Assess Team Lead performance
- ✅ Identify overloaded Team Leads
- ✅ Make informed resource decisions

### For Team Leads
- ✅ Separate manager-assigned vs own work
- ✅ Manage tasks within projects
- ✅ Delegate to team members
- ✅ Track progress in real-time
- ✅ Self-assess performance

### For Team Members
- ✅ Simple, focused task list
- ✅ No organizational distractions
- ✅ Clear action items
- ✅ Private sub-task management
- ✅ Update status easily

### For Project Success
- ✅ Accurate completion tracking
- ✅ Real-time status updates
- ✅ Clear task ownership
- ✅ Proper information flow
- ✅ AI-powered insights

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live status changes
2. **Notifications**: Alert TL when team member completes task
3. **Project Templates**: Pre-define common project structures
4. **Bulk Task Import**: CSV upload for multiple tasks
5. **Gantt Charts**: Visual project timeline
6. **Workload Balancing**: Auto-suggest task assignments
7. **Performance Analytics**: Historical performance metrics
8. **Mobile App**: Native mobile experience
9. **Task Dependencies**: Link tasks that depend on others
10. **Time Tracking**: Track hours spent on tasks

## Conclusion

This hierarchical dashboard system provides:
- ✅ **Proper role separation**: Each role sees what they need
- ✅ **Privacy preservation**: Team members focus on execution
- ✅ **Accurate tracking**: Status flows correctly through hierarchy
- ✅ **Manager visibility**: Clear project completion metrics
- ✅ **Team Lead organization**: Separate manager vs own work
- ✅ **AI insights**: Data-driven recommendations

The system maintains organizational structure while enabling effective project management and completion tracking from Team Members → Team Leads → Managers.
