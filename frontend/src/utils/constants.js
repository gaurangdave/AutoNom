export const DAYS = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'];

export const ALLERGIES_LIST = [
  { name: 'Peanuts', icon: 'bowl-rice' },
  { name: 'Dairy', icon: 'cheese' },
  { name: 'Gluten', icon: 'bread-slice' },
  { name: 'Shellfish', icon: 'shrimp' },
  { name: 'Soy', icon: 'seedling' },
  { name: 'Eggs', icon: 'egg' },
  { name: 'Fish', icon: 'fish' },
  { name: 'Tree Nuts', icon: 'tree' },
];

export const WORKFLOW_STATUS = {
  IDLE: 'IDLE',
  STARTED: 'STARTED',
  MEAL_PLANNING_STARTED: 'MEAL_PLANNING_STARTED',
  AWAITING_USER_APPROVAL: 'AWAITING_USER_APPROVAL',
  MEAL_CHOICE_VERIFICATION_STARTED: 'MEAL_CHOICE_VERIFICATION_STARTED',
  ORDER_EXECUTION_STARTED: 'ORDER_EXECUTION_STARTED',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR'
};
