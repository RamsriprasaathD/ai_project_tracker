# Sub-task Privacy Feature

## Overview
This feature ensures that sub-tasks created by team members are completely private and not visible to team leads or managers. This allows team members to organize their work freely without micromanagement.

## Privacy Model

### Who Can See Sub-tasks?
- ✅ **TEAM_MEMBER** (assigned to the parent task): Can see and manage their own sub-tasks
- ❌ **TEAM_LEAD**: CANNOT see team members' sub-tasks
- ❌ **MANAGER**: CANNOT see team members' sub-tasks
- ❌ **INDIVIDUAL**: CANNOT see sub-tasks (they don't use this feature)

### What Team Leads See
Team leads can only see:
- The main task they assigned
- The status of the main task (TODO, IN_PROGRESS, DONE, BLOCKED)
- When the team member marks the main task as DONE

Team leads CANNOT see:
- How many sub-tasks exist
- What the sub-tasks are
- The status of individual sub-tasks
- How the team member broke down their work

## Implementation Details

### Backend (API Level)
**File**: `/app/api/tasks/route.ts`

1. **GET /api/tasks** - Returns tasks based on role:
   - **MANAGER**: Gets tasks WITHOUT subtasks
   - **TEAM_LEAD**: Gets tasks WITHOUT subtasks
   - **TEAM_MEMBER**: Gets tasks WITH subtasks (only their own)
   - **INDIVIDUAL**: Gets tasks WITHOUT subtasks

2. **GET /api/tasks?id={taskId}** - Returns single task:
   - Filters out subtasks if requester is not the assigned team member
   - Even if subtasks exist in DB, they are removed from response for unauthorized users

```typescript
// Hide subtasks from everyone except the assigned team member
if (task && task.subtasks && user.role !== "TEAM_MEMBER") {
  task.subtasks = [];
} else if (task && task.subtasks && user.role === "TEAM_MEMBER" && task.assigneeId !== user.id) {
  task.subtasks = [];
}
```

### Frontend (UI Level)
**Files**: 
- `/app/components/TaskTable.tsx`
- `/app/components/SubTaskTable.tsx`
- `/app/tasks/page.tsx`

1. **TaskTable Component**:
   - Only shows "My Sub-tasks" section to assigned team members
   - Displays "Private - only you can see these" label
   - Expandable section to manage sub-tasks

2. **SubTaskTable Component**:
   - Full CRUD operations for sub-tasks
   - Only rendered when authorized
   - Clear privacy messaging

3. **Tasks Page**:
   - Hint message: "💡 You can create private sub-tasks to break down this task (only you can see them)"

## User Experience

### For Team Members
1. Receives task assignment from Team Lead
2. Opens the task in their dashboard
3. Sees "My Sub-tasks" section with privacy label
4. Can create multiple sub-tasks to break down the work
5. Manages sub-task status independently
6. When all work is complete, marks the **main task** as DONE
7. Team Lead sees the main task status change (not the sub-tasks)

### For Team Leads
1. Assigns task to Team Member
2. Sees the task in their dashboard
3. Can view task details (title, description, status)
4. **CANNOT** see any sub-tasks
5. **CANNOT** see how team member organized their work
6. Only sees when team member updates the main task status
7. Receives notification when main task is marked DONE

### For Managers
- Same visibility as Team Leads
- Can see all tasks in organization
- Cannot see any team member's sub-tasks
- Only sees main task status updates

## Benefits

### 1. Autonomy
Team members can organize their work however they want without being second-guessed.

### 2. No Micromanagement
Team leads focus on outcomes (main task completion) rather than processes (how work is broken down).

### 3. Flexibility
Team members can create as many or as few sub-tasks as they need for their personal organization.

### 4. Trust Building
Demonstrates organizational trust in team members to manage their own work.

### 5. Status Clarity
Main task status reflects overall progress, which is what team leads need to know.

## Data Security

### API Level Protection
- Sub-tasks are filtered at the database query level
- Never sent over the network to unauthorized users
- Cannot be accessed even with API inspection tools

### Authorization Checks
```typescript
// Only team members can see subtasks
if (user.role === "TEAM_MEMBER") {
  // Include subtasks only for tasks assigned to this user
  include: { subtasks: true }
} else {
  // No subtasks for managers, team leads, or individuals
  include: { subtasks: false }
}
```

### Frontend Protection
- UI components check authorization before rendering
- Even if data somehow reached frontend, UI won't display it
- Double-layer of security (backend + frontend)

## Testing Scenarios

### Scenario 1: Team Member Creates Sub-tasks
1. Login as Team Member
2. View assigned task
3. Create 3 sub-tasks
4. Verify they appear in "My Sub-tasks" section
5. Update sub-task statuses
6. Mark main task as DONE

### Scenario 2: Team Lead Views Task
1. Login as Team Lead (who assigned the task)
2. View the task in dashboard
3. Verify NO sub-tasks section appears
4. Verify cannot see how team member broke down work
5. Verify can see main task status

### Scenario 3: Manager Views Task
1. Login as Manager
2. View all organization tasks
3. Select a task assigned to team member
4. Verify NO sub-tasks information appears
5. Verify can only see main task details

### Scenario 4: Privacy Between Team Members
1. Team Member A creates sub-tasks for their task
2. Login as Team Member B
3. Try to view Team Member A's task
4. Verify Team Member B cannot see it (not assigned to them)
5. Verify each team member only sees their own tasks and sub-tasks

## Configuration

No configuration needed. Privacy is enforced automatically based on:
- User role (from JWT token)
- Task assignment (from database)
- API-level filtering (in route handlers)

## Troubleshooting

### Sub-tasks Not Appearing
- Check user is logged in as TEAM_MEMBER role
- Verify task is assigned to current user
- Check browser console for API errors
- Verify subtasks exist in database

### Sub-tasks Visible When They Shouldn't Be
- This should not happen due to API filtering
- If it does, check user authentication
- Verify role is being read correctly from token
- Check API response in Network tab

## Future Enhancements

Potential future features (not currently implemented):
1. Optional sub-task sharing with specific team members
2. Sub-task templates for common task breakdowns
3. Sub-task analytics (only for the team member)
4. Option for team members to voluntarily share sub-tasks with TL

## Conclusion

The sub-task privacy feature provides team members with a personal workspace to organize their assigned tasks without oversight. This promotes autonomy, reduces micromanagement, and builds trust while maintaining accountability through main task status updates.

Team leads get what they need (task completion status) without unnecessary details about internal work organization. This creates a healthy balance between oversight and independence.
