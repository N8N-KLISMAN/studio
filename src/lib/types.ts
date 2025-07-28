export interface Competitor {
  id: string;
  name: string;
}

export interface Station {
  id: string;
  name: string;
  competitors: Competitor[];
}
