// ramsriprasaath's CODE — Central Type Definitions for AI Project Tracker

/* ------------------------------------------------------------------
 🧭 ENUMS — App-wide Manual Enum Definitions
 These mirror your Prisma schema enums, but are frontend-safe.
 ------------------------------------------------------------------ */

export enum UserRole {
  INDIVIDUAL = "INDIVIDUAL",
  MANAGER = "MANAGER",
  TEAM_LEAD = "TEAM_LEAD",
  TEAM_MEMBER = "TEAM_MEMBER",
}

export enum TaskState {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  BLOCKED = "BLOCKED",
}

/* ------------------------------------------------------------------
 👤 USER TYPES
 ------------------------------------------------------------------ */

export interface IUser {
  id: string;
  name?: string | null;
  email: string;
  role: UserRole | string;
  organizationId?: string | null;
  organization?: { id: string; name: string } | null;
  projectsOwned?: { id: string; title: string }[];
  tasksAssigned?: Array<{
    id: string;
    title: string;
    status: string;
    project: { title: string };
  }>;
  tlIdWithinOrg?: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/* ------------------------------------------------------------------
 📦 PROJECT TYPES
 ------------------------------------------------------------------ */

export interface IProject {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/* ------------------------------------------------------------------
 🧩 TASK TYPES
 ------------------------------------------------------------------ */

export interface ITask {
  id: string;
  title: string;
  description?: string | null;
  status: TaskState;
  assigneeId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/* ------------------------------------------------------------------
 🔐 AUTH TYPES
 ------------------------------------------------------------------ */

export interface IAuthPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface IApiResponse<T = any> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
}
