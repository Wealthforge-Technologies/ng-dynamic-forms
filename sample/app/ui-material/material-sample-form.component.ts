import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { DynamicFormService, DynamicFormControlModel, DynamicFormLayout } from "@wf-dynamic-forms/core";
import { MATERIAL_SAMPLE_FORM_MODEL }  from "./material-sample-form.model";
import { MATERIAL_SAMPLE_FORM_LAYOUT } from "./material-sample-form.layout";
import { MATERIAL_SAMPLE_FORM_STORE }  from "./material-sample-form.store";
import { Observable } from "rxjs";
import { Store, select } from "@ngrx/store";
import { Increment, Decrement, Reset } from './ngrx/counter.actions';

@Component({
    moduleId: module.id,
    selector: "dynamic-material-sample-form",
    styleUrls: ["../../../node_modules/@angular/material/prebuilt-themes/indigo-pink.css"],
    templateUrl: "./material-sample-form.component.html",
    encapsulation: ViewEncapsulation.None
})
export class MaterialSampleFormComponent implements OnInit {

    formModel:      DynamicFormControlModel[] = MATERIAL_SAMPLE_FORM_MODEL;
    formGroup:      FormGroup;
    formLayout:     DynamicFormLayout         = MATERIAL_SAMPLE_FORM_LAYOUT;
    formReduxStore: string; //                   = MATERIAL_SAMPLE_FORM_STORE;

    count$: Observable<number>;

    constructor(private store: Store<{count: number}>, private formService: DynamicFormService, private cd: ChangeDetectorRef,) {
        this.count$ = store.pipe(select('count'));
        // store.pipe(select('count')).subscribe(val => this.formReduxStore = val);
    }

    ngOnInit() {
        this.formGroup = this.formService.createFormGroup(this.formModel);
    }

    ngAfterContentChecked() {
        // explicit change detection to avoid "expression-has-changed-after-it-was-checked-error" when setting enabled property on form controls
        this.cd.detectChanges();
    }

    increment() {
        this.store.dispatch(new Increment());
      }

      decrement() {
        this.store.dispatch(new Decrement());
      }

      reset() {
        this.store.dispatch(new Reset());
      }

    onBlur($event) {
        console.log(`Material blur event on: ${$event.model.id}: `, $event);
    }

    onChange($event) {
        console.log(`Material change event on: ${$event.model.id}: `, $event);
    }

    onFocus($event) {
        console.log(`Material focus event on: ${$event.model.id}: `, $event);
    }

    onMatEvent($event) {
        console.log(`Material ${$event.type} event on: ${$event.model.id}: `, $event);
    }

    test() {

    }

    submit() {
        if (this.formGroup.valid) {
            console.info("form group is valid");
        } else {
            console.warn("form group is invalid", this.formGroup);
        }
    }
}
