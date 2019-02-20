export const DYNAMIC_FORM_CONTROL_ACTION_DISABLE = "DISABLE";
export const DYNAMIC_FORM_CONTROL_ACTION_ENABLE = "ENABLE";
export const DYNAMIC_FORM_CONTROL_ACTION_VISIBLE = "VISIBLE";
export const DYNAMIC_FORM_CONTROL_ACTION_HIDDEN = "HIDDEN";

export const DYNAMIC_FORM_CONTROL_CONNECTIVE_AND = "AND";
export const DYNAMIC_FORM_CONTROL_CONNECTIVE_OR = "OR";

export const enum EnumComparisonDataSources {
    FormControl = "FORM_CONTROL",
    JSON        = "JSON",
    API         = "API"
}

export interface DynamicFormControlRelation {

    id:                    string;
    comparisonDataSource?: EnumComparisonDataSources;
    comparative?:          string;
    status?:               string;
    value?:                any;
}

export interface DynamicFormControlRelationGroup {

    action:      string;
    connective?: string;
    when:        DynamicFormControlRelation[];
}