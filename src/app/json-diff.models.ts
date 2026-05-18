export type DiffKind = 'equal' | 'added' | 'removed' | 'modified';
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type DiffFilter = 'all' | 'modified' | 'added' | 'removed' | 'none';
export type JsonSide = 'left' | 'right';
export type LineKind = 'open' | 'close' | 'property';
export type LineStatus = 'normal' | 'added' | 'removed';
export type ValueStatus = 'normal' | 'modified';

export interface DiffNode {
  key: string;
  kind: DiffKind;
  valueType: 'primitive' | 'object' | 'array';
  leftValue: JsonValue | undefined;
  rightValue: JsonValue | undefined;
  children: DiffNode[];
}

export interface DiffEntry {
  path: string;
  kind: Exclude<DiffKind, 'equal'>;
  leftValue: JsonValue | undefined;
  rightValue: JsonValue | undefined;
}

export interface PrettyJsonLine {
  kind: LineKind;
  level: number;
  text?: string;
  keyText?: string;
  valueText?: string;
  comma: boolean;
  status: LineStatus;
  valueStatus: ValueStatus;
}

export interface DiffResult {
  diffTree: DiffNode;
  diffEntries: DiffEntry[];
  responseLinesA: PrettyJsonLine[];
  responseLinesB: PrettyJsonLine[];
}
