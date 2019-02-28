import {
    ComponentFactoryResolver,
    ComponentRef,
    EventEmitter,
    OnChanges,
    OnDestroy,
    QueryList,
    SimpleChange,
    SimpleChanges,
    Type,
    ViewContainerRef
} from "@angular/core";
import { FormControl, FormGroup, AbstractControl, FormArray } from "@angular/forms";
import { Subscription } from "rxjs";
import {
    DynamicFormControlCustomEvent,
    DynamicFormControlEvent,
    DynamicFormControlEventType,
    isDynamicFormControlEvent
} from "./dynamic-form-control.event";
import { DynamicFormControlModel } from "../model/dynamic-form-control.model";
import { DynamicFormValueControlModel } from "../model/dynamic-form-value-control.model";
import {
    DynamicFormArrayGroupModel,
    DYNAMIC_FORM_CONTROL_TYPE_ARRAY
} from "../model/form-array/dynamic-form-array.model";
import { DYNAMIC_FORM_CONTROL_TYPE_CHECKBOX } from "../model/checkbox/dynamic-checkbox.model";
import {
    DynamicInputModel,
    DYNAMIC_FORM_CONTROL_TYPE_INPUT,
    DYNAMIC_FORM_CONTROL_INPUT_TYPE_FILE
} from "../model/input/dynamic-input.model";
import {
    DynamicFormControlLayout,
    DynamicFormControlLayoutContext,
    DynamicFormControlLayoutPlace
} from "../model/misc/dynamic-form-control-layout.model";
import { DynamicFormControlRelationGroup,
         DYNAMIC_FORM_CONTROL_ACTION_DISABLE,
         DYNAMIC_FORM_CONTROL_ACTION_ENABLE,
         DYNAMIC_FORM_CONTROL_ACTION_HIDDEN,
         DYNAMIC_FORM_CONTROL_ACTION_VISIBLE } from "../model/misc/dynamic-form-control-relation.model";
import { DynamicTemplateDirective } from "../directive/dynamic-template.directive";
import { DynamicFormLayout, DynamicFormLayoutService } from "../service/dynamic-form-layout.service";
import { DynamicFormValidationService } from "../service/dynamic-form-validation.service";
import { findActivationRelations, getRelatedFormControls, isFormControlToBeToggled } from "../utils/relation.utils";
import { DynamicFormControl } from "./dynamic-form-control.interface";
import { isString } from "../utils/core.utils";
import { getControlPath } from "../utils/form.utils";
import { distinctUntilChanged } from "rxjs/operators";

export abstract class DynamicFormControlContainerComponent implements OnChanges, OnDestroy {

    context: DynamicFormArrayGroupModel | null = null;
    control: FormControl;
    group: FormGroup;
    hasFocus: boolean;
    layout: DynamicFormLayout;
    model: DynamicFormControlModel;

    contentTemplateList: QueryList<DynamicTemplateDirective> | undefined;
    inputTemplateList: QueryList<DynamicTemplateDirective> | undefined;

    blur: EventEmitter<DynamicFormControlEvent>;
    change: EventEmitter<DynamicFormControlEvent>;
    customEvent: EventEmitter<DynamicFormControlEvent> | undefined;
    focus: EventEmitter<DynamicFormControlEvent>;

    componentViewContainerRef: ViewContainerRef;

    protected componentRef: ComponentRef<DynamicFormControl>;
    //protected viewRefs: EmbeddedViewRef<DynamicFormControlModel>[] = [];
    protected componentSubscriptions: Subscription[] = [];
    protected subscriptions: Subscription[] = [];

    protected constructor(protected componentFactoryResolver: ComponentFactoryResolver,
                          protected layoutService: DynamicFormLayoutService,
                          protected validationService: DynamicFormValidationService) { }

    ngOnChanges(changes: SimpleChanges) {

        let groupChange = changes["group"] as SimpleChange,
            modelChange = changes["model"] as SimpleChange;

        if (modelChange) {

            this.destroyFormControlComponent();
            //this.removeTemplates();

            this.createFormControlComponent();
            //this.embedTemplates();
        }

        if (groupChange || modelChange) {

            if (this.model) {

                this.unsubscribe();

                if (this.group) {

                    this.control = this.group.get(this.model.id) as FormControl;
                    this.subscriptions.push(this.control.valueChanges.subscribe(value => this.onControlValueChanges(value)));
                }

                this.subscriptions.push(this.model.disabledUpdates.subscribe(value => this.onModelDisabledUpdates(value)));
                this.subscriptions.push(this.model.hiddenUpdates.subscribe(value => this.onModelHiddenUpdates(value, this.model.relation)));

                if (this.model instanceof DynamicFormValueControlModel) {

                    let model = this.model as DynamicFormValueControlModel<any>;

                    this.subscriptions.push(model.valueUpdates.subscribe(value => this.onModelValueUpdates(value)));
                }

                if (this.model.relation.length > 0) {
                    this.setControlRelations();
                }
            }
        }
    }

    ngOnDestroy() {

        this.destroyFormControlComponent();
        this.unsubscribe();
    }

    abstract get componentType(): Type<DynamicFormControl> | null;

    get errorMessages(): string[] {
        return this.validationService.createErrorMessages(this.control, this.model);
    }

    get hasHint(): boolean {
        return isString((this.model as DynamicFormValueControlModel<any>).hint);
    }

    get hasLabel(): boolean {
        return isString(this.model.label);
    }

    get isCheckbox(): boolean {
        return this.model.type === DYNAMIC_FORM_CONTROL_TYPE_CHECKBOX;
    }

    get elementId(): string {
        return this.layoutService.getElementId(this.model);
    }

    get isInvalid(): boolean {
        return this.control.invalid;
    }

    get isValid(): boolean {
        return this.control.valid;
    }

    get showErrorMessages(): boolean {
        return this.model.hasErrorMessages && this.control.touched && !this.hasFocus && this.isInvalid;
    }

    get templates(): QueryList<DynamicTemplateDirective> | undefined {
        return this.inputTemplateList !== undefined ? this.inputTemplateList : this.contentTemplateList;
    }

    get startTemplate(): DynamicTemplateDirective | undefined {
        return this.model.type !== DYNAMIC_FORM_CONTROL_TYPE_ARRAY ?
            this.layoutService.getStartTemplate(this.model, this.templates) : undefined;
    }

    get endTemplate(): DynamicTemplateDirective | undefined {
        return this.model.type !== DYNAMIC_FORM_CONTROL_TYPE_ARRAY ?
            this.layoutService.getEndTemplate(this.model, this.templates) : undefined;
    }

    getClass(context: DynamicFormControlLayoutContext, place: DynamicFormControlLayoutPlace, model: DynamicFormControlModel = this.model): string {

        let controlLayout = (this.layout && this.layout[model.id]) || model.layout as DynamicFormControlLayout;

        return this.layoutService.getClass(controlLayout, context, place);
    }

    getRootFormGroup(control: AbstractControl): FormGroup {
        if (DynamicFormControlModel.rootFormGroup) {
            return DynamicFormControlModel.rootFormGroup;
        } else if (!control.parent) {
            return DynamicFormControlModel.rootFormGroup = control as FormGroup;
        }

        return this.getRootFormGroup(control.parent);
    }

    protected createFormControlComponent(): void {

        let componentType = this.componentType;

        if (componentType !== null) {

            let componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentType);

            this.componentViewContainerRef.clear();
            this.componentRef = this.componentViewContainerRef.createComponent(componentFactory);

            let instance = this.componentRef.instance;

            instance.group = this.group;
            instance.layout = this.layout;
            instance.model = this.model as any;

            if (this.templates) {
                instance.templates = this.templates;
            }

            this.componentSubscriptions.push(instance.blur.subscribe(($event: any) => this.onBlur($event)));
            this.componentSubscriptions.push(instance.change.subscribe(($event: any) => this.onChange($event)));
            this.componentSubscriptions.push(instance.focus.subscribe(($event: any) => this.onFocus($event)));

            if (instance.customEvent !== undefined) {
                this.componentSubscriptions.push(
                    instance.customEvent.subscribe(($event: any) => this.onCustomEvent($event)));
            }
        }
    }

    protected destroyFormControlComponent(): void {

        if (this.componentRef) {

            this.componentSubscriptions.forEach(subscription => subscription.unsubscribe());
            this.componentSubscriptions = [];

            this.componentRef.destroy();
        }
    }
    /*
    protected embedTemplates(): void {

        const templates = this.layoutService.getIndexedTemplates(this.model, this.templates);

        if (Array.isArray(templates)) {

            templates.forEach(template => {

                const viewRef = this.componentViewContainerRef.createEmbeddedView(template.templateRef, this.model, template.index);
                this.viewRefs.push(viewRef);
            });
        }
    }

    protected removeTemplates(): void {
        this.viewRefs.forEach(viewRef => this.componentViewContainerRef.remove(this.componentViewContainerRef.indexOf(viewRef)));
    }
    */
    protected setControlRelations(): void {

        let relActivations = findActivationRelations(this.model.relation);

        if (relActivations !== null) {

            // for this relation, store its control path as well as all of its associated control paths
            // we'll use this mapping later when we toggle a form group/form array from hidden to visible
            const controlPath          = getControlPath(this.control, "");
            const relationControlPaths = DynamicFormControlModel.formRelationControlPathsWithRelationPaths.get(controlPath) || new Array<string>();

            relActivations.forEach(rel => {
                switch (rel.action) {
                    case DYNAMIC_FORM_CONTROL_ACTION_ENABLE:
                    case DYNAMIC_FORM_CONTROL_ACTION_DISABLE:
                        this.updateModelDisabled(rel);
                        getRelatedFormControls(this.model, this.group).forEach(control => {
                            const path = getControlPath(control, "");
                            if (relationControlPaths.indexOf(path) === -1) {
                                relationControlPaths.push(path);
                            }

                            // this.subscriptions.push(control.valueChanges.subscribe(() => this.updateModelDisabled(rel)));
                            // this.subscriptions.push(control.statusChanges.subscribe(() => this.updateModelDisabled(rel)));
                            this.subscriptions.push(control.valueChanges.pipe(distinctUntilChanged()).subscribe(() => this.updateModelDisabled(rel)));
                            this.subscriptions.push(control.statusChanges.pipe(distinctUntilChanged()).subscribe(() => this.updateModelDisabled(rel)));
                        });
                        break;

                    case DYNAMIC_FORM_CONTROL_ACTION_HIDDEN:
                    case DYNAMIC_FORM_CONTROL_ACTION_VISIBLE:
                        this.updateModelHidden(rel);
                        getRelatedFormControls(this.model, this.group).forEach(control => {
                            const path = getControlPath(control, "");
                            if (relationControlPaths.indexOf(path) === -1) {
                                relationControlPaths.push(path);
                            }

                            // this.subscriptions.push(control.valueChanges.subscribe(() => this.updateModelHidden(rel)));
                            // this.subscriptions.push(control.statusChanges.subscribe(() => this.updateModelHidden(rel)));
                            this.subscriptions.push(control.valueChanges.pipe(distinctUntilChanged()).subscribe(() => this.updateModelHidden(rel)));
                            this.subscriptions.push(control.statusChanges.pipe(distinctUntilChanged()).subscribe(() => this.updateModelHidden(rel)));
                        });
                        break;
                }

            });

            DynamicFormControlModel.formRelationControlPathsWithRelationPaths.set(controlPath, relationControlPaths);
        }
    }

    protected createDynamicFormControlEvent($event: any, type: string): DynamicFormControlEvent {
        return {$event, context: this.context, control: this.control, group: this.group, model: this.model, type};
    }

    updateModelDisabled(relation: DynamicFormControlRelationGroup): void {

        this.model.disabledUpdates.next(isFormControlToBeToggled(relation, this.group, this.layout));
    }

    updateModelHidden(relation: DynamicFormControlRelationGroup): void {
        this.model.hiddenUpdates.next(isFormControlToBeToggled(relation, this.group, this.layout));
    }

    unsubscribe(): void {

        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.subscriptions = [];
    }

    onControlValueChanges(value: any): void {

        if (this.model instanceof DynamicFormValueControlModel) {

            let model = this.model as DynamicFormValueControlModel<any>;

            if (model.value !== value) {
                model.valueUpdates.next(value);
            }
        }
    }

    onModelValueUpdates(value: any): void {

        if (this.control.value !== value) {
            this.control.setValue(value);
        }
    }

    onModelDisabledUpdates(value: boolean): void {
        value ? this.control.disable() : this.control.enable();
    }

    onModelHiddenUpdates(value: boolean, relation: DynamicFormControlRelationGroup[]): void {
        if (value) {
            this.control.disable(); // *always* disable hidden controls so that validation rules don't fire
        } else if (this.control instanceof FormGroup || this.control instanceof FormArray) {
            this.control.enable();

            // NOTE: when we enable a FormGroup or FormArray, the default Angular functionality
            //       is to enable all child controls as well.
            //       this presents a problem for us b/c a child control may have a relation that,
            //       based on the values in other controls, dictates that the child control be disabled.
            //       therefore, we need to "fire/trigger" all relations for all child controls
            //
            // NOTE: cursory research and testing leads us to believe that the best way to "fire/trigger"
            //       a value/status change w/o actually changing anything is to invoke a form control's
            //       updateValueAndValidity() method.
            const rootFormGroup     = this.getRootFormGroup(this.control);
            const controlPath       = getControlPath(this.control, "");
            const arrProcessedPaths = Array<string>();

            // OPTION: 1 => more efficient than OPTION 2, but not well tested with form arrays
            DynamicFormControlModel.formRelationControlPathsWithRelationPaths.forEach((paths, key) => {
              if (key.startsWith(controlPath) && key !== controlPath) { // avoid infinite loop of enable/disable form controls
                  for (const path of paths) {
                    if (arrProcessedPaths.indexOf(path) === -1) {
                        const c = rootFormGroup.get(path);
                        if (c) {
                            c.updateValueAndValidity();
                        }

                        arrProcessedPaths.push(path);
                    }
                  }
              }
            });

            // OPTION: 2 => this works, but... not as efficient b/c updateValueAndValidity
            //              called on non-related form controls
            // for (const path of DynamicFormControlModel.formRelationControlPaths) {
            //     if (path.startsWith(controlPath)) { // avoid inifinte loop
            //         continue;
            //     }

            //     const c = rootFormGroup.get(path);
            //     if (c) {
            //         c.updateValueAndValidity();
            //     }
            // }
        } else if (this.control instanceof FormControl) { // only run the following on form controls (not form groups and arrays)
            // given that we *always* disable the control,
            // we need to *always* enable it *IF* there is no DISABLE relation
            // if there is a DISABLE relation, then we do nothing and defer to
            // the onModelDisabledUpdates function
            if (!relation.find(rel => [DYNAMIC_FORM_CONTROL_ACTION_DISABLE, DYNAMIC_FORM_CONTROL_ACTION_ENABLE].includes(rel.action))) {
                this.control.enable();
            }
        }
    }

    onChange($event: Event | DynamicFormControlEvent | any): void {

        if ($event && $event instanceof Event) { // native HTML5 change event

            if (this.model.type === DYNAMIC_FORM_CONTROL_TYPE_INPUT) {

                let model = this.model as DynamicInputModel;

                if (model.inputType === DYNAMIC_FORM_CONTROL_INPUT_TYPE_FILE) {

                    let inputElement: any = $event.target || $event.srcElement;

                    model.files = inputElement.files as FileList;
                }
            }

            this.change.emit(this.createDynamicFormControlEvent($event, DynamicFormControlEventType.Change));

        } else if (isDynamicFormControlEvent($event)) { // event bypass

            this.change.emit($event);

        } else { // custom library value change event

            this.change.emit(this.createDynamicFormControlEvent($event, DynamicFormControlEventType.Change));
        }
    }

    onBlur($event: FocusEvent | DynamicFormControlEvent | any): void {

        if (isDynamicFormControlEvent($event)) { // event bypass

            this.blur.emit($event);

        } else { // native HTML 5 or UI library blur event

            this.hasFocus = false;
            this.blur.emit(this.createDynamicFormControlEvent($event, DynamicFormControlEventType.Blur));
        }
    }

    onFocus($event: FocusEvent | DynamicFormControlEvent | any): void {

        if (isDynamicFormControlEvent($event)) { // event bypass

            this.focus.emit($event);

        } else { // native HTML 5 or UI library focus event

            this.hasFocus = true;
            this.focus.emit(this.createDynamicFormControlEvent($event, DynamicFormControlEventType.Focus));
        }
    }

    onCustomEvent($event: DynamicFormControlEvent | DynamicFormControlCustomEvent): void {

        let emitter = this.customEvent as EventEmitter<DynamicFormControlEvent>;

        if (isDynamicFormControlEvent($event)) { // child event bypass

            emitter.emit($event);

        } else { // native UI library custom event

            emitter.emit(this.createDynamicFormControlEvent($event.customEvent, $event.customEventType));
        }
    }
}
