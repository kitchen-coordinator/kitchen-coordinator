import * as Yup from 'yup';
import { parseFractionInput } from './fractions';

const fractionNumberField = (label: string, allowZero = false) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  Yup.mixed<number | string>()
    .transform((curr, orig) => {
      if (orig === '' || orig === null || typeof orig === 'undefined') return null;
      try {
        return parseFractionInput(orig);
      } catch {
        return orig;
      }
    })
    .test('is-valid-fraction-number', `${label} must be a valid number, fraction, or mixed number`, (value) => {
      if (value === null || typeof value === 'undefined') return true;
      return typeof value === 'number' && Number.isFinite(value);
    })
    .test(
      'is-positive-fraction-number',
      allowZero ? `${label} cannot be negative` : `${label} must be greater than 0`,
      (value) => {
        if (value === null || typeof value === 'undefined') return true;
        if (typeof value !== 'number') return false;
        return allowZero ? value >= 0 : value > 0;
      },
    );

export const AddProduceSchema = Yup.object({
  name: Yup.string().required(),
  type: Yup.string().required(),
  location: Yup.string().required(),
  storage: Yup.string().required(),
  quantity: fractionNumberField('Quantity').required(),
  unit: Yup.string().required(),
  expiration: Yup.date()
    .nullable()
    .transform((curr: Date | null, orig: string) => (orig === '' ? null : curr))
    .notRequired(),
  owner: Yup.string().required(),
  image: Yup.string().nullable().notRequired(),
  restockThreshold: fractionNumberField('Threshold', true)
    .nullable()
    .notRequired(),
  commonItemId: Yup.number().nullable().notRequired(),
});

export const EditProduceSchema = Yup.object({
  id: Yup.number().required(),
  name: Yup.string().required(),
  type: Yup.string().required(),
  location: Yup.string().required(),
  storage: Yup.string().required(),
  quantity: fractionNumberField('Quantity').required(),
  unit: Yup.string().required(),
  expiration: Yup.date()
    .nullable()
    .transform((curr: Date | null, orig: string) => (orig === '' ? null : curr))
    .notRequired(),
  owner: Yup.string().required(),
  image: Yup.string().nullable().notRequired(),
  restockThreshold: fractionNumberField('Threshold', true)
    .nullable()
    .notRequired(),
  commonItemId: Yup.number().nullable().notRequired(),
});

export const AddLocationSchema = Yup.object({
  name: Yup.string().required('Location name is required'),
  owner: Yup.string().required('Owner is required'),
});

export const AddShoppingListSchema = Yup.object({
  name: Yup.string().required('List name is required'),
  owner: Yup.string()
    .required('You must be signed in to create a list')
    .min(1),
  deadline: Yup.date()
    .nullable()
    .transform((curr: Date | null, orig: string) => (orig === '' ? null : curr))
    .notRequired(),
  location: Yup.string().nullable().notRequired(),
  budgetLimit: Yup.number()
    .typeError('Budget must be a number')
    .nullable()
    .transform((curr, orig) => {
      if (orig === '' || orig === null || typeof orig === 'undefined') return null;
      return Number.isNaN(curr) ? null : curr;
    })
    .min(0, 'Budget cannot be negative')
    .notRequired(),
});

export const EditShoppingListSchema = Yup.object({
  id: Yup.number().required('ID is required'),
  name: Yup.string().required('List name is required'),
  owner: Yup.string().required('Owner is required'),
  deadline: Yup.date()
    .nullable()
    .transform((curr: Date | null, orig: string) => (orig === '' ? null : curr))
    .notRequired(),
  location: Yup.string().nullable().notRequired(),
  budgetLimit: Yup.number()
    .typeError('Budget must be a number')
    .nullable()
    .transform((curr, orig) => {
      if (orig === '' || orig === null || typeof orig === 'undefined') return null;
      return Number.isNaN(curr) ? null : curr;
    })
    .min(0, 'Budget cannot be negative')
    .notRequired(),
});

export const AddShoppingListItemSchema = Yup.object({
  name: Yup.string().required('Item name is required'),
  quantity: fractionNumberField('Quantity')
    .required('Quantity is required'),
  unit: Yup.string().optional(),
  price: Yup.number()
    .typeError('Price must be a number')
    .nullable()
    .transform((curr, orig) => {
      if (orig === '' || orig === null || typeof orig === 'undefined') return null;
      return Number.isNaN(curr) ? null : curr;
    })
    .min(0, 'Price cannot be negative')
    .notRequired(),
  shoppingListId: Yup.number()
    .typeError('A shopping list must be selected')
    .required('Shopping list is required'),
});

export const EditShoppingListItemSchema = Yup.object({
  id: Yup.number().required('ID is required'),
  name: Yup.string().required('Item name is required'),
  quantity: fractionNumberField('Quantity')
    .required('Quantity is required'),
  unit: Yup.string().nullable().notRequired(),
  price: Yup.number()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .min(0, 'Price cannot be negative')
    .notRequired(),
  restockTrigger: Yup.string().nullable().notRequired(),
  customThreshold: fractionNumberField('Threshold', true)
    .nullable()
    .notRequired(),
});

export const CommonItemSchema = Yup.object({
  owner: Yup.string().required('Owner is required'),
  name: Yup.string().trim().required('Common item name is required'),
  displayUnit: Yup.string().trim().required('Display unit is required'),
  normalizedQuantityPerUnit: fractionNumberField('Normalized quantity')
    .required('Normalized quantity is required'),
  normalizedUnit: Yup.string().required('Normalized unit is required'),
});
