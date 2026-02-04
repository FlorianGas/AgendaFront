export interface TimesSlotModel {
  _id?: string;
  start_time : Date;
  end_time : Date;
  is_available : boolean;
}

export interface AvailabilityModel {
  _id?: string;
  professional_id: string;
  availability: TimesSlotModel[];
  created_at?: Date;
  updated_at?: Date;
}
