import axios from 'axios';
import type { PaymentRecord, MetricsSummary, AuditLogEntry } from './types';

const API_URL = 'http://localhost:8000/api';

export const generateBatch = async () => {
  const res = await axios.get(`${API_URL}/batch/generate`);
  return res.data;
};

export const runBatch = async () => {
  const res = await axios.post(`${API_URL}/batch/run`);
  return res.data;
};

export const getSummary = async (): Promise<MetricsSummary> => {
  const res = await axios.get(`${API_URL}/results/summary`);
  return res.data;
};

export const getAuditLog = async (): Promise<{logs: AuditLogEntry[]}> => {
  const res = await axios.get(`${API_URL}/results/audit-log`);
  return res.data;
};

export const getDecisionTree = async (): Promise<{mermaid: string}> => {
  const res = await axios.get(`${API_URL}/results/decision-tree`);
  return res.data;
};

export const runSingleDemo = async (cause: string = 'BANK_DOWNTIME') => {
  const res = await axios.post(`${API_URL}/demo/run-single?cause=${cause}`);
  return res.data;
};
