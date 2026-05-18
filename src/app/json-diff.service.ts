import { Injectable } from '@angular/core';
import { DiffEntry, DiffNode, DiffResult, JsonSide, JsonValue, LineStatus, PrettyJsonLine } from './json-diff.models';

@Injectable({
  providedIn: 'root'
})
export class JsonDiffService {
  compare(leftValue: JsonValue, rightValue: JsonValue): DiffResult {
    const diffTree = this.buildDiffNode('root', leftValue, rightValue);

    return {
      diffTree,
      diffEntries: this.collectDiffEntries(diffTree),
      responseLinesA: this.buildPrettyJsonLines(diffTree, 'left'),
      responseLinesB: this.buildPrettyJsonLines(diffTree, 'right')
    };
  }

  private buildDiffNode(key: string, leftValue: JsonValue | undefined, rightValue: JsonValue | undefined): DiffNode {
    if (leftValue === undefined) {
      return {
        key,
        kind: 'added',
        valueType: this.getValueType(rightValue),
        leftValue,
        rightValue,
        children: this.buildChildren(undefined, rightValue)
      };
    }

    if (rightValue === undefined) {
      return {
        key,
        kind: 'removed',
        valueType: this.getValueType(leftValue),
        leftValue,
        rightValue,
        children: this.buildChildren(leftValue, undefined)
      };
    }

    const leftType = this.getValueType(leftValue);
    const rightType = this.getValueType(rightValue);

    if (leftType !== rightType) {
      return {
        key,
        kind: 'modified',
        valueType: 'primitive',
        leftValue,
        rightValue,
        children: []
      };
    }

    if (leftType === 'primitive') {
      return {
        key,
        kind: this.isEqual(leftValue, rightValue) ? 'equal' : 'modified',
        valueType: 'primitive',
        leftValue,
        rightValue,
        children: []
      };
    }

    const childKeys = this.collectChildKeys(leftValue, rightValue);
    const children = childKeys.map((childKey) =>
      this.buildDiffNode(
        childKey,
        this.readChildValue(leftValue, childKey),
        this.readChildValue(rightValue, childKey)
      )
    );

    return {
      key,
      kind: children.every((child) => child.kind === 'equal') ? 'equal' : 'modified',
      valueType: leftType,
      leftValue,
      rightValue,
      children
    };
  }

  private buildChildren(leftValue: JsonValue | undefined, rightValue: JsonValue | undefined): DiffNode[] {
    const candidate = leftValue ?? rightValue;
    const valueType = this.getValueType(candidate);

    if (valueType === 'primitive' || candidate === undefined) {
      return [];
    }

    return this.collectChildKeys(leftValue, rightValue).map((childKey) =>
      this.buildDiffNode(
        childKey,
        this.readChildValue(leftValue, childKey),
        this.readChildValue(rightValue, childKey)
      )
    );
  }

  private collectChildKeys(leftValue: JsonValue | undefined, rightValue: JsonValue | undefined): string[] {
    const source = leftValue ?? rightValue;

    if (Array.isArray(source)) {
      const leftLength = Array.isArray(leftValue) ? leftValue.length : 0;
      const rightLength = Array.isArray(rightValue) ? rightValue.length : 0;
      return Array.from({ length: Math.max(leftLength, rightLength) }, (_, index) => `${index}`);
    }

    const keys = new Set<string>([
      ...this.objectKeys(leftValue),
      ...this.objectKeys(rightValue)
    ]);

    return Array.from(keys).sort((first, second) => first.localeCompare(second));
  }

  private objectKeys(value: JsonValue | undefined): string[] {
    if (this.getValueType(value) !== 'object') {
      return [];
    }

    return Object.keys(value as { [key: string]: JsonValue });
  }

  private readChildValue(value: JsonValue | undefined, key: string): JsonValue | undefined {
    if (Array.isArray(value)) {
      const index = Number(key);
      return index < value.length ? value[index] : undefined;
    }

    if (this.getValueType(value) === 'object') {
      return (value as { [key: string]: JsonValue })[key];
    }

    return undefined;
  }

  private getValueType(value: JsonValue | undefined): 'primitive' | 'object' | 'array' {
    if (Array.isArray(value)) {
      return 'array';
    }

    if (value !== null && typeof value === 'object' && value !== undefined) {
      return 'object';
    }

    return 'primitive';
  }

  private isEqual(leftValue: JsonValue, rightValue: JsonValue): boolean {
    return JSON.stringify(leftValue) === JSON.stringify(rightValue);
  }

  private collectDiffEntries(node: DiffNode, parentPath = ''): DiffEntry[] {
    const currentPath = parentPath
      ? this.joinPath(parentPath, node.key)
      : node.key === 'root'
        ? ''
        : node.key;

    if (node.children.length === 0) {
      if (node.kind === 'equal') {
        return [];
      }

      return [{
        path: currentPath || 'root',
        kind: node.kind,
        leftValue: node.leftValue,
        rightValue: node.rightValue
      }];
    }

    if ((node.kind === 'added' || node.kind === 'removed') && currentPath) {
      return [{
        path: currentPath,
        kind: node.kind,
        leftValue: node.leftValue,
        rightValue: node.rightValue
      }];
    }

    return node.children.flatMap((child) => this.collectDiffEntries(child, currentPath));
  }

  private joinPath(parentPath: string, key: string): string {
    if (/^\d+$/.test(key)) {
      return `${parentPath}[${key}]`;
    }

    return parentPath ? `${parentPath}.${key}` : key;
  }

  private buildPrettyJsonLines(node: DiffNode, side: JsonSide): PrettyJsonLine[] {
    if (node.valueType === 'primitive') {
      return [{
        kind: 'property',
        level: 0,
        valueText: this.formatPrimitive(side === 'left' ? node.leftValue : node.rightValue),
        comma: false,
        status: 'normal',
        valueStatus: node.kind === 'modified' ? 'modified' : 'normal'
      }];
    }

    return this.buildContainerLines(node, side, 0, true);
  }

  private buildContainerLines(
    node: DiffNode,
    side: JsonSide,
    level: number,
    isRoot = false,
    forceStatus: LineStatus = 'normal'
  ): PrettyJsonLine[] {
    const lines: PrettyJsonLine[] = [{
      kind: 'open',
      level,
      text: node.valueType === 'array' ? '[' : '{',
      comma: false,
      status: forceStatus,
      valueStatus: 'normal'
    }];

    const visibleChildren = node.children.filter((child) => this.shouldRenderChild(child, side));

    visibleChildren.forEach((child, index) => {
      const childForceStatus = this.getLineStatus(child, side);
      const isLast = index === visibleChildren.length - 1;

      if (child.valueType === 'primitive') {
        lines.push({
          kind: 'property',
          level: level + 1,
          keyText: node.valueType === 'object' ? JSON.stringify(child.key) : undefined,
          valueText: this.formatPrimitive(side === 'left' ? child.leftValue : child.rightValue),
          comma: !isLast,
          status: childForceStatus,
          valueStatus: child.kind === 'modified' ? 'modified' : 'normal'
        });
        return;
      }

      const childLines = this.buildContainerLines(child, side, level + 1, false, childForceStatus);

      if (node.valueType === 'object') {
        childLines[0] = {
          ...childLines[0],
          keyText: JSON.stringify(child.key)
        };
      }

      childLines[childLines.length - 1] = {
        ...childLines[childLines.length - 1],
        comma: !isLast
      };

      lines.push(...childLines);
    });

    lines.push({
      kind: 'close',
      level,
      text: node.valueType === 'array' ? ']' : '}',
      comma: false,
      status: isRoot ? 'normal' : forceStatus,
      valueStatus: 'normal'
    });

    return lines;
  }

  private shouldRenderChild(node: DiffNode, side: JsonSide): boolean {
    if (node.kind === 'added' && side === 'left') {
      return false;
    }

    if (node.kind === 'removed' && side === 'right') {
      return false;
    }

    return true;
  }

  private getLineStatus(node: DiffNode, side: JsonSide): LineStatus {
    if (node.kind === 'added' && side === 'right') {
      return 'added';
    }

    if (node.kind === 'removed' && side === 'left') {
      return 'removed';
    }

    return 'normal';
  }

  private formatPrimitive(value: JsonValue | undefined): string {
    if (value === undefined) {
      return 'undefined';
    }

    return JSON.stringify(value);
  }
}
