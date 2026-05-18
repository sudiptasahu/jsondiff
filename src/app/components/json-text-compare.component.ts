import { Component } from '@angular/core';
import { JsonValue } from '../json-diff.models';

@Component({
  selector: 'app-json-text-compare',
  templateUrl: './json-text-compare.component.html',
  styleUrls: ['./compare-pages.component.css']
})
export class JsonTextCompareComponent {
  jsonA = '{\n  "name": "Sudipta",\n  "age": 27,\n  "sex": "male"\n}';
  jsonB = '{\n  "name": "Unknown",\n  "dob": "31-03-1981",\n  "sex": "male"\n}';
  errorMessage = '';
  fileNameA = '';
  fileNameB = '';
  responseA: JsonValue | undefined;
  responseB: JsonValue | undefined;

  compareJson(): void {
    this.errorMessage = '';
    this.responseA = undefined;
    this.responseB = undefined;

    try {
      this.responseA = JSON.parse(this.jsonA) as JsonValue;
    } catch (error) {
      this.errorMessage = `JSON A is invalid. ${this.getErrorMessage(error)}`;
      return;
    }

    try {
      this.responseB = JSON.parse(this.jsonB) as JsonValue;
    } catch (error) {
      this.errorMessage = `JSON B is invalid. ${this.getErrorMessage(error)}`;
      this.responseA = undefined;
      return;
    }
  }

  onFileSelected(event: Event, side: 'A' | 'B'): void {
    this.errorMessage = '';

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.readJsonFile(file)
      .then((fileText) => {
        if (side === 'A') {
          this.jsonA = fileText;
          this.fileNameA = file.name;
          return;
        }

        this.jsonB = fileText;
        this.fileNameB = file.name;
      })
      .catch((error) => {
        this.errorMessage = `Could not load ${file.name}. ${this.getErrorMessage(error)}`;
      });
  }

  private readJsonFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const content = String(reader.result ?? '');

        try {
          JSON.parse(content);
          resolve(content);
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
