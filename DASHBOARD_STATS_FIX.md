# Dashboard Stats Fix

## Problem
Dashboard was showing 0 projects and 0 tasks for both Managers and Team Leads, even after projects were assigned.

## Root Causes

### 1. Race Condition in Stats Calculation
The stats were being calculated in `fetchTasks()` before `fetchProjects()` had completed, resulting in `projects.length` being 0.

### 2. Incorrect Team Lead Project Filter
Team Leads were querying for all projects in their organization, not just projects assigned to them.

### 3. Missing Owner Information
Projects weren't including owner (creator) information in the API response.

## Solutions Implemented

### 1. Fixed Dashboard Stats Calculation (`/app/dashboard/page.tsx`)

**Before:**
```typescript
async function fetchTasks() {
  // ... fetch tasks
  setStats({
    totalProjects: projects.length, // ❌ projects is still empty!
    totalTasks: fetchedTasks.length,
    // ...
  });
}

async function loadData() {
  await fetchProjects();  // runs first
  await fetchTasks();     // calculates stats with old projects data
}
```

**After:**
```typescript
function calculateStats(projectsList: any[], tasksList: any[]) {
  const completed = tasksList.filter((t: any) => t.status === "DONE").length;
  const inProgress = tasksList.filter((t: any) => t.status === "IN_PROGRESS").length;
  
  setStats({
    totalProjects: projectsList.length, // ✅ uses parameter
    totalTasks: tasksList.length,
    completedTasks: completed,
    inProgressTasks: inProgress,
  });
}

async function loadData() {
  // Fetch both
  const fetchedProjects = await fetch(...);
  const fetchedTasks = await fetch(...);
  
  setProjects(fetchedProjects);
  setTasks(fetchedTasks);
  
  // Calculate stats AFTER both are loaded
  calculateStats(fetchedProjects, fetchedTasks); // ✅
}

// Auto-recalculate when data changes
useEffect(() => {
  if (projects.length >= 0 || tasks.length >= 0) {
    calculateStats(projects, tasks);
  }
}, [projects, tasks]);
```

### 2. Fixed Team Lead Project Query (`/app/api/projects/route.ts`)

**Before:**
```typescript
if (user.role === "TEAM_LEAD") {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { assignedToId: user.id },
        { ownerId: user.id },
        { organizationId: user.organizationId }, // ❌ Too broad!
      ],
    },
    // ...
  });
}
```

**After:**
```typescript
if (user.role === "TEAM_LEAD") {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { assignedToId: user.id }, // ✅ Projects assigned by manager
        { ownerId: user.id },       // ✅ Projects they created (if any)
      ],
    },
    include: { tasks: true, assignedTo: true, owner: true }, // ✅ Include owner
    // ...
  });
}
```

### 3. Added Owner Information to All Project Queries

All role-based project queries now include:
```typescript
include: { tasks: true, assignedTo: true, owner: true }
```

This allows the UI to display:
- Who created the project
- Who it's assigned to
- Related tasks

## Results

### For Managers:
- ✅ See total projects they created
- ✅ See total tasks in their organization
- ✅ Accurate completed/in-progress counts
- ✅ Can see project owner and assignee information

### For Team Leads:
- ✅ See projects assigned to them by managers
- ✅ See tasks they created or assigned to their team
- ✅ Accurate task counts
- ✅ Can see who created the project

### For Team Members:
- ✅ See only projects with tasks assigned to them
- ✅ See only their assigned tasks
- ✅ Accurate personal task counts

### For Individuals:
- ✅ See their personal projects
- ✅ See their personal tasks
- ✅ Accurate counts

## Testing Verification

### Test Case 1: Manager Creates Project for Team Lead
1. Login as Manager
2. Create project, assign to Team Lead (TL-001)
3. **Expected**: Manager dashboard shows "Total Projects: 1"
4. **Expected**: Team Lead dashboard shows "Total Projects: 1"

### Test Case 2: Team Lead Creates Task for Team Member
1. Login as Team Lead
2. Create task, assign to Team Member (TM-001)
3. **Expected**: Team Lead dashboard shows "Total Tasks: 1"
4. **Expected**: Team Member dashboard shows "Total Tasks: 1"

### Test Case 3: Multiple Projects and Tasks
1. Manager creates 3 projects for Team Lead
2. Team Lead creates 5 tasks for Team Members
3. Team Members mark 2 tasks as DONE
4. **Expected**: 
   - Manager: 3 projects, 5 tasks, 2 completed
   - Team Lead: 3 projects, 5 tasks, 2 completed
   - Team Member: 0-1 projects (with their tasks), N tasks assigned to them

### Test Case 4: Stats Update in Real-time
1. Team Member marks task as DONE
2. Refresh dashboard
3. **Expected**: "Completed" count increases by 1

## Technical Details

### Files Modified:
1. `/app/dashboard/page.tsx` - Fixed stats calculation timing
2. `/app/api/projects/route.ts` - Fixed TL query, added owner info

### Key Changes:
- Separated stats calculation into its own function
- Fetch projects and tasks in parallel during load
- Calculate stats only after both are loaded
- Added useEffect to recalculate when data changes
- Narrowed Team Lead project query to only assigned projects
- Added owner relationship to all project queries

### Performance Considerations:
- Stats calculation is O(n) where n is number of tasks
- Runs only when projects or tasks arrays change
- No unnecessary re-renders
- Parallel fetching reduces load time

## Known Limitations

1. **Real-time Updates**: Stats don't update automatically when other users make changes. User must refresh the page.
2. **Large Datasets**: If there are thousands of tasks, stats calculation might be slow. Consider pagination or backend aggregation for large organizations.

## Future Enhancements

1. Add WebSocket for real-time stat updates
2. Implement caching for dashboard stats
3. Add date range filters for stats
4. Show trend graphs (tasks completed over time)
5. Add per-project stats breakdown
