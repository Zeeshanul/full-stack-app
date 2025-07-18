import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartCounterComponent } from './smart-counter-component';

describe('SmartCounterComponent', () => {
  let component: SmartCounterComponent;
  let fixture: ComponentFixture<SmartCounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SmartCounterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartCounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
