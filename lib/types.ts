export type Series = "cup"; // extend later

export type Bracket = 1 | 2 | 3 | 4; // 1-8, 9-16, 17-24, 25+

export type Race = {
  id: string; // internal uuid
  season: number;
  series: Series;
  race_id_external: number; // NASCAR race id for feeds
  name: string;
  start_time_utc: string; // ISO string
  green_flag_utc?: string | null; // if you have it
  picks_lock_utc: string; // start_time - 15min
  status: "scheduled" | "qualifying" | "running" | "finished";
};

export type DriverResult = {
  race_id: string;
  driver_name: string;
  car_number?: string | null;
  qual_pos?: number | null;
  finish_pos?: number | null;
  running_pos?: number | null;
  bracket?: Bracket | null;
};

export type Pick = {
  race_id: string;
  player_name: string;
  driver_name: string;
  created_at: string;
};
