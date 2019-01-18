import { NgModule } from "@angular/core";
import { Http, BaseRequestOptions } from "@angular/http";
import { HttpClientModule } from "@angular/common/http";
import { MAT_CHIPS_DEFAULT_OPTIONS, MatCardModule, MatNativeDateModule } from "@angular/material";
import { MockBackend } from "@angular/http/testing";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { LocationStrategy, HashLocationStrategy } from "@angular/common";
import { ReactiveFormsModule, NG_VALIDATORS, NG_ASYNC_VALIDATORS } from "@angular/forms";
import { NgbDatepickerModule, NgbRatingModule, NgbTimepickerModule } from "@ng-bootstrap/ng-bootstrap";
import { BsDatepickerModule, TimepickerModule } from "ngx-bootstrap";

import { DYNAMIC_VALIDATORS, DynamicFormsCoreModule, Validator, ValidatorFactory } from "@wf-dynamic-forms/core";
import { DynamicFormsBasicUIModule } from "@wf-dynamic-forms/ui-basic";
import { DynamicFormsBootstrapUIModule } from "@wf-dynamic-forms/ui-bootstrap";
import { DynamicFormsFoundationUIModule } from "@wf-dynamic-forms/ui-foundation";
import { DynamicFormsKendoUIModule } from "@wf-dynamic-forms/ui-kendo";
import { DynamicFormsMaterialUIModule } from "@wf-dynamic-forms/ui-material";
import { DynamicFormsNGBootstrapUIModule } from "@wf-dynamic-forms/ui-ng-bootstrap";
import { DynamicFormsPrimeNGUIModule } from "@wf-dynamic-forms/ui-primeng";

import { BasicSampleFormComponent } from "./ui-basic/basic-sample-form.component";
import { BootstrapSampleFormComponent } from "./ui-bootstrap/bootstrap-sample-form.component";
import { FoundationSampleFormComponent } from "./ui-foundation/foundation-sample-form.component";
import { KendoSampleFormComponent } from "./ui-kendo/kendo-sample-form.component";
import { MaterialSampleFormComponent } from "./ui-material/material-sample-form.component";
import { NGBootstrapSampleFormComponent } from "./ui-ng-bootstrap/ng-bootstrap-sample-form.component";
import { PrimeNGSampleFormComponent } from "./ui-primeng/primeng-sample-form.component";

import { ValidationMessageComponent } from "./validation-message/validation-message.component";
import { AppRoutingModule } from './app.routing.module';
import { AppComponent } from './app.component';
import {
    customValidator,
    customDateRangeValidator,
    customForbiddenValidator,
    customAsyncFormGroupValidator
} from "./app.validators";

export function mockBackendFactory(mockBackend: MockBackend, baseRequestOptions: BaseRequestOptions) {
    return new Http(mockBackend, baseRequestOptions);
}

@NgModule({

    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        HttpClientModule,
        AppRoutingModule,
        MatNativeDateModule,
        MatCardModule,
        BsDatepickerModule.forRoot(),
        TimepickerModule.forRoot(),
        NgbDatepickerModule,
        NgbRatingModule,
        NgbTimepickerModule,
        DynamicFormsCoreModule,
        DynamicFormsBasicUIModule,
        DynamicFormsBootstrapUIModule,
        DynamicFormsFoundationUIModule,
        DynamicFormsKendoUIModule,
        DynamicFormsMaterialUIModule,
        DynamicFormsNGBootstrapUIModule,
        DynamicFormsPrimeNGUIModule
    ],
    declarations: [
        BasicSampleFormComponent,
        BootstrapSampleFormComponent,
        FoundationSampleFormComponent,
        KendoSampleFormComponent,
        MaterialSampleFormComponent,
        NGBootstrapSampleFormComponent,
        PrimeNGSampleFormComponent,
        ValidationMessageComponent,
        AppComponent
    ],
    providers: [
        BaseRequestOptions,
        MockBackend,
        {
            provide: Http,
            deps: [MockBackend, BaseRequestOptions],
            useFactory: mockBackendFactory
        },
        {
            provide: LocationStrategy,
            useClass: HashLocationStrategy
        },
        {
            provide: NG_VALIDATORS,
            useValue: customValidator,
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useValue: customDateRangeValidator,
            multi: true
        },
        {
            provide: NG_ASYNC_VALIDATORS,
            useValue: customAsyncFormGroupValidator,
            multi: true
        },
        {
            provide: DYNAMIC_VALIDATORS,
            useValue: new Map<string, Validator | ValidatorFactory>([
                ["customValidator", customValidator],
                ["customDateRangeValidator", customDateRangeValidator],
                ["customForbiddenValidator", customForbiddenValidator],
                ["customAsyncFormGroupValidator", customAsyncFormGroupValidator]
            ])
        },
        {
            provide: MAT_CHIPS_DEFAULT_OPTIONS,
            useValue: {
                separatorKeyCodes: [13, 188]
            }
        }
    ],
    bootstrap: [AppComponent]
})

export class AppModule {
}
