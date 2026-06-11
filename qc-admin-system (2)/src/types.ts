export interface Floor {
  id: string;
  name: string;
}

export interface Cell {
  id: string;
  name: string;
  floorId: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Zone {
  id: string;
  x: number; // Center X for point, or calculated center for polygon/curve label
  y: number; // Center Y
  type?: 'Point' | 'Polygon' | 'Curve';
  points?: Point[];
  label: string;
  operationId: string | null;
  assignmentA: string | null;
  assignmentB: string | null;
}

export interface Product {
  id: string;
  name: string;
  cellId: string;
  imageUrl?: string;
  zones?: Zone[];
}

export interface Operation {
  id: string;
  name: string;
  productId: string;
}

export interface Worker {
  id: string;
  name: string;
  role: 'Tailor' | 'Quality Inspector';
  shift: 'Group A' | 'Group B';
  cellId: string | null;
}

export interface AppUser {
  id: string;
  username: string;
  role: 'Admin' | 'QI';
}

export interface DefectCause {
  id: string;
  name: string;
  type: 'In-Cell Process' | 'Raw Material';
}

export interface DefectRecord {
  id: string;
  date: string;
  timestamp: number;
  floorId: string;
  cellId: string;
  productId: string;
  shift: string;
  defectCauseId: string;
  workerId?: string;
  workerName: string;
  operationId?: string;
  operationName: string;
  quantity: number;
  qiName: string;
  markerX?: number;
  markerY?: number;
}

