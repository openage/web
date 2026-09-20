import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogDirective } from './dialog.directive';

@Component({
    template: '<button oaDialog></button>'
})
class TestHostComponent { }

describe('DialogDirective', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let directive: DialogDirective;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DialogDirective, TestHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        directive = fixture.debugElement.children[0].injector.get(DialogDirective);
    });

    it('should clamp popup position within viewport bounds', () => {
        const result = directive.clampToViewport(2000, 1500, 320, 240);

        expect(result.left).toBeLessThanOrEqual(window.innerWidth - 12);
        expect(result.top).toBeLessThanOrEqual(window.innerHeight - 12);
        expect(result.left).toBeGreaterThanOrEqual(12);
        expect(result.top).toBeGreaterThanOrEqual(12);
    });
});
