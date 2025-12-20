export type MarketType =
  | "OVER_0_5"
  | "OVER_1_5"
  | "OVER_2_5"
  | "OVER_3_5"
  | "OVER_4_5"
  | "UNDER_0_5"
  | "UNDER_1_5"
  | "UNDER_2_5"
  | "UNDER_3_5"
  | "UNDER_4_5"
  | "UNDER_5_5"
  | "DC_1X"
  | "DC_X2"
  | "DC_12";

export type NextMatchWindow = "today" | "j1" | "j2" | "j3";

export type TeamResult = {
  id: number;
  name: string;
  logo?: string | null;
  league: string;
  nextMatchDate: string; // ISO date
  opponent: string;
  market: MarketType;
  probGreen: number;
  probBlue: number;
  aboveAverage?: boolean;
};

export type SearchFilters = {
  nextMatch: NextMatchWindow;
  markets: MarketType[];
  probGreenMin: number;
  probGreenMax: number;
  probBlueMin: number;
  probBlueMax: number;
  useBlue?: boolean;
};
