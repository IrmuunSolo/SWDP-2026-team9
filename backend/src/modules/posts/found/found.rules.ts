import { foundPostSchema } from '@campusfind/contracts';
// Narmandakh: US-07. Contract changes require the shared-contract review first.
export const validateFoundPost = (input: unknown) => foundPostSchema.parse(input);
