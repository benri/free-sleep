import { http, HttpResponse, delay } from 'msw';
import type { SleepRecord } from '@api/sleepSchema.ts';
import type { Jobs } from '@api/jobs.ts';
import {
  getServices,
  updateServices,
  getSchedules,
  updateSchedules,
  getSettings,
  updateSettings,
  getDeviceStatus,
  updateDeviceStatus,
  getServerStatus,
  listSleepRecords,
  setSleepRecords,
  listMovementRecords,
  listVitalsRecords,
  filterByQuery,
  listLogs,
  getLogFiles,
  handleJobs,
} from './mockData';

type Side = 'left' | 'right';

type Filters = {
  startTime?: string;
  endTime?: string;
  side?: Side;
};

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const toFilters = (request: Request): Filters => {
  const url = new URL(request.url);
  const startTime = url.searchParams.get('startTime') ?? undefined;
  const endTime = url.searchParams.get('endTime') ?? undefined;
  const sideParam = url.searchParams.get('side') ?? undefined;
  const side = sideParam === 'left' || sideParam === 'right' ? sideParam : undefined;
  return { startTime, endTime, side };
};

const notFound = (message: string) => HttpResponse.json({ message }, { status: 404 });

let mockUsers = [
  { id: 1, username: 'admin', role: 'admin', created_at: new Date().toISOString() },
];
let nextUserId = 2;

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const { username, password } = (await request.json()) as { username: string; password: string };
    await delay(200);
    if (username && password && password.length >= 6) {
      return HttpResponse.json({ token: 'mock-jwt-token' });
    }
    return HttpResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }),
  http.get('/api/auth/users', async () => {
    await delay(120);
    return HttpResponse.json(deepClone(mockUsers));
  }),
  http.post('/api/auth/users', async ({ request }) => {
    const { username, password } = (await request.json()) as { username: string; password: string };
    await delay(120);
    if (!username || !password || password.length < 6) {
      return HttpResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (mockUsers.some(u => u.username === username)) {
      return HttpResponse.json({ error: 'Username already exists' }, { status: 409 });
    }
    const user = { id: nextUserId++, username, role: 'admin', created_at: new Date().toISOString() };
    mockUsers.push(user);
    return HttpResponse.json(user, { status: 201 });
  }),
  http.delete('/api/auth/users/:id', async ({ params }) => {
    const id = Number(params.id);
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }
    mockUsers = mockUsers.filter(u => u.id !== id);
    await delay(80);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('/api/services', async () => {
    await delay(120);
    return HttpResponse.json(deepClone(getServices()));
  }),
  http.post('/api/services', async ({ request }) => {
    const body = (await request.json()) as Partial<ReturnType<typeof getServices>>;
    const updated = updateServices(body);
    await delay(120);
    return HttpResponse.json(deepClone(updated));
  }),
  http.get('/api/schedules', async () => {
    await delay(120);
    return HttpResponse.json(deepClone(getSchedules()));
  }),
  http.post('/api/schedules', async ({ request }) => {
    const body = (await request.json()) as Partial<ReturnType<typeof getSchedules>>;
    const updated = updateSchedules(body);
    await delay(120);
    return HttpResponse.json(deepClone(updated));
  }),
  http.get('/api/settings', async () => {
    await delay(120);
    return HttpResponse.json(deepClone(getSettings()));
  }),
  http.post('/api/settings', async ({ request }) => {
    const body = (await request.json()) as Partial<ReturnType<typeof getSettings>>;
    const updated = updateSettings(body);
    await delay(120);
    return HttpResponse.json(deepClone(updated));
  }),
  http.get('/api/deviceStatus', async () => {
    await delay(120);
    return HttpResponse.json(deepClone(getDeviceStatus()));
  }),
  http.post('/api/deviceStatus', async ({ request }) => {
    const body = (await request.json()) as Partial<ReturnType<typeof getDeviceStatus>>;
    updateDeviceStatus(body);
    await delay(120);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('/api/serverStatus', async () => {
    await delay(150);
    return HttpResponse.json(deepClone(getServerStatus()));
  }),
  http.get('/api/metrics/sleep', async ({ request }) => {
    const filters = toFilters(request);
    const records = listSleepRecords();
    // @ts-expect-error
    const filtered = filterByQuery(records, filters, (record: SleepRecord) => Date.parse(record.entered_bed_at));
    await delay(150);
    return HttpResponse.json(deepClone(filtered));
  }),
  http.delete('/api/metrics/sleep/:id', async ({ params }) => {
    const id = Number(params.id);
    const records = listSleepRecords();
    const next = records.filter((record) => record.id !== id);
    if (next.length === records.length) {
      return notFound('Sleep record not found');
    }
    setSleepRecords(next);
    await delay(80);
    return new HttpResponse(null, { status: 204 });
  }),
  http.put('/api/metrics/sleep/:id', async ({ params, request }) => {
    const id = Number(params.id);
    const updates = (await request.json()) as Partial<SleepRecord>;
    const records = deepClone(listSleepRecords());
    const index = records.findIndex((record) => record.id === id);
    if (index === -1) {
      return notFound('Sleep record not found');
    }
    const updatedRecord = { ...records[index], ...updates } satisfies SleepRecord;
    records[index] = updatedRecord;
    setSleepRecords(records);
    await delay(80);
    return HttpResponse.json(updatedRecord);
  }),
  http.get('/api/metrics/movement', async () => {
    // const filters = toFilters(request);
    const records = listMovementRecords();
    // const filtered = filterByQuery(records, filters, (record: MovementRecord) => record.timestamp * 1000);
    await delay(120);
    return HttpResponse.json(records);
  }),
  http.get('/api/metrics/vitals', async () => {
    // const filters = toFilters(request);
    const records = listVitalsRecords();
    // const filtered = filterByQuery(records, filters, (record: VitalsRecord) => record.timestamp * 1000);
    await delay(120);
    return HttpResponse.json(records);
  }),
  http.get('/api/metrics/vitals/summary', async () => {
    await delay(120);
    return HttpResponse.json({
      avgHeartRate: 55,
      minHeartRate: 45,
      maxHeartRate: 68,
      avgHRV: 63,
      avgBreathingRate: 12,
    });
  }),
  http.post('/api/jobs', async ({ request }) => {
    const jobs = (await request.json()) as Jobs;
    handleJobs(jobs);
    await delay(150);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('/api/logs', async () => {
    await delay(120);
    return HttpResponse.json({ logs: getLogFiles() });
  }),
  http.get('/api/logs/:filename', ({ params }) => {
    const filename = params.filename as string;
    const logStore = listLogs();
    const initialLogs = deepClone(logStore[filename] ?? []);
    if (!logStore[filename]) {

      // @ts-expect-error
      return HttpResponse.eventStream({
        // @ts-expect-error
        open(controller) {
          controller.send({ data: JSON.stringify({ message: 'Log file not found' }) });
          controller.close();
        },
      });
    }

    // @ts-expect-error
    return HttpResponse.eventStream({
      headers: {
        'Cache-Control': 'no-cache',
      },
      // @ts-expect-error
      open(controller) {
        initialLogs.forEach((entry) => {
          controller.send({ data: JSON.stringify({ message: entry }) });
        });
        let lastIndex = initialLogs.length;
        const interval = setInterval(() => {
          const latest = listLogs()[filename] ?? [];
          if (latest.length > lastIndex) {
            latest.slice(lastIndex).forEach((entry) => {
              controller.send({ data: JSON.stringify({ message: entry }) });
            });
            lastIndex = latest.length;
          }
        }, 2000);

        return () => clearInterval(interval);
      },
    });
  }),
];

