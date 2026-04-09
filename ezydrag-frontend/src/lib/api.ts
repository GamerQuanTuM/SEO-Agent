import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

export const fetchTechnicalData = async (companyId?: string) => {
  const res = await api.get('/technical', { params: { company_id: companyId } });
  return res.data;
};

export const fetchOnPageData = async (companyId?: string) => {
  const res = await api.get('/onpage', { params: { company_id: companyId } });
  return res.data;
};

export const fetchOffPageData = async (companyId?: string) => {
  const res = await api.get('/offpage', { params: { company_id: companyId } });
  return res.data;
};

export const fetchContentData = async (companyId?: string) => {
  const res = await api.get('/content', { params: { company_id: companyId } });
  return res.data;
};

export const triggerAudit = async (data: { url: string; client_name: string }) => {
  const res = await api.post('/audit', data);
  return res.data;
};

export const fetchCompanies = async () => {
  const res = await api.get('/companies');
  return res.data;
};

export const addCompany = async (data: { name: string; domain: string; competitors?: string[] }) => {
  const res = await api.post('/companies', data);
  return res.data;
};

export const deleteCompany = async (companyId: string) => {
  const res = await api.delete(`/companies/${companyId}`);
  return res.data;
};

export const fetchHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};
