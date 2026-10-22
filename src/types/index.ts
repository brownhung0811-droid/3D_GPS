export type RegionType = 'North' | 'Central' | 'South' | 'East' | 'Islands';
export type RegionZh = '北部' | '中部' | '南部' | '東部' | '離島';

export type CategoryType = 'Nature' | 'Coast' | 'Culture' | 'Landmark' | 'Food';
export type CategoryZh = '山林景觀' | '海岸海島' | '人文古蹟' | '休閒樂園' | '夜市美食';

export interface Spot {
  id: string; // e.g. 'TW-NORTH-01'
  name: string;
  englishName: string;
  region: RegionType;
  regionZh: RegionZh;
  county: string;
  category: CategoryType;
  categoryZh: CategoryZh;
  lat: number;
  lng: number;
  pos3D: [number, number, number];
  elevation: string;
  rating: number;
  bestSeason: string;
  highlights: string[];
  description: string;
  history: string;
  localFood: string;
  svgTheme: 'skyline' | 'mountain' | 'sea' | 'temple' | 'market' | 'lake' | 'forest';
  aiTips: {
    photoSpot: string;
    crowdAvoidance: string;
    localSecret: string;
  };
}

export interface StampRecord {
  spotId: string;
  stampedAt: string;
}

export type LightMode = 'day' | 'sunset' | 'night';
export type ViewMode = '3D' | '2D';

export interface ExplorerTitle {
  title: string;
  englishTitle: string;
  min: number;
  max: number;
  color: string;
  desc: string;
}
