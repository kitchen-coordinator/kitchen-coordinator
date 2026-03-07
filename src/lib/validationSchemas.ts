import * as Yup from 'yup';

export const AddProduceSchema = Yup.object({
  name: Yup.string().required(),
  type: Yup.string().required(),
  location: Yup.string().required(),
  storage: Yup.string().required(),
  quantity: Yup.number().positive().required(),
  unit: Yup.string().required(),
  expiration: Yup.date()
    .nullable()
    .transform((curr: Date | null, orig: string) => (orig === '' ? null : curr))
    .notRequired(),
  owner: Yup.string().required(),
  image: Yup.string().nullable().notRequired(),
  restockThreshold: Yup.number()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .min(0, 'Threshold cannot be negative')
    .notRequired(),
});

export const EditProduceSchema = Yup.object({
  id: Yup.number().required(),
  name: Yup.string().required(),
  type: Yup.string().required(),
  location: Yup.string().required(),
  storage: Yup.string().required(),
  quantity: Yup.number().positive().required(),
  unit: Yup.string().required(),
  expiration: Yup.date()
    .nullable()
    .transform((curr: Date | null, orig: string) => (orig === '' ? null : curr))
    .notRequired(),
  owner: Yup.string().required(),
  image: Yup.string().nullable().notRequired(),

  restockThreshold: Yup.number()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .min(0, 'Threshold cannot be negative')
    .notRequired(),
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
});

export const EditShoppingListSchema = Yup.object({
  id: Yup.number().required('ID is required'),
  name: Yup.string().required('List name is required'),
  owner: Yup.string().required('Owner is required'),
});

export const AddShoppingListItemSchema = Yup.object({
  name: Yup.string().required('Item name is required'),
  quantity: Yup.number()
    .typeError('Quantity must be a number')
    .positive('Must be greater than 0')
    .required('Quantity is required'),
  unit: Yup.string().optional(),
  price: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? 0 : value))
    .typeError('Price must be a number')
    .min(0, 'Price cannot be negative')
    .optional()
    .nullable(),
  shoppingListId: Yup.number()
    .typeError('A shopping list must be selected')
    .required('Shopping list is required'),
});

export const EditShoppingListItemSchema = Yup.object({
  id: Yup.number().required('ID is required'),
  name: Yup.string().required('Item name is required'),
  quantity: Yup.number().positive('Quantity must be positive').required('Quantity is required'),
  unit: Yup.string().nullable().notRequired(),
  price: Yup.number()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .min(0, 'Price cannot be negative')
    .notRequired(),
  restockTrigger: Yup.string().nullable().notRequired(),
  customThreshold: Yup.number()
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .min(0, 'Threshold cannot be negative')
    .notRequired(),
});
