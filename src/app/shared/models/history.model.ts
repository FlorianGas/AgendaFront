export interface HistoryAction {
  action: 'created' | 'updated' | 'canceled';
  date: string; // ISO string
  user: {
    _id: string;
    first_name: string;
    last_name: string;
    role: 'client' | 'professional';
  };
  description?: string;
}

export interface HistoryModel {
  _id: string;
  appointment_id: string;
  actions: HistoryAction[];
}

