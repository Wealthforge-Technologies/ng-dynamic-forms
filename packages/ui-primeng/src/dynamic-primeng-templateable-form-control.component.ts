import { TemplateRef } from "@angular/core";
import { DynamicTemplateableFormControlComponent, DynamicTemplateDirective } from "@wf-dynamic-forms/core";

export abstract class DynamicPrimeNGTemplateableFormControlComponent extends DynamicTemplateableFormControlComponent {

    mapTemplate(template: DynamicTemplateDirective): DynamicTemplateDirective | TemplateRef<any> {
        return template.templateRef;
    }
}