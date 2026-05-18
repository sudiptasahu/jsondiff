import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';

type ThemeMode = 'system' | 'light' | 'dark';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  @HostBinding('attr.data-theme') get dataTheme(): 'light' | 'dark' {
    return this.getEffectiveTheme();
  }

  themeMode: ThemeMode = 'system';
  isThemeMenuOpen = false;
  private mediaQuery: MediaQueryList | null = null;
  private readonly handleThemeChange = () => {
    if (this.themeMode === 'system') {
      this.themeMode = 'system';
    }
  };

  ngOnInit(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', this.handleThemeChange);
  }

  ngOnDestroy(): void {
    this.mediaQuery?.removeEventListener('change', this.handleThemeChange);
  }

  setThemeMode(themeMode: ThemeMode): void {
    this.themeMode = themeMode;
    this.isThemeMenuOpen = false;
  }

  toggleThemeMenu(): void {
    this.isThemeMenuOpen = !this.isThemeMenuOpen;
  }

  getThemeLabel(): string {
    if (this.themeMode === 'light') {
      return 'Light';
    }

    if (this.themeMode === 'dark') {
      return 'Dark';
    }

    return 'System';
  }

  getEffectiveTheme(): 'light' | 'dark' {
    if (this.themeMode === 'light') {
      return 'light';
    }

    if (this.themeMode === 'dark') {
      return 'dark';
    }

    return this.mediaQuery?.matches ? 'dark' : 'light';
  }
}
