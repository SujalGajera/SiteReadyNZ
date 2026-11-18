// src/utils/checklistTemplates.ts — The questions a staff member answers for each kind of equipment.
// When a manager assigns an inspection, the template for that equipment type is copied into the
// inspection, so later edits to a template never change inspections that already exist.
//
// `severity` says how serious a failed answer is: critical means the item may not work in an emergency.

import type { EquipmentType } from '../models/Equipment';

export type ItemSeverity = 'low' | 'medium' | 'critical';

export interface ChecklistTemplateItem {
  itemId: string;
  category: string;
  description: string;
  severity: ItemSeverity;
}

const fireExtinguisher: ChecklistTemplateItem[] = [
  { itemId: 'fe-gauge', category: 'Working condition', description: 'Pressure gauge needle is in the green zone', severity: 'critical' },
  { itemId: 'fe-pin', category: 'Working condition', description: 'Safety pin and tamper seal are in place', severity: 'critical' },
  { itemId: 'fe-hose', category: 'Working condition', description: 'Hose and nozzle are clear and undamaged', severity: 'medium' },
  { itemId: 'fe-body', category: 'Physical condition', description: 'Body has no dents, rust or leaks', severity: 'medium' },
  { itemId: 'fe-tag', category: 'Physical condition', description: 'Service tag is present and in date', severity: 'medium' },
  { itemId: 'fe-mount', category: 'Location', description: 'Mounted securely and not blocked', severity: 'medium' },
  { itemId: 'fe-sign', category: 'Location', description: 'Location sign is visible', severity: 'low' },
];

const firstAid: ChecklistTemplateItem[] = [
  { itemId: 'fa-contents', category: 'Contents', description: 'All items on the contents list are present', severity: 'critical' },
  { itemId: 'fa-dates', category: 'Contents', description: 'Nothing in the kit is past its expiry date', severity: 'critical' },
  { itemId: 'fa-sealed', category: 'Contents', description: 'Dressings and sterile items are sealed and dry', severity: 'medium' },
  { itemId: 'fa-box', category: 'Physical condition', description: 'Box is clean, closes properly and is not damaged', severity: 'low' },
  { itemId: 'fa-access', category: 'Location', description: 'Kit is easy to reach and not blocked', severity: 'medium' },
  { itemId: 'fa-sign', category: 'Location', description: 'Location sign is visible', severity: 'low' },
];

const aed: ChecklistTemplateItem[] = [
  { itemId: 'aed-status', category: 'Working condition', description: 'Status indicator shows the unit is ready', severity: 'critical' },
  { itemId: 'aed-pads', category: 'Working condition', description: 'Electrode pads are sealed and in date', severity: 'critical' },
  { itemId: 'aed-battery', category: 'Working condition', description: 'Battery is in date and not showing a warning', severity: 'critical' },
  { itemId: 'aed-case', category: 'Physical condition', description: 'Unit and carry case are clean and undamaged', severity: 'medium' },
  { itemId: 'aed-access', category: 'Location', description: 'Cabinet opens freely and the alarm works', severity: 'medium' },
  { itemId: 'aed-sign', category: 'Location', description: 'AED sign is visible from a distance', severity: 'low' },
];

const safetySign: ChecklistTemplateItem[] = [
  { itemId: 'sg-legible', category: 'Condition', description: 'Sign is clean, legible and not faded', severity: 'medium' },
  { itemId: 'sg-fixed', category: 'Condition', description: 'Sign is firmly fixed and undamaged', severity: 'low' },
  { itemId: 'sg-light', category: 'Visibility', description: 'Lighting or illumination works, if the sign has it', severity: 'critical' },
  { itemId: 'sg-clear', category: 'Visibility', description: 'Nothing blocks the view of the sign', severity: 'medium' },
];

const other: ChecklistTemplateItem[] = [
  { itemId: 'ot-condition', category: 'Condition', description: 'Item is undamaged and looks as expected', severity: 'medium' },
  { itemId: 'ot-working', category: 'Condition', description: 'Item works as intended', severity: 'critical' },
  { itemId: 'ot-access', category: 'Location', description: 'Item is accessible and not blocked', severity: 'medium' },
];

const templates: Record<EquipmentType, ChecklistTemplateItem[]> = {
  fire_extinguisher: fireExtinguisher,
  first_aid: firstAid,
  aed,
  safety_sign: safetySign,
  other,
};

/** A fresh copy of the checklist for this kind of equipment, every item still unanswered */
export function buildChecklist(type: EquipmentType) {
  return templates[type].map((item) => ({ ...item, result: 'not_checked' as const, notes: '' }));
}
