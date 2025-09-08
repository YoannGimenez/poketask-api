import prisma from "../../lib/prisma";
import { regenerateExpiredTasks } from "../../service/taskRecreateService";
import { TaskStatus, TaskType } from "../../../generated/prisma";

// On mock Prisma
jest.mock("../../lib/prisma", () => ({
  task: {
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
}));

describe("Task Regeneration Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});   // évite le bruit des logs
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("ne régénère rien si aucune tâche trouvée", async () => {
    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

    const result = await regenerateExpiredTasks();

    expect(result).toEqual({
      processed: 0,
      regenerated: 0,
      errors: 0,
    });
    expect(prisma.task.create).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
        "Régénération terminée: 0 tâches traitées, 0 régénérées, 0 erreurs"
    );
  });

  it("ne recrée pas une tâche si elle n'est pas expirée", async () => {
    const futureTask = {
      id: "2",
      title: "Future task",
      description: "desc",
      type: TaskType.DAILY,
      difficulty: "EASY",
      userId: "user-123",
      dateEnd: new Date("2999-01-01T23:59:59Z"),
      timezone: "Europe/Paris",
      status: TaskStatus.PENDING,
    };

    (prisma.task.findMany as jest.Mock)
        .mockResolvedValueOnce([futureTask])
        .mockResolvedValueOnce([]);

    const result = await regenerateExpiredTasks();

    expect(result.processed).toBe(1);
    expect(result.regenerated).toBe(0);
    expect(result.errors).toBe(0);

    expect(prisma.task.create).not.toHaveBeenCalled();
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it("régénère une tâche expirée", async () => {
    const fakeTask = {
      id: "1",
      title: "Tâche test",
      description: "desc",
      type: TaskType.DAILY,
      difficulty: "EASY",
      userId: "user-123",
      dateEnd: new Date("2023-01-01T23:59:59Z"),
      timezone: "Europe/Paris",
      status: TaskStatus.PENDING,
    };

    (prisma.task.findMany as jest.Mock)
        .mockResolvedValueOnce([fakeTask])
        .mockResolvedValueOnce([]);

    (prisma.task.create as jest.Mock).mockResolvedValue({
      ...fakeTask,
      id: "new-123",
      status: TaskStatus.PENDING,
    });

    (prisma.task.update as jest.Mock).mockResolvedValue({
      ...fakeTask,
      status: TaskStatus.EXPIRED,
    });

    const result = await regenerateExpiredTasks();

    expect(result.processed).toBe(1);
    expect(result.regenerated).toBe(1);
    expect(result.errors).toBe(0);

    expect(prisma.task.create).toHaveBeenCalledTimes(1);
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { status: TaskStatus.EXPIRED },
    });
  });

  it("compte les erreurs si une tâche échoue", async () => {
    const fakeTask = {
      id: "1",
      title: "Erreur task",
      description: "desc",
      type: TaskType.DAILY,
      difficulty: "EASY",
      userId: "user-123",
      dateEnd: new Date("2023-01-01T23:59:59Z"),
      timezone: "Europe/Paris",
      status: TaskStatus.PENDING,
    };

    (prisma.task.findMany as jest.Mock)
        .mockResolvedValueOnce([fakeTask])
        .mockResolvedValueOnce([]);

    (prisma.task.create as jest.Mock).mockRejectedValue(new Error("DB error"));

    const result = await regenerateExpiredTasks();

    expect(result.processed).toBe(1);
    expect(result.regenerated).toBe(0);
    expect(result.errors).toBe(1);

    expect(console.error).toHaveBeenCalledWith(
        "Erreur lors du traitement de la tâche 1:",
        expect.any(Error)
    );
  });

  it("gère plusieurs tâches avec succès et erreurs mélangés", async () => {
    const expired1 = {
      id: "a",
      title: "Tâche A",
      description: "desc",
      type: TaskType.DAILY,
      difficulty: "EASY",
      userId: "user-1",
      dateEnd: new Date("2020-01-01T23:59:59Z"),
      timezone: "Europe/Paris",
      status: TaskStatus.PENDING,
    };

    const expired2 = {
      id: "b",
      title: "Tâche B",
      description: "desc",
      type: TaskType.DAILY,
      difficulty: "EASY",
      userId: "user-2",
      dateEnd: new Date("2020-01-01T23:59:59Z"),
      timezone: "Europe/Paris",
      status: TaskStatus.PENDING,
    };

    (prisma.task.findMany as jest.Mock)
        .mockResolvedValueOnce([expired1, expired2])
        .mockResolvedValueOnce([]);

    (prisma.task.create as jest.Mock)
        .mockResolvedValueOnce({ ...expired1, id: "new-a" })
        .mockRejectedValueOnce(new Error("DB error"));

    (prisma.task.update as jest.Mock).mockResolvedValue({ ...expired1, status: TaskStatus.EXPIRED });

    const result = await regenerateExpiredTasks();

    expect(result.processed).toBe(2);
    expect(result.regenerated).toBe(1);
    expect(result.errors).toBe(1);
  });

  it("gère une erreur globale lors du traitement du batch", async () => {
    (prisma.task.findMany as jest.Mock).mockRejectedValueOnce(new Error("DB down"));

    const result = await regenerateExpiredTasks();

    expect(result.errors).toBe(1);
    expect(console.error).toHaveBeenCalledWith(
        "Erreur lors du traitement du batch:",
        expect.any(Error)
    );
  });
});
