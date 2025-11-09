const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface TaskLike {
  status?: string | null;
  dueDate?: string | Date | null;
}

export interface RiskResult {
  riskScore: number | null;
  isOverdue: boolean;
  dueInDays: number | null;
  overdueDays: number | null;
  severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

function parseDueDate(dueDate?: string | Date | null): Date | null {
  if (!dueDate) return null;
  if (dueDate instanceof Date) {
    return isNaN(dueDate.getTime()) ? null : dueDate;
  }

  const parsed = new Date(dueDate);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function calculateTaskRisk(task: TaskLike, now: Date = new Date()): RiskResult {
  const status = (task?.status || "").toUpperCase();
  const dueDate = parseDueDate(task?.dueDate);

  if (status === "DONE") {
    return {
      riskScore: 0,
      isOverdue: false,
      dueInDays: dueDate ? Math.max(0, Math.ceil((dueDate.getTime() - now.getTime()) / MS_PER_DAY)) : null,
      overdueDays: null,
      severity: "NONE",
    };
  }

  let risk = 0;

  if (status === "BLOCKED") {
    risk = 0.7;
  } else if (status === "IN_PROGRESS") {
    risk = 0.35;
  } else if (status === "TODO") {
    risk = 0.2;
  }

  let isOverdue = false;
  let dueInDays: number | null = null;
  let overdueDays: number | null = null;

  if (dueDate) {
    const diffDays = (dueDate.getTime() - now.getTime()) / MS_PER_DAY;

    if (diffDays < 0) {
      isOverdue = true;
      overdueDays = Math.ceil(Math.abs(diffDays));
      risk = 1;
    } else {
      dueInDays = Math.ceil(diffDays);
      if (diffDays <= 1) {
        risk = Math.max(risk, 0.9);
      } else if (diffDays <= 3) {
        risk = Math.max(risk, 0.7);
      } else if (diffDays <= 7) {
        risk = Math.max(risk, 0.5);
      } else if (diffDays <= 14) {
        risk = Math.max(risk, 0.3);
      }
    }
  } else {
    // No due date but not done. Keep at least a baseline if the task is blocked or still pending.
    if (status === "BLOCKED") {
      risk = Math.max(risk, 0.65);
    } else {
      risk = Math.max(risk, 0.25);
    }
  }

  risk = Math.min(1, Math.max(0, risk));
  const roundedRisk = Number(risk.toFixed(2));

  const severity: RiskResult["severity"] =
    roundedRisk >= 0.85
      ? "CRITICAL"
      : roundedRisk >= 0.65
      ? "HIGH"
      : roundedRisk >= 0.4
      ? "MEDIUM"
      : roundedRisk > 0
      ? "LOW"
      : "NONE";

  return {
    riskScore: roundedRisk,
    isOverdue,
    dueInDays,
    overdueDays,
    severity,
  };
}

export function summarizeRisks(tasks: TaskLike[], now: Date = new Date()) {
  let overdue = 0;
  let dueSoon = 0;
  let highRisk = 0;

  tasks.forEach((task) => {
    const { riskScore, isOverdue, dueInDays } = calculateTaskRisk(task, now);

    if (isOverdue) overdue += 1;
    if (!isOverdue && typeof dueInDays === "number" && dueInDays <= 3) dueSoon += 1;
    if ((riskScore ?? 0) >= 0.8) highRisk += 1;
  });

  return { overdue, dueSoon, highRisk };
}
