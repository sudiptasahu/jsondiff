import { Component } from '@angular/core';
import { JsonValue } from '../json-diff.models';

@Component({
  selector: 'app-json-file-compare',
  templateUrl: './json-file-compare.component.html',
  styleUrls: ['./compare-pages.component.css']
})
export class JsonFileCompareComponent {
  fileNameA = '';
  fileNameB = '';
  errorMessage = '';
  responseA: JsonValue | undefined;
  responseB: JsonValue | undefined;

  onFileSelected(event: Event, side: 'A' | 'B'): void {
    this.errorMessage = '';

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.readJsonFile(file)
      .then((jsonValue) => {
        if (side === 'A') {
          this.responseA = jsonValue;
          this.fileNameA = file.name;
          return;
        }

        this.responseB = jsonValue;
        this.fileNameB = file.name;
      })
      .catch((error) => {
        this.errorMessage = `Could not read file ${file.name}. ${this.getErrorMessage(error)}`;
      });
  }

  private readJsonFile(file: File): Promise<JsonValue> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          resolve(JSON.parse(String(reader.result)) as JsonValue);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error ?? new Error('Unknown file read error'));
      reader.readAsText(file);
    });
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
