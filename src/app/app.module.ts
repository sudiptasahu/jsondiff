import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ApiCompareComponent } from './components/api-compare.component';
import { JsonTextCompareComponent } from './components/json-text-compare.component';
import { JsonDiffViewerComponent } from './components/json-diff-viewer.component';

@NgModule({
  declarations: [
    AppComponent,
    ApiCompareComponent,
    JsonTextCompareComponent,
    JsonDiffViewerComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
