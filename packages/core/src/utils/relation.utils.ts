import { FormGroup, FormControl, AbstractControl } from "@angular/forms";
import { DynamicFormControlModel } from "../model/dynamic-form-control.model";
import {
    DynamicFormControlRelation,
    DynamicFormControlRelationGroup,
    DYNAMIC_FORM_CONTROL_ACTION_DISABLE,
    DYNAMIC_FORM_CONTROL_ACTION_ENABLE,
    DYNAMIC_FORM_CONTROL_ACTION_HIDDEN,
    DYNAMIC_FORM_CONTROL_ACTION_VISIBLE,
    DYNAMIC_FORM_CONTROL_CONNECTIVE_AND,
    DYNAMIC_FORM_CONTROL_CONNECTIVE_OR,
    EnumComparisonDataSources
} from "../model/misc/dynamic-form-control-relation.model";
import { DynamicFormLayout } from "../service/dynamic-form-layout.service";
import { getPropertyByPath } from "./json.utils";

export function findActivationRelations(relGroups: DynamicFormControlRelationGroup[]): DynamicFormControlRelationGroup[] | null {

    let rel = relGroups.filter(rel => {
        return [
            DYNAMIC_FORM_CONTROL_ACTION_DISABLE,
            DYNAMIC_FORM_CONTROL_ACTION_ENABLE,
            DYNAMIC_FORM_CONTROL_ACTION_HIDDEN,
            DYNAMIC_FORM_CONTROL_ACTION_VISIBLE
        ].includes(rel.action);
    });

    return rel !== undefined ? rel : null;
}

export function getRelatedFormControls(model: DynamicFormControlModel, controlGroup: FormGroup): FormControl[] {

    const controls: FormControl[] = [];

    model.relation.forEach(relGroup => relGroup.when.forEach(rel => {
        if (model.id === rel.id) {
            throw new Error(`FormControl ${model.id} cannot depend on itself`);
        }

        const control = getControl(rel.id, controlGroup);
        if (control && !controls.some(controlElement => controlElement === control)) {
            controls.push(control);
        }
    }));

    return controls;
}

/**
 * Gets a child control in the specified control, or in any of the
 * control's parents.
 * @param id
 * @param controlToSearch
 */
export function getControl(id: string, controlToSearch: AbstractControl): FormControl | null | undefined {
    let control: FormControl | null | undefined = controlToSearch.get(id) as FormControl;
    if (!control && controlToSearch.parent !== undefined) {
        control = getControl(id, controlToSearch.parent);
    }
    return control;
}

function compare(rel: DynamicFormControlRelation, control: AbstractControl | null, layout: DynamicFormLayout, ): boolean {
    if (!rel.comparisonDataSource || rel.comparisonDataSource === EnumComparisonDataSources.FormControl) {
        // compare relation value against a form control's value
        if (control) {
            return rel.value === control.value || rel.status === control.status;
        } else {
            // if relation comparison data source is control and no matching control was found then throw error
            throw TypeError("control cannot be blank");
        }
    } else if (rel.comparisonDataSource === EnumComparisonDataSources.JSON) {
        //  compare relation value against a JSON property
        return rel.value === getPropertyByPath(layout["store"], rel.id);
    } else {
        throw RangeError(`invalid comparison data source: ${rel.comparisonDataSource}`);
    }
}

export function isFormControlToBeToggled(relGroup: DynamicFormControlRelationGroup, _formGroup: FormGroup, _layout: DynamicFormLayout): boolean {
    let formGroup: FormGroup = _formGroup;

    return relGroup.when.reduce((toBeToggled: boolean, rel: DynamicFormControlRelation, index: number) => {

        const control = (!rel.comparisonDataSource || rel.comparisonDataSource === EnumComparisonDataSources.FormControl) ? getControl(rel.id, formGroup) : null;
        const isStore = rel.comparisonDataSource === EnumComparisonDataSources.JSON;

        if ((control || isStore) && [DYNAMIC_FORM_CONTROL_ACTION_DISABLE, DYNAMIC_FORM_CONTROL_ACTION_HIDDEN].includes(relGroup.action)) {

            if (index > 0 && relGroup.connective === DYNAMIC_FORM_CONTROL_CONNECTIVE_AND && !toBeToggled) {
                return false;
            }

            if (index > 0 && relGroup.connective === DYNAMIC_FORM_CONTROL_CONNECTIVE_OR && toBeToggled) {
                return true;
            }

            return compare(rel, control as AbstractControl, _layout);
        }

        if ((control || isStore) && [DYNAMIC_FORM_CONTROL_ACTION_ENABLE, DYNAMIC_FORM_CONTROL_ACTION_VISIBLE].includes(relGroup.action)) {

            if (index > 0 && relGroup.connective === DYNAMIC_FORM_CONTROL_CONNECTIVE_AND && toBeToggled) {
                return true;
            }

            if (index > 0 && relGroup.connective === DYNAMIC_FORM_CONTROL_CONNECTIVE_OR && !toBeToggled) {
                return false;
            }

            return !compare(rel, control as AbstractControl, _layout);
        }

        return false;

    }, false);
}