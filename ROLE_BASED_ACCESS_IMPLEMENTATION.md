# Role-Based Access Control Implementation

## Overview
This document describes the complete role-based access control system implemented for the Project Tracker application.

## Role Hierarchy

### 1. INDIVIDUAL
- **Can create**: Projects (assigned to themselves), Tasks (assigned to themselves)
- **Cannot create**: Projects/Tasks for others
- **Can view**: Only their own projects and tasks
- **Special permissions**: Full control over their own items

### 2. MANAGER
- **Can create**: Projects (assigned to Team Leads), Tasks (assigned to Team Leads)
- **Cannot create**: Projects for Team Leads (TLs must be assigned by Manager)
- **Can view**: All projects and tasks in their organization
- **Special permissions**: Can delete any project/task in their organization

### 3. TEAM_LEAD
- **Can create**: Tasks (assigned to Team Members)
- **Cannot create**: Projects (only Managers can create and assign projects to TLs)
- **Can view**: Projects assigned to them, Tasks they created or assigned to their team members
- **Special permissions**: Can reassign tasks within their team

### 4. TEAM_MEMBER
- **Cannot create**: Projects or Tasks
- **Can create**: Sub-tasks for tasks assigned to them
- **Can view**: Only projects with tasks assigned to them, Tasks assigned to them
- **Special permissions**: Full control over their sub-tasks (create, update, delete)
- **Privacy**: Sub-tasks are completely private - Team Leads and Managers cannot see them
- **Status Reflection**: When team member marks the main task as DONE, this is what the Team Lead sees

## API Endpoints

### Projects API (`/api/projects`)

#### GET
Returns projects based on user role:
- **MANAGER**: All projects in their organization
- **TEAM_LEAD**: Projects assigned to them or in their organization
- **TEAM_MEMBER**: Projects that have tasks assigned to them
- **INDIVIDUAL**: Only their own projects

#### POST
Creates a new project:
- **MANAGER**: Must specify `assignedToId` (Team Lead from their org)
- **INDIVIDUAL**: Project auto-assigned to themselves
- **TEAM_LEAD**: ❌ Cannot create projects
- **TEAM_MEMBER**: ❌ Cannot create projects

#### DELETE
Deletes a project:
- **MANAGER**: Can delete any project in their organization
- **Owner**: Can delete their own projects
- **Others**: ❌ Unauthorized

### Tasks API (`/api/tasks`)

#### GET
Returns tasks based on user role:
- **MANAGER**: All tasks in their organization
- **TEAM_LEAD**: Tasks assigned to them or their team members, or tasks they created
- **TEAM_MEMBER**: Only tasks assigned to them
- **INDIVIDUAL**: Tasks they created or assigned to themselves

#### POST
Creates a new task:
- **MANAGER**: Must specify `assigneeId` (Team Lead from their org)
- **TEAM_LEAD**: Must specify `assigneeId` (Team Member from their team)
- **INDIVIDUAL**: Task auto-assigned to themselves
- **TEAM_MEMBER**: ❌ Cannot create tasks (can only create sub-tasks)

#### PUT
Updates a task (status or reassignment):
- Can update if: assignee, creator, or MANAGER/TEAM_LEAD role

### Sub-tasks API (`/api/subtasks`)

#### Privacy Model
**IMPORTANT**: Sub-tasks are completely private to the team member who is assigned to the parent task.
- Team Leads **CANNOT** see sub-tasks of their team members
- Managers **CANNOT** see sub-tasks
- Individual users **CANNOT** see sub-tasks
- Only the **assigned team member** can see and manage their own sub-tasks

This allows team members to break down tasks into smaller pieces without micromanagement.

#### GET
Returns sub-tasks for a parent task (only if requester is the assigned team member)

#### POST
Creates a new sub-task:
- **TEAM_MEMBER**: Can create sub-tasks for tasks assigned to them
- **Others**: ❌ Cannot create sub-tasks (use regular tasks instead)

#### PUT
Updates sub-task status:
- Only the assignee (TEAM_MEMBER) can update their own sub-tasks

#### DELETE
Deletes a sub-task:
- Only the creator (TEAM_MEMBER) can delete their own sub-tasks

### Assignable Users API (`/api/assignable-users`)

#### GET
Returns users that can be assigned projects/tasks:
- **MANAGER**: Returns all Team Leads in their organization
- **TEAM_LEAD**: Returns all Team Members under them
- **INDIVIDUAL**: Returns empty array
- **TEAM_MEMBER**: Returns empty array

## UI Components

### CreateProjectModal
- Fetches assignable users automatically
- Shows dropdown for MANAGER to select Team Lead
- Hides assignment for INDIVIDUAL (auto-assigned)
- Shows access denied message for TEAM_LEAD and TEAM_MEMBER

### CreateTaskModal
- Fetches assignable users automatically
- Shows dropdown for MANAGER to select Team Lead
- Shows dropdown for TEAM_LEAD to select Team Member
- Hides assignment for INDIVIDUAL (auto-assigned)
- Shows access denied message for TEAM_MEMBER

### ProjectTable
- Displays project information with assignee and creator
- Delete button only visible to MANAGER or project owner
- Role-specific empty state messages

### TaskTable
- Displays task information with full details
- Status dropdown only for authorized users
- Expandable sub-tasks section for TEAM_MEMBER
- Role-specific empty state messages

### SubTaskTable
- Only visible to TEAM_MEMBER when viewing their assigned tasks
- Create, update, and delete sub-tasks
- Status management for each sub-task

## User Flow Examples

### Manager Flow
1. Manager logs in
2. Views all projects in organization
3. Clicks "Create Project" button
4. Fills in project details
5. Selects Team Lead from dropdown (TL-1, TL-2, etc.)
6. Project appears in Team Lead's dashboard

### Team Lead Flow
1. Team Lead logs in
2. Views projects assigned by Manager
3. Clicks "Create Task" for a project
4. Fills in task details
5. Selects Team Member from dropdown
6. Task appears in Team Member's dashboard

### Team Member Flow
1. Team Member logs in
2. Views tasks assigned by Team Lead
3. Opens a task
4. Clicks to expand "My Sub-tasks" (marked as Private)
5. Creates sub-tasks to break down the main task
6. Updates sub-task status (TODO → IN_PROGRESS → DONE)
7. **Privacy**: Sub-tasks are completely private - Team Lead cannot see them
8. When all work is complete, marks the main task as DONE
9. Team Lead sees only the main task status change to DONE (not the sub-tasks)

### Individual Flow
1. Individual user logs in
2. Creates personal projects
3. Creates personal tasks
4. Manages own workflow independently

## Database Schema

### Key Relationships
- `Project.assignedToId` → `User.id` (who the project is assigned to)
- `Project.ownerId` → `User.id` (who created the project)
- `Task.assigneeId` → `User.id` (who the task is assigned to)
- `Task.creatorId` → `User.id` (who created the task)
- `Task.parentTaskId` → `Task.id` (for sub-tasks)
- `User.teamLeadId` → `User.id` (for TEAM_MEMBER → TEAM_LEAD relationship)
- `User.organizationId` → `Organization.id` (for organization membership)

## Error Handling

All API endpoints return proper error messages:
- `401 Unauthorized`: No valid token
- `403 Forbidden`: Insufficient permissions for the operation
- `400 Bad Request`: Missing required fields
- `404 Not Found`: Resource doesn't exist
- `500 Server Error`: Unexpected server error

## Security Considerations

1. **Server-side validation**: All permissions checked on server, not just client
2. **Token-based auth**: JWT tokens required for all API calls
3. **Role verification**: User role verified from database on each request
4. **Relationship validation**: Verifies org/team membership before allowing operations
5. **Sub-task Privacy**: Sub-tasks are filtered at the API level - never sent to unauthorized users
6. **Data Isolation**: Team members' sub-tasks are completely isolated from managers and team leads

## Testing Checklist

- [ ] INDIVIDUAL can create and manage their own projects
- [ ] INDIVIDUAL can create and manage their own tasks
- [ ] MANAGER can create projects and assign to Team Leads
- [ ] MANAGER can create tasks and assign to Team Leads
- [ ] MANAGER can view all organization data
- [ ] **MANAGER CANNOT see team members' sub-tasks**
- [ ] TEAM_LEAD cannot create projects (gets error)
- [ ] TEAM_LEAD can create tasks and assign to Team Members
- [ ] TEAM_LEAD can view assigned projects
- [ ] **TEAM_LEAD CANNOT see team members' sub-tasks**
- [ ] TEAM_MEMBER cannot create projects (gets error)
- [ ] TEAM_MEMBER cannot create tasks (gets error)
- [ ] TEAM_MEMBER can view assigned tasks only
- [ ] TEAM_MEMBER can create sub-tasks for assigned tasks
- [ ] TEAM_MEMBER can update sub-task status
- [ ] **TEAM_MEMBER's sub-tasks are private (not visible to TL/Manager)**
- [ ] When TEAM_MEMBER marks main task as DONE, Team Lead sees the status change
- [ ] Assignable users dropdown shows correct users per role
- [ ] Delete permissions work correctly
- [ ] Dashboard visibility works per role

## Files Modified/Created

### API Routes
- ✅ `/app/api/projects/route.ts` - Updated POST with role-based logic, added DELETE
- ✅ `/app/api/tasks/route.ts` - Added POST and PUT methods with role-based logic
- ✅ `/app/api/subtasks/route.ts` - Already had proper TEAM_MEMBER restrictions
- ✅ `/app/api/assignable-users/route.ts` - New endpoint for fetching assignable users

### Components
- ✅ `/app/components/modals/CreateProjectModal.tsx` - Complete rewrite with role-based UI
- ✅ `/app/components/modals/CreateTaskModal.tsx` - Complete rewrite with role-based UI
- ✅ `/app/components/ProjectTable.tsx` - Enhanced with better display and permissions
- ✅ `/app/components/TaskTable.tsx` - Enhanced with sub-task expansion and permissions
- ✅ `/app/components/SubTaskTable.tsx` - Enhanced with error handling and delete

### Pages
- ✅ `/app/projects/page.tsx` - Updated to use new modal and show role-based UI
- ✅ `/app/tasks/page.tsx` - Updated to use new modal and show role-based UI

### Database
- ✅ Schema already supports all required relationships
- ✅ No migration needed

## Deployment Notes

1. No database migration required
2. Existing data will work with new logic
3. Users may need to re-login to refresh their role in localStorage
4. Test with different role accounts before full deployment
