import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { forkJoin } from 'rxjs';
import { JsonValue } from '../json-diff.models';

type HttpMethod = 'GET' | 'POST';

@Component({
  selector: 'app-api-compare',
  templateUrl: './api-compare.component.html',
  styleUrls: ['./compare-pages.component.css']
})
export class ApiCompareComponent {
  endpointA = 'https://dummyjson.com/products/1';
  endpointB = 'https://dummyjson.com/products/2';
  httpMethod: HttpMethod = 'GET';
  authToken = '';
  requestBody = '{\n  \n}';
  isLoading = false;
  errorMessage = '';
  responseA: JsonValue | undefined;
  responseB: JsonValue | undefined;

  constructor(private readonly http: HttpClient) {}

  compareResponses(): void {
    this.errorMessage = '';
    this.responseA = undefined;
    this.responseB = undefined;

    if (!this.endpointA.trim() || !this.endpointB.trim()) {
      this.errorMessage = 'Both REST endpoint URLs are required.';
      return;
    }

    const parsedBody = this.parseRequestBody();

    if (parsedBody === null && this.httpMethod === 'POST') {
      return;
    }

    this.isLoading = true;

    forkJoin({
      responseA: this.sendRequest(this.endpointA.trim(), parsedBody),
      responseB: this.sendRequest(this.endpointB.trim(), parsedBody)
    }).subscribe({
      next: ({ responseA, responseB }) => {
        this.responseA = responseA;
        this.responseB = responseB;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = this.getHttpError(error);
        this.isLoading = false;
      }
    });
  }

  beautifyRequestBody(): void {
    if (this.httpMethod === 'GET') {
      return;
    }

    try {
      const parsed = JSON.parse(this.requestBody || '{}') as JsonValue;
      this.requestBody = JSON.stringify(parsed, null, 2);
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = `Request body must be valid JSON. ${this.getErrorMessage(error)}`;
    }
  }

  private sendRequest(url: string, body: JsonValue | null) {
    const token = this.authToken.trim();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    if (this.httpMethod === 'GET') {
      return this.http.get<JsonValue>(url, { headers });
    }

    return this.http.post<JsonValue>(url, body, { headers });
  }

  private parseRequestBody(): JsonValue | null {
    if (this.httpMethod === 'GET') {
      return null;
    }

    try {
      return JSON.parse(this.requestBody || '{}') as JsonValue;
    } catch (error) {
      this.errorMessage = `Request body must be valid JSON. ${this.getErrorMessage(error)}`;
      return null;
    }
  }

  private getHttpError(error: unknown): string {
    const maybeError = error as { message?: string; status?: number; error?: unknown };
    const status = maybeError?.status ? `HTTP ${maybeError.status}` : 'Request failed';

    if (typeof maybeError?.error === 'string') {
      return `${status}: ${maybeError.error}`;
    }

    if (maybeError?.error && typeof maybeError.error === 'object') {
      return `${status}: ${JSON.stringify(maybeError.error)}`;
    }

    return `${status}: ${maybeError?.message ?? 'Unknown error'}`;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
