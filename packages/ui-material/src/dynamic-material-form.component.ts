import { Component, ContentChildren, EventEmitter, Input, Output, QueryList, ViewChildren, DoCheck } from "@angular/core";
import { FormGroup } from "@angular/forms";
import {
    DynamicFormComponent,
    DynamicFormControlEvent,
    DynamicFormModel,
    DynamicFormLayout,
    DynamicFormLayoutService,
    DynamicFormService,
    DynamicTemplateDirective,
} from "@wf-dynamic-forms/core";
import { DynamicMaterialFormControlContainerComponent } from "./dynamic-material-form-control-container.component";

@Component({
    selector: "dynamic-material-form",
    templateUrl: "./dynamic-material-form.component.html"
})
export class DynamicMaterialFormComponent extends DynamicFormComponent implements DoCheck {

    @Input("group")      formGroup:      FormGroup;
    @Input("model")      formModel:      DynamicFormModel;
    @Input("layout")     formLayout:     DynamicFormLayout;
    @Input("reduxStore") formReduxStore: string; // redux store format must be stringified JSON

    @Output() blur: EventEmitter<DynamicFormControlEvent> = new EventEmitter<DynamicFormControlEvent>();
    @Output() change: EventEmitter<DynamicFormControlEvent> = new EventEmitter<DynamicFormControlEvent>();
    @Output() focus: EventEmitter<DynamicFormControlEvent> = new EventEmitter<DynamicFormControlEvent>();
    @Output("matEvent") customEvent: EventEmitter<DynamicFormControlEvent> = new EventEmitter<DynamicFormControlEvent>();

    @ContentChildren(DynamicTemplateDirective) templates: QueryList<DynamicTemplateDirective>;

    @ViewChildren(DynamicMaterialFormControlContainerComponent) components: QueryList<DynamicMaterialFormControlContainerComponent>;

    constructor(protected formService: DynamicFormService, protected layoutService: DynamicFormLayoutService) {
        super(formService, layoutService);
    }

    ngDoCheck() {
        // due to time constraints, just piggyback redux store content on formLayout
        // (vs. figuring out how to pass redux store down the stack as its own property)
        this.formLayout["store"] = JSON.parse(JSON.stringify(this.formReduxStore));
    }
}