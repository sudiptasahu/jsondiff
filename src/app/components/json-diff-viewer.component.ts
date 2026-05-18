import { Component, Input, OnChanges } from '@angular/core';
import { DiffEntry, DiffFilter, DiffResult, JsonValue, PrettyJsonLine } from '../json-diff.models';
import { JsonDiffService } from '../json-diff.service';

@Component({
  selector: 'app-json-diff-viewer',
  templateUrl: './json-diff-viewer.component.html',
  styleUrls: ['./json-diff-viewer.component.css']
})
export class JsonDiffViewerComponent implements OnChanges {
  @Input() leftValue: JsonValue | undefined;
  @Input() rightValue: JsonValue | undefined;
  @Input() leftTitle = 'Response A';
  @Input() rightTitle = 'Response B';
  @Input() leftSubtitle = '';
  @Input() rightSubtitle = '';

  diffEntries: DiffEntry[] = [];
  responseLinesA: PrettyJsonLine[] = [];
  responseLinesB: PrettyJsonLine[] = [];
  activeDiffFilter: DiffFilter = 'none';

  constructor(private readonly jsonDiffService: JsonDiffService) {}

  ngOnChanges(): void {
    if (this.leftValue === undefined || this.rightValue === undefined) {
      this.resetState();
      return;
    }

    const result: DiffResult = this.jsonDiffService.compare(this.leftValue, this.rightValue);
    this.diffEntries = result.diffEntries;
    this.responseLinesA = result.responseLinesA;
    this.responseLinesB = result.responseLinesB;
    this.activeDiffFilter = 'none';
  }

  trackByPrettyLine(index: number, line: PrettyJsonLine): string {
    return `${index}-${line.kind}-${line.keyText ?? line.text ?? ''}`;
  }

  trackByDiffEntry(_: number, entry: DiffEntry): string {
    return `${entry.path}-${entry.kind}`;
  }

  setDiffFilter(filter: DiffFilter): void {
    this.activeDiffFilter = this.activeDiffFilter === filter ? 'none' : filter;
  }

  getFilteredDiffEntries(): DiffEntry[] {
    if (this.activeDiffFilter === 'none') {
      return [];
    }

    if (this.activeDiffFilter === 'all') {
      return this.diffEntries;
    }

    return this.diffEntries.filter((entry) => entry.kind === this.activeDiffFilter);
  }

  getDiffCount(kind: Exclude<DiffEntry['kind'], never>): number {
    return this.diffEntries.filter((entry) => entry.kind === kind).length;
  }

  formatValue(value: JsonValue | undefined): string {
    if (value === undefined) {
      return 'undefined';
    }

    return JSON.stringify(value, null, 2);
  }

  private resetState(): void {
    this.diffEntries = [];
    this.responseLinesA = [];
    this.responseLinesB = [];
    this.activeDiffFilter = 'none';
  }
}
