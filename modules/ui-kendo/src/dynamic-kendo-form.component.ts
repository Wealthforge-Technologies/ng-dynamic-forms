import { Component, ContentChildren, EventEmitter, Input, Output, QueryList, ViewChildren } from "@angular/core";
import { FormGroup } from "@angular/forms";
import {
    DynamicFormComponent,
    DynamicFormControlEvent,
    DynamicFormControlModel,
    DynamicTemplateDirective
} from "@ng2-dynamic-forms/core";
import { DynamicKendoFormControlComponent } from "./dynamic-kendo-form-control.component";

@Component({

    moduleId: module.id,
    selector: "dynamic-kendo-form",
    templateUrl: "./dynamic-kendo-form.component.html"
})
export class DynamicKendoFormComponent extends DynamicFormComponent {

    @Input() group: FormGroup;
    @Input() hasErrorMessaging: boolean = false;
    @Input() model: DynamicFormControlModel[];

    @Output() blur: EventEmitter<DynamicFormControlEvent> = new EventEmitter<DynamicFormControlEvent>();
    @Output() change: EventEmitter<DynamicFormControlEvent> = new EventEmitter<DynamicFormControlEvent>();
    @Output() focus: EventEmitter<DynamicFormControlEvent> = new EventEmitter<DynamicFormControlEvent>();

    @ContentChildren(DynamicTemplateDirective) templates: QueryList<DynamicTemplateDirective>;

    @ViewChildren(DynamicKendoFormControlComponent) components: QueryList<DynamicKendoFormControlComponent>;
}